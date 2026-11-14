import type { Shift, ShiftDateRange } from "./shifts.ts";

/** Project instants onto the calendar's wall-clock grid, independently of browser timezone. */
export function calendarTime(value: string | number, timezone = "Europe/London"): string {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date(value));
    const part = (type: string) => parts.find((item) => item.type === type)!.value;
    return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}:${part("second")}`;
}

export function calendarWeek(now: number): ShiftDateRange {
    const start = new Date(`${calendarTime(now).slice(0, 10)}T00:00:00Z`);
    start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    return { fromDate: start.toISOString().slice(0, 10), toDate: end.toISOString().slice(0, 10) };
}

/** FullCalendar's end is exclusive; the shifts API's toDate is inclusive. */
export function calendarRange(start: Date, end: Date): ShiftDateRange {
    return { fromDate: start.toISOString().slice(0, 10), toDate: new Date(end.getTime() - 1).toISOString().slice(0, 10) };
}

export function buildShiftEvents(shifts: Shift[], timezone: string) {
    return shifts.map((shift) => {
        const cancelled = shift.status === "CANCELLED";
        const conflicts = cancelled ? [] : shifts.filter((other) => other.id !== shift.id && other.status !== "CANCELLED"
            && Date.parse(shift.scheduledStart) < Date.parse(other.scheduledEnd)
            && Date.parse(other.scheduledStart) < Date.parse(shift.scheduledEnd));
        const overlaps = conflicts.length > 0;
        const start = calendarTime(shift.scheduledStart, timezone);
        const end = calendarTime(shift.scheduledEnd, timezone);
        const scheduleName = shift.scheduleName || "Shift";
        const timeLabel = `${start.slice(11, 16)}–${end.slice(11, 16)}${start.slice(0, 10) !== end.slice(0, 10) ? ` (${end.slice(0, 10)})` : ""}`;
        return {
            id: shift.id,
            title: `${shift.site.name} · ${scheduleName}`,
            start, end, allDay: false,
            backgroundColor: cancelled ? "#f1f5f9" : overlaps ? "#fef2f2" : "#f0fdf4",
            borderColor: cancelled ? "#94a3b8" : overlaps ? "#dc2626" : "#16a34a",
            textColor: cancelled ? "#475569" : overlaps ? "#991b1b" : "#166534",
            extendedProps: {
                shiftId: shift.id, siteName: shift.site.name, scheduleName,
                status: shift.status, cancelled, timeLabel, overlaps,
                conflicts: conflicts.map((other) => `${other.site.name} · ${other.scheduleName || "Shift"}`),
            },
        };
    });
}
