import assert from "node:assert/strict";
import { test } from "node:test";
import { createSchedulePathForSite, getPreselectedSiteId } from "../src/lib/scheduleNavigation.ts";

test("site schedule action links to create schedule with the originating site", () => {
    const path = createSchedulePathForSite("site /?#");

    assert.equal(path, "/manager/schedules/create?siteId=site%20%2F%3F%23");
    assert.equal(getPreselectedSiteId(new URL(path, "http://localhost").searchParams), "site /?#");
});

test("create schedule has no preselected site without a site parameter", () => {
    assert.equal(getPreselectedSiteId(new URLSearchParams()), "");
});
