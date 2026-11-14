import assert from "node:assert/strict";
import { test } from "node:test";
import { buildShiftEvents, calendarRange, calendarTime, calendarWeek } from "../src/lib/shiftCalendar.ts";
import type { Shift } from "../src/lib/shifts.ts";

const shift: Shift = {
    id: "shift-1", site: { id: "site-1", name: "Office" }, scheduleName: "Morning clean",
    scheduledStart: "2026-07-06T09:00:00+01:00", scheduledEnd: "2026-07-06T12:00:00+01:00",
    actualStart: "2026-07-06T09:05:00+01:00", actualEnd: null, status: "IN_PROGRESS",
    clockInOpensAt: "2026-07-06T08:30:00+01:00", clockInDeadline: "2026-07-06T14:00:00+01:00",
    clockOutDeadline: null, canClockIn: false, canClockOut: true, requiresManagerCorrection: false,
};

test("events retain real shift IDs and scheduled dates, never recurring rules or clocking times", () => {
    const original = structuredClone(shift);
    const [event] = buildShiftEvents([shift], "Europe/London");
    assert.equal(event.id, shift.id);
    assert.equal(event.extendedProps.shiftId, shift.id);
    assert.equal(event.title, "Office · Morning clean");
    assert.equal(event.start, "2026-07-06T09:00:00");
    assert.equal(event.end, "2026-07-06T12:00:00");
    assert.equal("daysOfWeek" in event, false);
    assert.equal("duration" in event, false);
    assert.deepEqual(shift, original);
    assert.deepEqual(buildShiftEvents([], "Europe/London"), []);
});

test("overlaps use actual instants and dates; touching shifts and the same weekday next week do not clash", () => {
    const events = buildShiftEvents([
        shift,
        { ...shift, id: "overlap", scheduledStart: "2026-07-06T09:30:00Z", scheduledEnd: "2026-07-06T10:00:00Z" },
        { ...shift, id: "touching", scheduledStart: "2026-07-06T12:00:00+01:00", scheduledEnd: "2026-07-06T13:00:00+01:00" },
        { ...shift, id: "next-week", scheduledStart: "2026-07-13T09:00:00+01:00", scheduledEnd: "2026-07-13T12:00:00+01:00" },
    ], "Europe/London");
    assert.deepEqual(events.map((event) => event.extendedProps.overlaps), [true, true, false, false]);
    assert.deepEqual(events.map((event) => event.borderColor), ["#dc2626", "#dc2626", "#16a34a", "#16a34a"]);
});

test("overnight shifts keep their end date and detect conflicts across a week boundary", () => {
    const events = buildShiftEvents([
        { ...shift, scheduledStart: "2026-07-05T22:00:00+01:00", scheduledEnd: "2026-07-06T02:00:00+01:00" },
        { ...shift, id: "monday", scheduledStart: "2026-07-06T01:00:00+01:00", scheduledEnd: "2026-07-06T03:00:00+01:00" },
    ], "Europe/London");
    assert.equal(events[0].start, "2026-07-05T22:00:00");
    assert.equal(events[0].end, "2026-07-06T02:00:00");
    assert.equal(events[0].extendedProps.timeLabel, "22:00–02:00 (2026-07-06)");
    assert.ok(events.every((event) => event.extendedProps.overlaps));
});

test("cancelled shifts remain visible without creating clashes; standalone shifts need no rule", () => {
    const events = buildShiftEvents([shift, { ...shift, id: "cancelled", status: "CANCELLED", scheduleName: null }], "Europe/London");
    assert.ok(events.every((event) => !event.extendedProps.overlaps));
    assert.equal(events[1].extendedProps.cancelled, true);
    assert.equal(events[1].borderColor, "#94a3b8");
    assert.equal(events[1].title, "Office · Shift");
});

test("calendar uses UK wall time in summer and winter, including DST transition nights", () => {
    assert.equal(calendarTime("2026-07-05T23:30:00Z"), "2026-07-06T00:30:00");
    assert.equal(calendarTime("2026-11-08T23:30:00Z"), "2026-11-08T23:30:00");
    assert.equal(calendarTime("2026-03-29T00:30:00Z"), "2026-03-29T00:30:00");
    assert.equal(calendarTime("2026-03-29T01:30:00Z"), "2026-03-29T02:30:00");
    assert.equal(calendarTime("2026-10-25T02:30:00Z"), "2026-10-25T02:30:00");
});

test("initial week follows UK Monday and API ranges include Sunday but not the next Monday", () => {
    assert.deepEqual(calendarWeek(Date.parse("2026-07-05T23:30:00Z")), { fromDate: "2026-07-06", toDate: "2026-07-12" });
    assert.deepEqual(calendarWeek(Date.parse("2026-11-15T23:30:00Z")), { fromDate: "2026-11-09", toDate: "2026-11-15" });
    assert.deepEqual(calendarRange(new Date("2026-12-28T00:00:00Z"), new Date("2027-01-04T00:00:00Z")), { fromDate: "2026-12-28", toDate: "2027-01-03" });
});
