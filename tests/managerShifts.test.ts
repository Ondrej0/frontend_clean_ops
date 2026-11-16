import assert from "node:assert/strict";
import { test } from "node:test";
import { managerShiftHeading } from "../src/lib/managerShifts.ts";
import type { Shift } from "../src/lib/shifts.ts";

const shift: Shift = {
    id: "shift", site: { id: "site", name: "Office" },
    employee: { id: "employee", firstName: "Alex", lastName: "Smith" },
    scheduleName: "Morning clean",
    scheduledStart: "2026-11-09T09:00:00Z", scheduledEnd: "2026-11-09T12:00:00Z",
    actualStart: null, actualEnd: null, status: "SCHEDULED",
    clockInOpensAt: "2026-11-09T08:30:00Z", clockInDeadline: "2026-11-09T14:00:00Z",
    clockOutDeadline: null, canClockIn: false, canClockOut: false, requiresManagerCorrection: false,
};

test("manager shift headings emphasize the employee for a site and the site for an employee", () => {
    assert.equal(managerShiftHeading(shift, "site"), "Alex Smith");
    assert.equal(managerShiftHeading(shift, "employee"), "Office");
});
