import assert from "node:assert/strict";
import { test } from "node:test";
import { canVisitRolePath, homeForRole } from "../src/lib/sessionRouting.ts";
import { identity, setSessionIdentity } from "../src/lib/sessionIdentity.ts";

test("each role has its own landing page and cannot navigate into the other workspace", () => {
    assert.equal(homeForRole("MANAGER"), "/manager/dashboard");
    assert.equal(homeForRole("CLEANER"), "/cleaner/my-work");
    assert.equal(canVisitRolePath("CLEANER", "/manager/employees"), false);
    assert.equal(canVisitRolePath("MANAGER", "/cleaner/profile"), false);
    assert.equal(canVisitRolePath("MANAGER", "/manager/sites/123"), true);
    assert.equal(canVisitRolePath("CLEANER", "/cleaner/schedule"), true);
    assert.equal(canVisitRolePath("CLEANER", "/"), false);
});

test("page identity follows the authenticated account and is unavailable after logout", () => {
    setSessionIdentity({ id: "first", tenantId: "company-a", name: "First", role: "CLEANER" });
    assert.equal(identity.userId, "first");
    assert.equal(identity.tenantId, "company-a");
    setSessionIdentity({ id: "second", tenantId: "company-b", name: "Second", role: "MANAGER" });
    assert.equal(identity.userId, "second");
    assert.equal(identity.tenantId, "company-b");
    setSessionIdentity(null);
    assert.throws(() => identity.userId, /sign in/);
    assert.throws(() => identity.tenantId, /sign in/);
});
