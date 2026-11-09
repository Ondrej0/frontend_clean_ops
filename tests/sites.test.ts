import assert from "node:assert/strict";
import { test } from "node:test";
import { config } from "../src/config/config.ts";
import { getSites } from "../src/lib/sites.ts";

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
