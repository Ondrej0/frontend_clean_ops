import assert from "node:assert/strict";
import { test } from "node:test";
import { apiFetch } from "../src/lib/session.ts";
import { identity, setSessionIdentity } from "../src/lib/sessionIdentity.ts";

test("shared transport protects every mutation and preserves request headers and cancellation", async (context) => {
    const controller = new AbortController();
    let mutations = 0;
    context.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
        assert.equal(init.credentials, "include");
        assert.equal(init.signal, controller.signal);
        if (url.endsWith("/csrf")) return Response.json({ token: "csrf-token" });
        mutations++;
        assert.equal(new Headers(init.headers).get("X-CSRF-TOKEN"), "csrf-token");
        assert.equal(new Headers(init.headers).get("Content-Type"), "application/json");
        assert.equal(init.body, "{}");
        return new Response(null, { status: 204 });
    });
    for (const method of ["POST", "PUT", "PATCH", "DELETE", "post"]) {
        await apiFetch("http://localhost:8080/api/example", {
            method, headers: { "Content-Type": "application/json" }, body: "{}", signal: controller.signal,
        });
    }
    assert.equal(mutations, 5);
});

test("CSRF acquisition failure prevents the mutation from being submitted", async (context) => {
    const requests: string[] = [];
    context.mock.method(globalThis, "fetch", async (url: string) => {
        requests.push(url);
        return new Response(null, { status: 503 });
    });
    await assert.rejects(apiFetch("http://localhost:8080/api/sites", { method: "POST" }), /secure session/);
    assert.equal(requests.length, 1);
    assert.ok(requests[0].endsWith("/csrf"));
});

test("an expired session clears local identity while a denied action preserves it", async (context) => {
    const user = { id: "employee", tenantId: "company", name: "Alex", role: "CLEANER" as const };
    setSessionIdentity(user);
    const fetch = context.mock.method(globalThis, "fetch", async () => new Response(null, { status: 403 }));
    assert.equal((await apiFetch("http://localhost:8080/api/cleaner")).status, 403);
    assert.equal(identity.userId, user.id);
    fetch.mock.mockImplementation(async () => new Response(null, { status: 401 }));
    assert.equal((await apiFetch("http://localhost:8080/api/sites")).status, 401);
    assert.throws(() => identity.userId, /sign in/);
});
