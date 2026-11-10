import assert from "node:assert/strict";
import { test } from "node:test";
import { config } from "../src/config/config.ts";
import { editSite, getSite, getSites, type EditSiteRequest, type SiteDetails } from "../src/lib/sites.ts";

test("manager requests stay tenant-wide and cleaner requests include the optional user ID", async (context) => {
    const requests: URL[] = [];
    const sites = [{ id: "site-1", name: "Office", addressLine1: "1 High Street", city: "London", postcode: "SW1A 1AA" }];
    context.mock.method(globalThis, "fetch", async (input: string) => {
        requests.push(new URL(input));
        return Response.json({ Sites: sites });
    });

    assert.deepEqual(await getSites(), sites);
    assert.deepEqual(await getSites(config.testUser), sites);
    for (const url of requests) {
        assert.equal(url.origin, new URL(config.apiBaseUrl).origin);
        assert.equal(url.pathname, "/api/sites");
        assert.equal(url.searchParams.get("tenantId"), config.testTenant);
    }
    assert.equal(requests[0].searchParams.has("userId"), false);
    assert.equal(requests[1].searchParams.get("userId"), config.testUser);
});

test("an empty assignment list is supported", async (context) => {
    context.mock.method(globalThis, "fetch", async () => Response.json({ Sites: [] }));
    assert.deepEqual(await getSites(config.testUser), []);
});

test("failed site requests remain errors rather than empty assignments", async (context) => {
    context.mock.method(globalThis, "fetch", async () => new Response(null, { status: 500 }));
    await assert.rejects(getSites(config.testUser), /Failed to fetch sites/);
});

const details: SiteDetails = {
    siteId: "site /?#", name: "Office", addressLine1: "1 High Street", addressLine2: null,
    city: "London", postcode: "SW1A 1AA", contactName: "Jane Doe", contactPhone: null,
    contactEmail: "jane@example.com", status: "ACTIVE", hourlyRate: 22.5,
    createdAt: "2026-11-01", updatedAt: "2026-11-10",
    assignedSchedules: [{ scheduleId: "schedule", name: "Weekly clean" }],
    assignedCleaners: [{ cleanerId: "cleaner", firstName: "Jane", lastName: "Doe" }],
};
const edit: EditSiteRequest = {
    tenantId: config.testTenant, siteId: details.siteId, name: "New office", addressLine1: "2 High Street",
    city: "London", postcode: "SW1A 1AA", contactName: "", contactPhone: "", contactEmail: "", hourlyRate: null,
};

test("site details encode the ID as one path segment and retain contacts and assignments", async (context) => {
    context.mock.method(globalThis, "fetch", async (url: string) => {
        assert.equal(url, `${config.apiBaseUrl}/api/sites/site%20%2F%3F%23`);
        return Response.json(details);
    });
    assert.deepEqual(await getSite(details.siteId), details);
});

test("missing site details remain an error", async (context) => {
    context.mock.method(globalThis, "fetch", async () => new Response(null, { status: 404 }));
    await assert.rejects(getSite(details.siteId), { message: "Failed to fetch site" });
});

test("site edits send location changes, cleared contacts, and nullable or zero rates", async (context) => {
    const bodies: unknown[] = [];
    context.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
        assert.equal(url, `${config.apiBaseUrl}/api/sites/site%20%2F%3F%23`);
        assert.equal(init.method, "PUT");
        assert.deepEqual(init.headers, { "Content-Type": "application/json" });
        bodies.push(JSON.parse(init.body as string));
        return new Response(null, { status: 204 });
    });
    for (const hourlyRate of [null, 0, 22.5]) await editSite(details.siteId, { ...edit, hourlyRate });
    assert.deepEqual(bodies, [null, 0, 22.5].map((hourlyRate) => ({ ...edit, hourlyRate })));
});

test("site save errors preserve server messages and fall back for unusable response bodies", async (context) => {
    const fetch = context.mock.method(globalThis, "fetch");
    for (const [body, message] of [
        ['{"message":"Site name already exists"}', "Site name already exists"],
        ["", "Failed to save site changes."],
        ["<html>Unavailable</html>", "Failed to save site changes."],
        ["null", "Failed to save site changes."],
        ['{"message":{"name":"Invalid"}}', "Failed to save site changes."],
    ]) {
        fetch.mock.mockImplementation(async () => new Response(body, { status: 400 }));
        const before = fetch.mock.callCount();
        await assert.rejects(editSite(details.siteId, edit), { message });
        assert.equal(fetch.mock.callCount(), before + 1);
    }
});

test("site writes do not retry after connection loss", async (context) => {
    const failure = new TypeError("Failed to fetch");
    const fetch = context.mock.method(globalThis, "fetch", async () => { throw failure; });
    await assert.rejects(editSite(details.siteId, edit), (error) => error === failure);
    assert.equal(fetch.mock.callCount(), 1);
});
