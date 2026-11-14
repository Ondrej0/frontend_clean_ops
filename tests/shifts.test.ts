import assert from "node:assert/strict";
import { test } from "node:test";
import { config } from "../src/config/config.ts";
import { clockingInformation, formatShiftTime, getShifts, groupShiftsByDay, londonDate, nextLondonMidnight, nextShiftRefresh, type Shift, type ShiftsResponse } from "../src/lib/shifts.ts";

const shift: Shift = {
    id: "shift", site: { id: "site", name: "Office" },
    scheduledStart: "2026-11-07T09:00:00+00:00", scheduledEnd: "2026-11-07T12:00:00+00:00",
    actualStart: null, actualEnd: null, status: "SCHEDULED",
    clockInOpensAt: "2026-11-07T08:30:00+00:00", clockInDeadline: "2026-11-07T14:00:00+00:00",
    clockOutDeadline: null, canClockIn: false, canClockOut: false, requiresManagerCorrection: false,
};
const response: ShiftsResponse = { timezone: "Europe/London", fromDate: "2026-11-04", toDate: "2026-11-10", shifts: [] };

test("empty responses retain all seven inclusive calendar days", () => {
    const days = groupShiftsByDay(response);
    assert.equal(days.length, 7);
    assert.equal(days[0].date, response.fromDate);
    assert.equal(days[6].date, response.toDate);
    assert.ok(days.every((day) => day.shifts.length === 0));
});

test("all statuses and overlapping overnight shifts remain visible exactly once", () => {
    const shifts: Shift[] = (["COMPLETED", "CANCELLED", "NO_SHOW", "IN_PROGRESS", "SCHEDULED"] as const)
        .map((status) => ({ ...shift, id: status, status }));
    shifts.push({ ...shift, id: "overnight", scheduledStart: "2026-11-03T22:00:00Z", scheduledEnd: "2026-11-04T06:00:00Z" });
    const days = groupShiftsByDay({ ...response, shifts });
    assert.equal(days[0].shifts[0].id, "overnight");
    assert.equal(days.flatMap((day) => day.shifts).length, 6);
    assert.equal(days[3].shifts.length, 5);
});

test("London formatting and grouping ignore the host timezone and respect BST", () => {
    assert.equal(londonDate("2026-07-01T23:30:00Z"), "2026-07-02");
    assert.equal(formatShiftTime("2026-07-01T23:30:00Z"), "00:30");
    assert.equal(formatShiftTime("2026-11-07T09:00:00+00:00"), "09:00");
});

test("availability follows backend flags, even outside the expected window", () => {
    const late = Date.parse("2026-11-07T19:00:00Z");
    assert.match(clockingInformation({ ...shift, canClockIn: true }, late)[0], /Clock-in available.*14:00/);
    assert.deepEqual(clockingInformation(shift, Date.parse("2026-11-07T10:00:00Z")), []);
    assert.match(clockingInformation({ ...shift, status: "IN_PROGRESS", actualStart: "2026-11-07T13:00:00Z", canClockOut: true, clockOutDeadline: "2026-11-07T18:00:00Z" }, late)[0], /Clock-out available.*18:00/);
});

test("opening and closed information uses supplied timestamps without changing status", () => {
    assert.match(clockingInformation(shift, Date.parse("2026-11-07T08:00:00Z"))[0], /Clock-in opens at.*08:30/);
    assert.deepEqual(clockingInformation(shift, Date.parse("2026-11-07T14:00:00.001Z")), ["Clock-in window closed"]);
    assert.deepEqual(clockingInformation(shift, Date.parse(shift.clockInDeadline)), []);
    assert.equal(shift.status, "SCHEDULED");
});

test("terminal statuses never advertise clocking and correction explains the missing end", () => {
    for (const status of ["COMPLETED", "CANCELLED", "NO_SHOW"] as const) {
        assert.deepEqual(clockingInformation({ ...shift, status, canClockIn: true, canClockOut: true }, Date.now()), []);
    }
    const information = clockingInformation({ ...shift, status: "IN_PROGRESS", requiresManagerCorrection: true, canClockOut: true }, Date.now());
    assert.equal(information[0], "Manager correction required");
    assert.match(information[1], /cannot resolve.*yourself/);
});

