import assert from "node:assert/strict";
import { test } from "node:test";
import { config } from "../src/config/config.ts";
import { canRecordAttendance, recordAttendance, scannedSiteId } from "../src/lib/attendance.ts";
import type { Shift } from "../src/lib/shifts.ts";

const scannedId = "a3f87517-670f-456a-bd92-47abf697bdf0";
const shift: Shift = {
    id: "a58e72c3-debe-45a3-af21-37d75f43e7d8",
    site: { id: "762ec617-2cc4-4d17-b946-008682257b36", name: "Office" },
    scheduledStart: "2026-11-09T09:00:00Z", scheduledEnd: "2026-11-09T12:00:00Z",
    actualStart: null, actualEnd: null, status: "SCHEDULED",
    clockInOpensAt: "2026-11-09T08:30:00Z", clockInDeadline: "2026-11-09T14:00:00Z",
    clockOutDeadline: null, canClockIn: true, canClockOut: false, requiresManagerCorrection: false,
};

test("QR payload must be a plain UUID, allowing whitespace and uppercase", () => {
    assert.equal(scannedSiteId(` \n${scannedId.toUpperCase()}\n`), scannedId.toUpperCase());
    for (const invalid of ["", "Office", `https://example.com/${scannedId}`, JSON.stringify({ siteId: scannedId }), scannedId.slice(1)]) {
        assert.equal(scannedSiteId(invalid), null);
    }
});

test("both attendance endpoints send the scanned site ID, even when different from the shift's site", async (context) => {
    const requests: { url: string; body: unknown }[] = [];
    context.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
        assert.equal(init.method, "POST");
        assert.deepEqual(init.headers, { "Content-Type": "application/json" });
        requests.push({ url, body: JSON.parse(init.body as string) });
        // The API response schema is not needed to refresh the shifts, including an empty 202.
        return new Response(null, { status: 202 });
    });
    await recordAttendance("clockIn", shift, ` ${scannedId} `);
    await recordAttendance("clockOut", { ...shift, status: "IN_PROGRESS", canClockIn: false, canClockOut: true }, scannedId);
    assert.deepEqual(requests, ["clockIn", "clockOut"].map((action) => ({
        url: `${config.apiBaseUrl}/api/attendance/${action}`,
        body: { tenantId: config.testTenant, siteId: scannedId, shiftId: shift.id, userId: config.testUser },
    })));
});

test("invalid scans and unavailable actions cannot submit requests", async (context) => {
    const fetch = context.mock.method(globalThis, "fetch", async () => { throw new Error("Must not fetch"); });
    await assert.rejects(recordAttendance("clockIn", shift, "invalid"), /valid site ID/);
    await assert.rejects(recordAttendance("clockOut", shift, scannedId), /no longer available/);
    await assert.rejects(recordAttendance("clockIn", { ...shift, canClockIn: false }, scannedId), /no longer available/);
    for (const status of ["COMPLETED", "CANCELLED", "NO_SHOW"] as const) {
        const terminal = { ...shift, status, canClockIn: true, canClockOut: true };
        assert.equal(canRecordAttendance(terminal, "clockIn"), false);
        assert.equal(canRecordAttendance(terminal, "clockOut"), false);
    }
    await assert.rejects(recordAttendance("clockOut", { ...shift, canClockOut: true, requiresManagerCorrection: true }, scannedId), /no longer available/);
    assert.equal(fetch.mock.callCount(), 0);
});

test("HTTP rejection is surfaced without retrying the attendance mutation", async (context) => {
    for (const [status, message] of [[400, /not accepted/], [403, /not accepted/], [422, /not accepted/], [401, /session has expired/], [409, /already recorded/], [500, /Check your shifts before scanning again/]] as const) {
        const fetch = context.mock.method(globalThis, "fetch", async () => new Response(null, { status }));
        await assert.rejects(recordAttendance("clockIn", shift, scannedId), message);
        assert.equal(fetch.mock.callCount(), 1);
        fetch.mock.restore();
    }
});

test("connection loss asks the cleaner to check status before a new scan", async (context) => {
    const fetch = context.mock.method(globalThis, "fetch", async () => { throw new TypeError("Failed to fetch"); });
    await assert.rejects(recordAttendance("clockIn", shift, scannedId), /Check your shifts before scanning again/);
    assert.equal(fetch.mock.callCount(), 1);
});
