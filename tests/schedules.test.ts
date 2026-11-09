import assert from "node:assert/strict";
import { test } from "node:test";
import { config } from "../src/config/config.ts";
import { getSchedulesBySites, type SchedulesBySite } from "../src/lib/schedules.ts";
import { buildScheduleEvents } from "../src/lib/scheduleCalendar.ts";

function site(id: string, rules: [string, string, string][]): SchedulesBySite {
    return {
        siteId: id, siteName: `Site ${id}`, addressLine1: "1 High Street", city: "London", postcode: "SW1A 1AA",
        schedules: [{
            scheduleId: `schedule-${id}`, name: "Weekly clean", createdAt: "", updatedAt: "",
            scheduleRules: rules.map(([dayOfWeek, startTime, endTime], index) => ({
                scheduleRuleId: `${id}-${index}`, dayOfWeek, startTime, endTime,
            })),
        }],
    };
}

test("cleaner schedule requests include userId while manager requests remain tenant-wide", async (context) => {
    const requests: URL[] = [];
    const data = [site("a", [["MONDAY", "09:00", "12:00"]])];
    context.mock.method(globalThis, "fetch", async (input: string) => {
        requests.push(new URL(input));
        return Response.json(data);
    });
    assert.deepEqual(await getSchedulesBySites(), data);
    assert.deepEqual(await getSchedulesBySites(config.testUser), data);
    for (const url of requests) {
        assert.equal(url.pathname, "/api/schedules/by-site");
        assert.equal(url.searchParams.get("tenantId"), config.testTenant);
    }
    assert.equal(requests[0].searchParams.has("userId"), false);
    assert.equal(requests[1].searchParams.get("userId"), config.testUser);
});

test("empty assignments are valid, but failed and malformed requests remain errors", async (context) => {
    const mock = context.mock.method(globalThis, "fetch", async () => Response.json([]));
    assert.deepEqual(await getSchedulesBySites(config.testUser), []);
    mock.mock.mockImplementation(async () => new Response(null, { status: 500 }));
    await assert.rejects(getSchedulesBySites(config.testUser), /Failed to fetch schedules/);
    mock.mock.mockImplementation(async () => Response.json({}));
    await assert.rejects(getSchedulesBySites(config.testUser), /Unexpected schedules response/);
});

test("all overlapping rules turn red across sites, including contained and identical rules", () => {
    const events = buildScheduleEvents([
        site("a", [["MONDAY", "09:00:00", "12:00:00"]]),
        site("b", [["MONDAY", "10:00:00", "11:00:00"], ["MONDAY", "09:00:00", "12:00:00"]]),
        site("c", [["MONDAY", "12:00:00", "13:00:00"], ["TUESDAY", "09:00:00", "12:00:00"]]),
    ]);
    assert.deepEqual(events.map((event) => event.backgroundColor), ["#b91c1c", "#b91c1c", "#b91c1c", "#15803d", "#15803d"]);
    assert.equal(events[0].title, "Site a · Weekly clean");
    assert.deepEqual(events[0].daysOfWeek, [1]);
    assert.deepEqual(events[0].duration, { seconds: 10800 });
    assert.ok(events[0].extendedProps.conflicts.includes("Site b · Weekly clean"));
    assert.equal(new Set(events.map((event) => event.id)).size, events.length);
});

test("overnight rules overlap across midnight and the weekly boundary, but touching rules stay green", () => {
    const events = buildScheduleEvents([
        site("a", [["SUNDAY", "22:00", "02:00"], ["SATURDAY", "23:00", "01:00"]]),
        site("b", [["MONDAY", "01:00", "03:00"], ["SUNDAY", "00:30", "01:30"], ["MONDAY", "03:00", "04:00"]]),
    ]);
    assert.deepEqual(events.map((event) => event.extendedProps.overlaps), [true, true, true, true, false]);
    assert.deepEqual(events[0].duration, { seconds: 14400 });
    assert.equal(events[0].extendedProps.timeLabel, "22:00–02:00 (next day)");
});

test("overlaps within one schedule are detected and empty schedules produce no events", () => {
    const events = buildScheduleEvents([site("a", [["FRIDAY", "09:00", "11:00"], ["FRIDAY", "10:00", "12:00"]])]);
    assert.ok(events.every((event) => event.extendedProps.overlaps));
    assert.deepEqual(buildScheduleEvents([]), []);
    assert.deepEqual(buildScheduleEvents([site("a", [])]), []);
});
