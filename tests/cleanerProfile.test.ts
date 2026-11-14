import assert from "node:assert/strict";
import { test } from "node:test";
import { config } from "../src/config/config.ts";
import { getCleaner, type Cleaner } from "../src/lib/employee.ts";
import { getProfileFields, saveCleanerProfile, validateProfile } from "../src/lib/cleanerProfile.ts";

const cleaner: Cleaner = {
    id: config.testUser,
    firstName: "Jane", lastName: "Doe", email: "jane@example.com", phone: "07123456789",
    address: "12 High Street\nLondon\nSW1A 1AA", role: "CLEANER", payRate: 19.5,
    active: true, createdAt: "2026-11-01T10:00:00", updatedAt: "2026-11-01T10:00:00",
    assignedSchedules: [], assignedSites: [],
};

test("profile reads use the getCleanerData route for the current cleaner", async (context) => {
    context.mock.method(globalThis, "fetch", async (url: string) => {
        assert.equal(url, `${config.apiBaseUrl}/api/cleaner/${config.testUser}`);
        return Response.json(cleaner);
    });
    assert.deepEqual(await getCleaner(config.testUser), cleaner);
    assert.deepEqual(Object.keys(getProfileFields(cleaner)), ["firstName", "lastName", "email", "phone", "address"]);
    assert.equal(getProfileFields({ ...cleaner, address: undefined, phone: null }).address, "");
    assert.equal(getProfileFields({ ...cleaner, phone: null }).phone, "");
});

test("profile saves whitelist personal fields and preserve the latest employment values", async (context) => {
    const requests: RequestInit[] = [];
    context.mock.method(globalThis, "fetch", async (url: string, init?: RequestInit) => {
        if (url.endsWith("/csrf")) return Response.json({ token: "token" });
        assert.equal(url, `${config.apiBaseUrl}/api/cleaner/${config.testUser}`);
        if (!init) return Response.json({ ...cleaner, payRate: 22 });
        requests.push(init);
        return new Response(null, { status: 204 });
    });
    const updated = await saveCleanerProfile({
        ...getProfileFields(cleaner), firstName: " Janet ", email: " janet@example.com ",
        phone: "  ", address: " 20 High Street\nLondon ",
        // Extra properties cannot override protected fields or choose a different employee.
        ...{ id: "someone-else", tenantId: "another-tenant", role: "MANAGER", payRate: 999, active: false },
    });
    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, "PUT");
    assert.equal(new Headers(requests[0].headers).get("Content-Type"), "application/json");
    assert.equal(new Headers(requests[0].headers).get("X-CSRF-TOKEN"), "token");
    assert.deepEqual(JSON.parse(requests[0].body as string), {
        tenantId: config.testTenant, firstName: "Janet", lastName: "Doe", email: "janet@example.com",
        phone: null, address: "20 High Street\nLondon", role: "CLEANER", payRate: 22,
    });
    assert.equal(updated.id, config.testUser);
    assert.equal(updated.firstName, "Janet");
    assert.equal(updated.payRate, 22);
    assert.equal(updated.active, true);
});

test("optional address and phone can be cleared", async (context) => {
    context.mock.method(globalThis, "fetch", async (_url: string, init?: RequestInit) => {
        if (_url.endsWith("/csrf")) return Response.json({ token: "token" });
        if (!init) return Response.json(cleaner);
        const request = JSON.parse(init.body as string);
        assert.equal(request.address, "");
        assert.equal(request.phone, null);
        return new Response(null, { status: 204 });
    });
    await saveCleanerProfile({ ...getProfileFields(cleaner), address: "", phone: "" });
});

test("invalid contact details cannot submit a profile request", async (context) => {
    const fetch = context.mock.method(globalThis, "fetch", async () => { throw new Error("Must not fetch"); });
    for (const change of [
        { firstName: " " }, { lastName: "" }, { firstName: "a".repeat(101) },
        { email: "" }, { email: "not-an-email" }, { email: "a".repeat(250) + "@example.com" },
        { phone: "1".repeat(51) }, { address: "a".repeat(501) },
    ]) {
        const fields = { ...getProfileFields(cleaner), ...change };
        assert.ok(validateProfile(fields));
        await assert.rejects(saveCleanerProfile(fields));
    }
    assert.equal(fetch.mock.callCount(), 0);
});

test("a failed profile refresh prevents a write with stale employment data", async (context) => {
    const fetch = context.mock.method(globalThis, "fetch", async () => new Response(null, { status: 500 }));
    await assert.rejects(saveCleanerProfile(getProfileFields(cleaner)), /Failed to fetch cleaner/);
    assert.equal(fetch.mock.callCount(), 1);
});

test("a rejected save is not reported as successful or automatically retried", async (context) => {
    const fetch = context.mock.method(globalThis, "fetch", async (_url: string, init?: RequestInit) => {
        if (_url.endsWith("/csrf")) return Response.json({ token: "token" });
        return init ? new Response(null, { status: 400 }) : Response.json(cleaner);
    });
    await assert.rejects(saveCleanerProfile(getProfileFields(cleaner)), /Failed to save employee/);
    assert.equal(fetch.mock.callCount(), 3);
});
