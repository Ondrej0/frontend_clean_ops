import { canRecordAttendance, type AttendanceAction } from "./attendance.ts";
import type { Shift } from "./shifts.ts";

export type QuickClockState =
    | { kind: "available"; shift: Shift; action: AttendanceAction }
    | { kind: "waiting"; shift: Shift; opensAt: number }
    | { kind: "unavailable"; shift: Shift }
    | { kind: "in-progress" }
    | { kind: "empty" };

export function quickClockState(shifts: Shift[], now: number): QuickClockState {
    const ordered = [...shifts].sort((a, b) => Date.parse(a.scheduledStart) - Date.parse(b.scheduledStart));
    // Clock-out always takes priority, even when a different shift can be clocked into.
    const clockOut = ordered.find((shift) => canRecordAttendance(shift, "clockOut"));
    if (clockOut) return { kind: "available", shift: clockOut, action: "clockOut" };

    const scheduled = ordered
        .filter((shift) => shift.status === "SCHEDULED" && !shift.actualStart && !shift.requiresManagerCorrection);
    // Server availability is authoritative, including changes to the normal window.
    const available = scheduled.find((shift) => canRecordAttendance(shift, "clockIn"));
    if (available) return { kind: "available", shift: available, action: "clockIn" };

    const next = scheduled.find((shift) => Date.parse(shift.clockInDeadline) >= now);
    if (next) {
        const opensAt = Date.parse(next.clockInOpensAt);
        return opensAt > now
            ? { kind: "waiting", shift: next, opensAt }
            : { kind: "unavailable", shift: next };
    }
    if (shifts.some((shift) => shift.status === "IN_PROGRESS")) return { kind: "in-progress" };
    if (scheduled.length) return { kind: "unavailable", shift: scheduled[scheduled.length - 1] };
    return { kind: "empty" };
}

export function clockInCountdown(opensAt: number, now: number): string {
    const seconds = Math.max(0, Math.ceil((opensAt - now) / 1000));
    if (seconds < 60) return seconds === 1 ? "1 second" : `${seconds} seconds`;
    const minutes = Math.ceil(seconds / 60);
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const remainder = minutes % 60;
    return [
        days && `${days} ${days === 1 ? "day" : "days"}`,
        hours && `${hours} ${hours === 1 ? "hour" : "hours"}`,
        remainder && `${remainder} ${remainder === 1 ? "minute" : "minutes"}`,
    ].filter(Boolean).join(" ");
}
