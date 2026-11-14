import assert from "node:assert/strict";
import { test } from "node:test";
import { getEmployeeFlags, getMyCalendarShifts, getMySchedules, overlapReportMessage, reportScheduleOverlaps, resolveEmployeeFlag } from "../src/lib/employeeFlags.ts";
import { getSession, signIn, signOut } from "../src/lib/session.ts";
import { config } from "../src/config/config.ts";

test("reporting sends only the displayed dates with session credentials and CSRF protection", async (context) => {
    const calls: string[] = [];
    context.mock.method(globalThis, "fetch", async (input: string, init: RequestInit) => {
        calls.push(input);
        assert.equal(init.credentials, "include");
        if (input.endsWith("/csrf")) return Response.json({ token: "token" });
        assert.ok(input.endsWith("/api/employee-flags/schedule-overlaps"));
        assert.equal(init.method, "POST");
        assert.equal(new Headers(init.headers).get("X-CSRF-TOKEN"), "token");
        assert.deepEqual(JSON.parse(String(init.body)), { fromDate: "2026-11-09", toDate: "2026-11-15" });
        return Response.json({ detected: 3, created: 2, alreadyReported: 1 });
    });
    assert.deepEqual(await reportScheduleOverlaps({ fromDate: "2026-11-09", toDate: "2026-11-15", employeeId: "spoof" } as Parameters<typeof reportScheduleOverlaps>[0]), { detected: 3, created: 2, alreadyReported: 1 });
    assert.equal(calls.length, 2);
});

test("confirmation distinguishes no conflicts, existing reports, new reports and mixed results", () => {
    assert.match(overlapReportMessage({ detected: 0, created: 0, alreadyReported: 0 }), /No overlaps/);
    assert.match(overlapReportMessage({ detected: 2, created: 0, alreadyReported: 2 }), /already been reported/);
    assert.match(overlapReportMessage({ detected: 1, created: 1, alreadyReported: 0 }), /1 overlap has been reported/);
    assert.match(overlapReportMessage({ detected: 3, created: 2, alreadyReported: 1 }), /2 overlaps have been reported.*1 already reported/);
});

test("manager filtering sends status and employee without a client-selected tenant", async (context) => {
    const signal = new AbortController().signal;
    context.mock.method(globalThis, "fetch", async (input: string, init: RequestInit) => {
        const url = new URL(input);
        assert.equal(url.pathname, "/api/employee-flags");
        assert.equal(url.searchParams.get("status"), "RESOLVED");
        assert.equal(url.searchParams.get("employeeId"), "employee");
        assert.equal(url.searchParams.has("tenantId"), false);
        assert.equal(init.signal, signal);
        return Response.json([]);
    });
    assert.deepEqual(await getEmployeeFlags("RESOLVED", "employee", signal), []);
});

test("resolution posts once with CSRF and encodes the flag ID", async (context) => {
    let mutations = 0;
    context.mock.method(globalThis, "fetch", async (input: string, init: RequestInit) => {
        if (input.endsWith("/csrf")) return Response.json({ token: "fresh" });
        mutations++;
        assert.ok(input.endsWith("/api/employee-flags/flag%2Fid/resolve"));
        assert.equal(init.method, "POST");
        assert.equal(new Headers(init.headers).get("X-CSRF-TOKEN"), "fresh");
        return Response.json({ id: "flag/id", status: "RESOLVED" });
    });
    assert.equal((await resolveEmployeeFlag("flag/id")).status, "RESOLVED");
    assert.equal(mutations, 1);
});

test("calendar and recurring schedule reads use session-owned endpoints without configured identities", async (context) => {
    context.mock.method(globalThis, "fetch", async (input: string, init: RequestInit) => {
        const url = new URL(input);
        assert.equal(init.credentials, "include");
        assert.equal(url.searchParams.has("tenantId"), false);
        assert.equal(url.searchParams.has("userId"), false);
        if (url.pathname === "/api/me/schedules") return Response.json([]);
        assert.equal(url.pathname, "/api/me/shifts");
        assert.equal(url.searchParams.get("fromDate"), "2026-11-09");
        assert.equal(url.searchParams.get("toDate"), "2026-11-15");
        return Response.json({ shifts: [] });
    });
    await getMyCalendarShifts({ fromDate: "2026-11-09", toDate: "2026-11-15" });
    assert.deepEqual(await getMySchedules(), []);
});

test("unauthorized, forbidden and failed mutations surface errors without retrying", async (context) => {
    for (const [status, message] of [[401, /session has expired/], [403, /permission/], [500, /couldn't complete/]] as const) {
        let mutations = 0;
        const mock = context.mock.method(globalThis, "fetch", async (input: string) => {
            if (input.endsWith("/csrf")) return Response.json({ token: "token" });
            mutations++;
            return new Response(null, { status });
        });
        await assert.rejects(resolveEmployeeFlag("flag"), message);
        assert.equal(mutations, 1);
        mock.mock.restore();
    }
});

test("sign-in submits existing-account credentials with tenant context and CSRF", async (context) => {
    context.mock.method(globalThis, "fetch", async (input: string, init: RequestInit) => {
        assert.equal(init.credentials, "include");
        if (input.endsWith("/csrf")) return Response.json({ token: "token" });
        assert.ok(input.endsWith("/api/session/login"));
        assert.equal(new Headers(init.headers).get("X-CSRF-TOKEN"), "token");
        const body = new URLSearchParams(init.body as URLSearchParams);
        assert.equal(body.get("username"), `${config.testTenant}:employee@example.com`);
        assert.equal(body.get("password"), "secret");
        return new Response(null, { status: 204 });
    });
    await signIn(" employee@example.com ", "secret");
});

test("session lookup distinguishes signed out from server failure, and sign-out is protected", async (context) => {
    const mock = context.mock.method(globalThis, "fetch", async () => new Response(null, { status: 401 }));
    assert.equal(await getSession(), null);
    mock.mock.mockImplementation(async () => new Response(null, { status: 500 }));
    await assert.rejects(getSession(), /couldn't check/);
    mock.mock.mockImplementation(async (input: string, init: RequestInit) => {
        if (input.endsWith("/csrf")) return Response.json({ token: "token" });
        assert.ok(input.endsWith("/api/session/logout"));
        assert.equal(init.method, "POST");
        assert.equal(new Headers(init.headers).get("X-CSRF-TOKEN"), "token");
        return new Response(null, { status: 204 });
    });
    await signOut();
});
