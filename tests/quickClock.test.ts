import assert from "node:assert/strict";
import { test } from "node:test";
import { clockInCountdown, quickClockState } from "../src/lib/quickClock.ts";
import type { Shift } from "../src/lib/shifts.ts";

const now = Date.parse("2026-11-10T08:00:00Z");
const shift: Shift = {
    id: "next", site: { id: "site", name: "Office" },
    scheduledStart: "2026-11-10T09:00:00Z", scheduledEnd: "2026-11-10T12:00:00Z",
    actualStart: null, actualEnd: null, status: "SCHEDULED",
    clockInOpensAt: "2026-11-10T08:30:00Z", clockInDeadline: "2026-11-10T10:00:00Z",
    clockOutDeadline: null, canClockIn: false, canClockOut: false, requiresManagerCorrection: false,
};

test("quick clock-in chooses the earliest available shift without mutating schedule order", () => {
    const later = { ...shift, id: "later", scheduledStart: "2026-11-10T10:00:00Z", canClockIn: true };
    const earlier = { ...shift, canClockIn: true };
    const shifts = [later, earlier];
    assert.deepEqual(quickClockState(shifts, now), { kind: "available", shift: earlier, action: "clockIn" });
    assert.deepEqual(shifts, [later, earlier]);
    // An authoritative server flag wins over the local clock's window calculation.
    assert.equal(quickClockState([earlier], Date.parse("2026-11-10T15:00:00Z")).kind, "available");
});

test("clock-out takes priority over clock-in regardless of shift order", () => {
    const clockIn = { ...shift, canClockIn: true };
    const clockOut: Shift = { ...shift, id: "current", status: "IN_PROGRESS", actualStart: "2026-11-10T07:00:00Z", canClockOut: true };
    for (const shifts of [[clockIn, clockOut], [clockOut, clockIn]]) {
        assert.deepEqual(quickClockState(shifts, now), { kind: "available", shift: clockOut, action: "clockOut" });
    }
    const both = { ...shift, canClockIn: true, canClockOut: true };
    assert.deepEqual(quickClockState([both], now), { kind: "available", shift: both, action: "clockOut" });
});

test("clock-out uses server availability and skips completed or correction-required shifts", () => {
    const clockOut: Shift = { ...shift, status: "IN_PROGRESS", canClockOut: true, clockOutDeadline: "2026-11-10T07:00:00Z" };
    assert.deepEqual(quickClockState([clockOut], now), { kind: "available", shift: clockOut, action: "clockOut" });
    const clockIn = { ...shift, id: "next", canClockIn: true };
    for (const status of ["COMPLETED", "CANCELLED", "NO_SHOW"] as const) {
        assert.deepEqual(quickClockState([{ ...clockOut, status }, clockIn], now), { kind: "available", shift: clockIn, action: "clockIn" });
    }
    assert.deepEqual(quickClockState([{ ...clockOut, requiresManagerCorrection: true }, clockIn], now), { kind: "available", shift: clockIn, action: "clockIn" });
});

test("clock-in becomes the next action after the available clock-out completes", () => {
    const clockIn = { ...shift, canClockIn: true };
    const clockOut: Shift = { ...shift, id: "current", status: "IN_PROGRESS", canClockOut: true };
    assert.deepEqual(quickClockState([clockOut, clockIn], now), { kind: "available", shift: clockOut, action: "clockOut" });
    assert.deepEqual(quickClockState([{ ...clockOut, status: "COMPLETED", canClockOut: false }, clockIn], now), { kind: "available", shift: clockIn, action: "clockIn" });
});

test("quick clock-in excludes finished, cancelled, started, and correction-required shifts", () => {
    for (const status of ["COMPLETED", "CANCELLED", "NO_SHOW", "IN_PROGRESS"] as const) {
        assert.notEqual(quickClockState([{ ...shift, status, canClockIn: true }], now).kind, "available");
    }
    assert.equal(quickClockState([{ ...shift, actualStart: "2026-11-10T07:00:00Z", canClockIn: true }], now).kind, "empty");
    assert.equal(quickClockState([{ ...shift, requiresManagerCorrection: true, canClockIn: true }], now).kind, "empty");
});

test("waiting uses the next eligible shift and never grants clock-in from elapsed time alone", () => {
    const expired = { ...shift, id: "old", scheduledStart: "2026-11-09T09:00:00Z", clockInDeadline: "2026-11-09T10:00:00Z" };
    assert.deepEqual(quickClockState([expired, shift], now), { kind: "waiting", shift, opensAt: Date.parse(shift.clockInOpensAt) });
    const atOpening = Date.parse(shift.clockInOpensAt);
    assert.equal(quickClockState([shift], atOpening).kind, "unavailable");
    assert.equal(quickClockState([{ ...shift, canClockIn: true }], atOpening).kind, "available");
});

test("empty, already clocked in, and closed windows have explicit fallback states", () => {
    assert.deepEqual(quickClockState([], now), { kind: "empty" });
    assert.deepEqual(quickClockState([{ ...shift, status: "IN_PROGRESS", actualStart: "2026-11-10T07:00:00Z" }], now), { kind: "in-progress" });
    assert.equal(quickClockState([shift], Date.parse("2026-11-10T12:00:00Z")).kind, "unavailable");
});

test("countdown includes days, hours, minutes and the final seconds without negative values", () => {
    assert.equal(clockInCountdown(now + 30 * 60_000, now), "30 minutes");
    assert.equal(clockInCountdown(now + (24 * 60 + 61) * 60_000, now), "1 day 1 hour 1 minute");
    assert.equal(clockInCountdown(now + 3_600_000, now), "1 hour");
    assert.equal(clockInCountdown(now + 59_000, now), "59 seconds");
    assert.equal(clockInCountdown(now + 1, now), "1 second");
    assert.equal(clockInCountdown(now - 1000, now), "0 seconds");
});