test("UK midnight refresh accounts for both DST transitions", () => {
    assert.equal(new Date(nextLondonMidnight(Date.parse("2026-03-29T00:00:00Z"))).toISOString(), "2026-03-29T23:00:00.000Z");
    assert.equal(new Date(nextLondonMidnight(Date.parse("2026-10-24T23:00:00Z"))).toISOString(), "2026-10-26T00:00:00.000Z");
});

test("refreshes just after each supplied boundary, then UK midnight", () => {
    const data = { ...response, shifts: [{ ...shift, clockOutDeadline: "2026-11-07T18:00:00Z" }] };
    for (const [now, next] of [["08:00:00", "08:30:01"], ["08:30:01", "14:00:01"], ["14:00:01", "18:00:01"]]) {
        assert.equal(nextShiftRefresh(data, Date.parse(`2026-11-07T${now}Z`)), Date.parse(`2026-11-07T${next}Z`));
    }
    assert.equal(nextShiftRefresh(data, Date.parse("2026-11-07T18:00:01Z")), Date.parse("2026-11-08T00:00:01Z"));
});

test("API uses configured IDs, supports cancellation and accepts empty results", async (context) => {
    const signal = new AbortController().signal;
    context.mock.method(globalThis, "fetch", async (input: string, init: RequestInit) => {
        const url = new URL(input);
        assert.equal(url.origin, new URL(config.apiBaseUrl).origin);
        assert.equal(url.pathname, "/api/shifts");
        assert.equal(url.searchParams.get("tenantId"), config.testTenant);
        assert.equal(url.searchParams.get("userId"), config.testUser);
        assert.equal(url.searchParams.has("fromDate"), false);
        assert.equal(url.searchParams.has("toDate"), false);
        assert.equal(init.signal, signal);
        assert.equal(init.cache, "no-store");
        return Response.json(response);
    });
    assert.deepEqual(await getShifts(signal), response);
});

test("calendar requests supply explicit inclusive dates without changing the default My Work window", async (context) => {
    const range = { fromDate: "2026-11-02", toDate: "2026-11-08" };
    context.mock.method(globalThis, "fetch", async (input: string) => {
        const url = new URL(input);
        assert.equal(url.searchParams.get("fromDate"), range.fromDate);
        assert.equal(url.searchParams.get("toDate"), range.toDate);
        return Response.json({ ...response, ...range });
    });
    assert.deepEqual(await getShifts(undefined, range), { ...response, ...range });
});

test("400, 404 and server failures are errors, never empty results", async (context) => {
    for (const [status, message] of [[400, /invalid/], [404, /No cleaner/], [500, /couldn't load/]] as const) {
        const mock = context.mock.method(globalThis, "fetch", async () => new Response(null, { status }));
        await assert.rejects(getShifts(), message);
        mock.mock.restore();
    }
});

test("malformed shift lists and invalid date ranges cannot become empty schedules", async (context) => {
    const fetch = context.mock.method(globalThis, "fetch");
    for (const changes of [
        { shifts: null }, { shifts: {} }, { fromDate: "10/11/2026" },
        { toDate: "" }, { fromDate: "2026-11-11" },
    ]) {
        fetch.mock.mockImplementation(async () => Response.json({ ...response, ...changes }));
        await assert.rejects(getShifts(), { message: "Unexpected shifts response. Please try again." });
    }
});

test("grouping sorts each day chronologically without changing the server's shift order", () => {
    const late = { ...shift, id: "late", scheduledStart: "2026-11-07T15:00:00Z" };
    const early = { ...shift, id: "early", scheduledStart: "2026-11-07T07:00:00Z" };
    const data = { ...response, shifts: [late, early] };
    const original = structuredClone(data);
    assert.deepEqual(groupShiftsByDay(data)[3].shifts.map((item) => item.id), ["early", "late"]);
    assert.deepEqual(data, original);
});
