import type { Shift } from "./shifts.ts";
import { formatShiftTime } from "./shifts.ts";
import { calendarTime } from "./shiftCalendar.ts";

export type ManagerShiftContext = "employee" | "site";

export function managerShiftHeading(shift: Shift, context: ManagerShiftContext) {
    return context === "site"
        ? [shift.employee.firstName, shift.employee.lastName].filter(Boolean).join(" ") || "Unnamed employee"
        : shift.site.name || "Unnamed site";
}

const statusPresentation = {
    COMPLETED: { label: "Completed", backgroundColor: "#f0fdf4", borderColor: "#16a34a", textColor: "#166534" },
    CANCELLED: { label: "Cancelled", backgroundColor: "#f1f5f9", borderColor: "#94a3b8", textColor: "#475569" },
    NO_SHOW: { label: "No show", backgroundColor: "#fef2f2", borderColor: "#dc2626", textColor: "#991b1b" },
    IN_PROGRESS: { label: "In progress", backgroundColor: "#eff6ff", borderColor: "#2563eb", textColor: "#1e40af" },
    SCHEDULED: { label: "Scheduled", backgroundColor: "#f8fafc", borderColor: "#64748b", textColor: "#334155" },
} as const;

export function buildManagerShiftEvents(shifts: Shift[], timezone: string, context: ManagerShiftContext) {
    return shifts.map((shift) => {
        const heading = managerShiftHeading(shift, context);
        const scheduleName = shift.scheduleName || "Standalone shift";
        const presentation = shift.requiresManagerCorrection
            ? { label: "Correction required", backgroundColor: "#fef2f2", borderColor: "#dc2626", textColor: "#991b1b" }
            : statusPresentation[shift.status];
        const actualTime = shift.actualStart
            ? `${formatShiftTime(shift.actualStart)}${shift.actualEnd ? `–${formatShiftTime(shift.actualEnd)}` : "–ongoing"}`
            : null;
        return {
            id: shift.id,
            title: `${heading} · ${scheduleName}`,
            start: calendarTime(shift.scheduledStart, timezone),
            end: calendarTime(shift.scheduledEnd, timezone),
            allDay: false,
            editable: shift.managerEditable && Date.parse(shift.scheduledStart) > Date.now(),
            startEditable: shift.managerEditable && Date.parse(shift.scheduledStart) > Date.now(),
            durationEditable: shift.managerEditable && Date.parse(shift.scheduledStart) > Date.now(),
            backgroundColor: presentation.backgroundColor,
            borderColor: presentation.borderColor,
            textColor: presentation.textColor,
            extendedProps: {
                heading,
                scheduleName,
                status: shift.status,
                statusLabel: presentation.label,
                actualTime,
                attendanceException: shift.attendanceException,
                requiresManagerCorrection: shift.requiresManagerCorrection,
                origin: shift.origin,
                originLabel: shift.origin === "ONE_OFF_OVERRIDE" ? "One-off override" : shift.origin === "ONE_OFF" ? "One-off shift" : null,
                shift,
            },
        };
    });
}

export function defaultShiftTimes(range: { fromDate: string; toDate: string }, now: number) {
    const wallNow = calendarTime(now).slice(0, 16);
    const currentDate = wallNow.slice(0, 10);
    const start = currentDate >= range.fromDate && currentDate <= range.toDate
        ? new Date(`${wallNow}:00Z`)
        : new Date(`${range.fromDate}T09:00:00Z`);
    if (currentDate >= range.fromDate && currentDate <= range.toDate) {
        start.setUTCMinutes(0, 0, 0);
        start.setUTCHours(start.getUTCHours() + 1);
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return { start: start.toISOString().slice(0, 16), end: end.toISOString().slice(0, 16) };
}
