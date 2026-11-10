import assert from "node:assert/strict";
import { test } from "node:test";
import { config } from "../src/config/config.ts";
import { assignCleaner, editSchedule, getSchedule, type EditScheduleRequest, type ScheduleDetails } from "../src/lib/schedules.ts";

const request: EditScheduleRequest = {
    tenantId: config.testTenant, scheduleId: "schedule & /?#", name: "Night clean",
    scheduleRule: [{ dayOfWeek: "SATURDAY", startTime: "22:00:00", endTime: "02:00:00" }],
};

test("schedule details encode the requested ID and retain rules, site, and cleaner assignments", async (context) => {
    const details: ScheduleDetails = {
        scheduleId: request.scheduleId, name: request.name, createdAt: "2026-11-01", updatedAt: "2026-11-10",
        scheduleRules: [{ scheduleRuleId: "rule", ...request.scheduleRule[0] }],
        site: { siteId: "site", name: "Office", postcode: "SW1A 1AA" },
        assignedCleaners: [{ cleanerId: "cleaner", firstName: "Jane", lastName: "Doe" }],
    };
    context.mock.method(globalThis, "fetch", async (input: string) => {
        const url = new URL(input);
        assert.equal(url.origin, new URL(config.apiBaseUrl).origin);
        assert.equal(url.pathname, "/api/schedules");
        assert.deepEqual([...url.searchParams], [["scheduleId", request.scheduleId]]);
        return Response.json(details);
    });
    assert.deepEqual(await getSchedule(request.scheduleId), details);
});

test("schedule edits send all replacement rules, including an empty list, and accept empty success responses", async (context) => {
    const bodies: unknown[] = [];
    const fetch = context.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
        assert.equal(url, `${config.apiBaseUrl}/api/schedules/edit`);
        assert.equal(init.method, "POST");
        assert.deepEqual(init.headers, { "Content-Type": "application/json" });
        bodies.push(JSON.parse(init.body as string));
        return new Response(null, { status: 204 });
    });
    await editSchedule(request);
    await editSchedule({ ...request, scheduleRule: [] });
    assert.deepEqual(bodies, [request, { ...request, scheduleRule: [] }]);
    assert.equal(fetch.mock.callCount(), 2);
});

test("cleaner assignment sends tenant, schedule, and cleaner IDs as separate encoded parameters", async (context) => {
    const cleanerId = "cleaner + & /?#";
    const fetch = context.mock.method(globalThis, "fetch", async (input: string, init: RequestInit) => {
        const url = new URL(input);
        assert.equal(url.origin, new URL(config.apiBaseUrl).origin);
        assert.equal(url.pathname, "/api/schedules/assign/cleaner");
        assert.deepEqual(Object.fromEntries(url.searchParams), {
            tenantId: config.testTenant, scheduleId: request.scheduleId, cleanerId,
        });
        assert.equal(init.method, "POST");
        return new Response(null, { status: 204 });
    });
    await assignCleaner(request.scheduleId, cleanerId);
    assert.equal(fetch.mock.callCount(), 1);
});

const operations = [
    { name: "schedule lookup", run: () => getSchedule(request.scheduleId), fallback: "Failed to fetch schedule" },
    { name: "schedule edit", run: () => editSchedule(request), fallback: "Failed to update schedule" },
    { name: "cleaner assignment", run: () => assignCleaner(request.scheduleId, "cleaner"), fallback: "Failed to assign cleaner" },
];

for (const operation of operations) {
    test(`${operation.name} surfaces API rejections and handles missing error messages without retrying`, async (context) => {
        const fetch = context.mock.method(globalThis, "fetch");
        for (const [response, message] of [
            [Response.json({ message: "Schedule overlaps an existing assignment" }, { status: 409 }), "Schedule overlaps an existing assignment"],
            [new Response(null, { status: 500 }), operation.fallback],
            [new Response("<html>Bad gateway</html>", { status: 502 }), operation.fallback],
            [Response.json({}, { status: 400 }), operation.fallback],
            [Response.json(null, { status: 400 }), operation.fallback],
        ] as const) {
            fetch.mock.mockImplementation(async () => response);
            const before = fetch.mock.callCount();
            await assert.rejects(operation.run(), { message });
            assert.equal(fetch.mock.callCount(), before + 1);
        }
    });

    test(`${operation.name} propagates connection loss without retrying`, async (context) => {
        const failure = new TypeError("Failed to fetch");
        const fetch = context.mock.method(globalThis, "fetch", async () => { throw failure; });
        await assert.rejects(operation.run(), (error) => error === failure);
        assert.equal(fetch.mock.callCount(), 1);
    });
}
