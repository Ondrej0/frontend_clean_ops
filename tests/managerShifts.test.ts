import assert from "node:assert/strict";
import { test } from "node:test";
import { buildManagerShiftEvents, defaultShiftTimes, managerShiftHeading } from "../src/lib/managerShifts.ts";
import type { Shift } from "../src/lib/shifts.ts";

const shift: Shift = {
    id: "shift", site: { id: "site", name: "Office" },
    employee: { id: "employee", firstName: "Alex", lastName: "Smith" },
    scheduleName: "Morning clean",
    scheduledStart: "2026-11-09T09:00:00Z", scheduledEnd: "2026-11-09T12:00:00Z",
    actualStart: null, actualEnd: null, status: "SCHEDULED",
    clockInOpensAt: "2026-11-09T08:30:00Z", clockInDeadline: "2026-11-09T14:00:00Z",
    clockOutDeadline: null, canClockIn: false, canClockOut: false, requiresManagerCorrection: false,
    origin: "SCHEDULED_OCCURRENCE", managerEditable: true,
};

test("manager shift headings emphasize the employee for a site and the site for an employee", () => {
    assert.equal(managerShiftHeading(shift, "site"), "Alex Smith");
    assert.equal(managerShiftHeading(shift, "employee"), "Office");
});

test("manager calendars retain dated shift status and attendance details without action metadata", () => {
    const [event] = buildManagerShiftEvents([{ ...shift, actualStart: "2026-11-09T09:05:00Z", status: "COMPLETED" }], "Europe/London", "site");
    assert.equal(event.title, "Alex Smith · Morning clean");
    assert.equal(event.start, "2026-11-09T09:00:00");
    assert.equal(event.end, "2026-11-09T12:00:00");
    assert.equal(event.extendedProps.statusLabel, "Completed");
    assert.equal(event.extendedProps.actualTime, "09:05–ongoing");
    assert.equal(event.editable, true);
    assert.equal("canClockIn" in event.extendedProps, false);
    assert.equal("canClockOut" in event.extendedProps, false);
});

test("one-off overrides are labelled and Add shift chooses a future hour in the visible week", () => {
    const [event] = buildManagerShiftEvents([{ ...shift, origin: "ONE_OFF_OVERRIDE" }], "Europe/London", "employee");
    assert.equal(event.extendedProps.originLabel, "One-off override");
    assert.deepEqual(defaultShiftTimes({ fromDate: "2026-11-09", toDate: "2026-11-15" }, Date.parse("2026-11-10T09:15:00Z")), {
        start: "2026-11-10T10:00", end: "2026-11-10T11:00",
    });
    assert.deepEqual(defaultShiftTimes({ fromDate: "2026-11-23", toDate: "2026-11-29" }, Date.parse("2026-11-10T09:15:00Z")), {
        start: "2026-11-23T09:00", end: "2026-11-23T10:00",
    });
});
