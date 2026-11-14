import assert from "node:assert/strict";
import { test } from "node:test";
import { config } from "../src/config/config.ts";
import { editEmployee, getCleaner, getCleaners, type Cleaner, type EditEmployeeRequest } from "../src/lib/employee.ts";

const cleaner: Cleaner = {
    id: "cleaner /?#", firstName: "Jane", lastName: "Doe", email: "jane@example.com",
    phone: null, role: "CLEANER", payRate: null, active: true,
    createdAt: "2026-11-01", updatedAt: "2026-11-10", address: "1 High Street",
    assignedSchedules: [{ id: "schedule", name: "Weekly clean" }],
    assignedSites: [{ id: "site", name: "Office", addressLine1: "1 High Street", postcode: "SW1A 1AA" }],
};
const request: EditEmployeeRequest = {
    tenantId: config.testTenant, firstName: "Janet", lastName: "Doe", email: "janet@example.com",
    phone: null, role: "MANAGER", payRate: 25.5, address: "",
};

test("employee lists request the configured tenant and preserve contact details", async (context) => {
    context.mock.method(globalThis, "fetch", async (input: string) => {
        const url = new URL(input);
        assert.equal(url.origin, new URL(config.apiBaseUrl).origin);
        assert.equal(url.pathname, "/api/cleaner");
        assert.deepEqual([...url.searchParams], [["tenantId", config.testTenant]]);
        return Response.json({ cleaners: [cleaner] });
    });
    assert.deepEqual(await getCleaners(), [cleaner]);
});

test("employee lists accept no assignments but reject failed requests", async (context) => {
    const fetch = context.mock.method(globalThis, "fetch", async () => Response.json({ cleaners: [] }));
    assert.deepEqual(await getCleaners(), []);
    fetch.mock.mockImplementation(async () => new Response(null, { status: 500 }));
    await assert.rejects(getCleaners(), { message: "Failed to fetch cleaners" });
});

test("employee details encode the ID as one path segment and retain employment and assignments", async (context) => {
    context.mock.method(globalThis, "fetch", async (url: string) => {
        assert.equal(url, `${config.apiBaseUrl}/api/cleaner/cleaner%20%2F%3F%23`);
        return Response.json(cleaner);
    });
    assert.deepEqual(await getCleaner(cleaner.id), cleaner);
});

test("missing employee details reject instead of displaying an empty profile", async (context) => {
    context.mock.method(globalThis, "fetch", async () => new Response(null, { status: 404 }));
    await assert.rejects(getCleaner(cleaner.id), { message: "Failed to fetch cleaner" });
});

test("manager employee edits preserve employment changes and explicit null and zero pay rates", async (context) => {
    const bodies: unknown[] = [];
    context.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
        if (url.endsWith("/csrf")) return Response.json({ token: "token" });
        assert.equal(url, `${config.apiBaseUrl}/api/cleaner/cleaner%20%2F%3F%23`);
        assert.equal(init.method, "PUT");
        assert.equal(new Headers(init.headers).get("Content-Type"), "application/json");
        assert.equal(new Headers(init.headers).get("X-CSRF-TOKEN"), "token");
        assert.equal(init.credentials, "include");
        bodies.push(JSON.parse(init.body as string));
        return new Response(null, { status: 204 });
    });
    for (const payRate of [25.5, 0, null]) await editEmployee(cleaner.id, { ...request, payRate });
    assert.deepEqual(bodies, [25.5, 0, null].map((payRate) => ({ ...request, payRate })));
});

test("employee save errors preserve server messages and fall back for unusable response bodies", async (context) => {
    const fetch = context.mock.method(globalThis, "fetch");
    for (const [body, message] of [
        ['{"message":"Email already belongs to another employee"}', "Email already belongs to another employee"],
        ["", "Failed to save employee changes."],
        ["<html>Unavailable</html>", "Failed to save employee changes."],
        ["null", "Failed to save employee changes."],
        ['{"message":{"email":"Invalid"}}', "Failed to save employee changes."],
    ]) {
        fetch.mock.mockImplementation(async (url: string) => url.endsWith("/csrf") ? Response.json({ token: "token" }) : new Response(body, { status: 400 }));
        const before = fetch.mock.callCount();
        await assert.rejects(editEmployee(cleaner.id, request), { message });
        assert.equal(fetch.mock.callCount(), before + 2);
    }
});

test("employee writes do not retry after connection loss", async (context) => {
    const failure = new TypeError("Failed to fetch");
    const fetch = context.mock.method(globalThis, "fetch", async () => { throw failure; });
    await assert.rejects(editEmployee(cleaner.id, request), (error) => error === failure);
    assert.equal(fetch.mock.callCount(), 1);
});
