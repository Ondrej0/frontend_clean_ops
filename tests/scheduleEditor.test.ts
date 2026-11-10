import assert from "node:assert/strict";
import { test } from "node:test";
import { eventsToRules, rulesToEvents } from "../src/lib/scheduleEditor.ts";
import type { ScheduleDetails } from "../src/lib/schedules.ts";

const schedule: ScheduleDetails = {
    scheduleId: "weekly", name: "Weekly clean", createdAt: "", updatedAt: "",
    site: { siteId: "office", name: "Office", postcode: "SW1A 1AA" }, assignedCleaners: [],
    scheduleRules: [
        { scheduleRuleId: "day", dayOfWeek: "MONDAY", startTime: "09:15:30", endTime: "12:45:15" },
        { scheduleRuleId: "night", dayOfWeek: "SATURDAY", startTime: "22:00:00", endTime: "02:00:00" },
    ],
};
const today = new Date(2026, 10, 10, 12);

test("editing a schedule preserves rule IDs, local weekdays, and seconds", () => {
    const original = structuredClone(schedule);
    const events = rulesToEvents(schedule, today);
    assert.deepEqual(events.map((event) => event.id), ["day", "night"]);
    assert.deepEqual(events[0].start, new Date(2026, 10, 9, 9, 15, 30));
    assert.deepEqual(events[0].end, new Date(2026, 10, 9, 12, 45, 15));
    assert.deepEqual(eventsToRules(events), schedule.scheduleRules.map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime })));
    assert.deepEqual(schedule, original);
    assert.deepEqual(today, new Date(2026, 10, 10, 12));
});

test("overnight editor events end the next day, including the end of the week", () => {
    const events = rulesToEvents(schedule, today);
    assert.deepEqual(events[1].start, new Date(2026, 10, 14, 22));
    assert.deepEqual(events[1].end, new Date(2026, 10, 15, 2));
});

test("overnight rules crossing a month or DST boundary keep their local end time", () => {
    for (const [reference, start, end] of [
        [new Date(2026, 0, 28), new Date(2026, 0, 31, 22), new Date(2026, 1, 1, 2)],
        [new Date(2026, 2, 25), new Date(2026, 2, 28, 22), new Date(2026, 2, 29, 2)],
        [new Date(2026, 9, 21), new Date(2026, 9, 24, 22), new Date(2026, 9, 25, 2)],
    ]) {
        const event = rulesToEvents(schedule, reference)[1];
        assert.deepEqual(event.start, start);
        assert.deepEqual(event.end, end);
        assert.equal(eventsToRules([event])[0].endTime, "02:00:00");
    }
});

test("midnight end times continue into the next day and minute-only rules gain seconds", () => {
    const events = rulesToEvents({ ...schedule, scheduleRules: [
        { scheduleRuleId: "midnight", dayOfWeek: "MONDAY", startTime: "22:00", endTime: "00:00" },
    ] }, today);
    assert.deepEqual(events[0].end, new Date(2026, 10, 10));
    assert.deepEqual(eventsToRules(events), [{ dayOfWeek: "MONDAY", startTime: "22:00:00", endTime: "00:00:00" }]);
});

test("saving moved events uses their new weekday and time and omits unfinished selections", () => {
    assert.deepEqual(eventsToRules([
        { start: new Date(2026, 10, 11, 14, 30), end: new Date(2026, 10, 11, 16) },
        { start: new Date(2026, 10, 12, 9) }, { end: new Date(2026, 10, 12, 12) }, {},
    ]), [{ dayOfWeek: "WEDNESDAY", startTime: "14:30:00", endTime: "16:00:00" }]);
    assert.deepEqual(rulesToEvents({ ...schedule, scheduleRules: [] }, today), []);
    assert.deepEqual(eventsToRules([]), []);
});
