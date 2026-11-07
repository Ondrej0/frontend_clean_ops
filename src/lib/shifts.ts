import { config } from "../config/config.ts";

export type ShiftStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

export interface Shift {
    id: string;
    site: { id: string; name: string };
    scheduledStart: string;
    scheduledEnd: string;
    actualStart: string | null;
    actualEnd: string | null;
    status: ShiftStatus;
    clockInOpensAt: string;
    clockInDeadline: string;
    clockOutDeadline: string | null;
    canClockIn: boolean;
    canClockOut: boolean;
    requiresManagerCorrection: boolean;
}

export interface ShiftsResponse {
    timezone: string;
    fromDate: string;
    toDate: string;
    shifts: Shift[];
}

export async function getShifts(signal?: AbortSignal): Promise<ShiftsResponse> {
    const query = new URLSearchParams({ tenantId: config.testTenant, userId: config.testUser });
    const response = await fetch(`${config.apiBaseUrl}/api/shifts?${query}`, { signal, cache: "no-store" });
    if (!response.ok) {
        const fallback = response.status === 404
            ? "No cleaner was found for the configured user and tenant."
            : response.status === 400
                ? "The configured user or tenant ID is invalid."
                : "We couldn't load your shifts. Please try again.";
        throw new Error(fallback);
    }
    const data = await response.json() as ShiftsResponse;
    if (!Array.isArray(data.shifts) || !/^\d{4}-\d{2}-\d{2}$/.test(data.fromDate)
        || !/^\d{4}-\d{2}-\d{2}$/.test(data.toDate) || data.fromDate > data.toDate) {
        throw new Error("Unexpected shifts response. Please try again.");
    }
    return data;
}

const timezone = "Europe/London";
export function londonDate(value: string | number): string {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(new Date(value));
    const part = (type: string) => parts.find((item) => item.type === type)!.value;
    return `${part("year")}-${part("month")}-${part("day")}`;
}

export function formatShiftTime(value: string): string {
    return new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(new Date(value));
}

export function formatShiftDate(value: string): string {
    return new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone, weekday: "short", day: "numeric", month: "short", year: "numeric",
    }).format(new Date(value.length === 10 ? `${value}T12:00:00Z` : value));
}

export function formatShiftDateTime(value: string): string {
    return `${formatShiftDate(value)}, ${formatShiftTime(value)}`;
}

export function groupShiftsByDay(data: ShiftsResponse) {
    const days: { date: string; shifts: Shift[] }[] = [];
    for (let date = data.fromDate; date <= data.toDate;) {
        days.push({ date, shifts: [] });
        const next = new Date(`${date}T12:00:00Z`);
        next.setUTCDate(next.getUTCDate() + 1);
        date = next.toISOString().slice(0, 10);
    }
    for (const shift of data.shifts) {
        // Carry an overlapping overnight shift into the first day, exactly once.
        const date = londonDate(shift.scheduledStart);
        const day = days.find((item) => item.date === (date < data.fromDate ? data.fromDate : date));
        day?.shifts.push(shift);
    }
    for (const day of days) day.shifts.sort((a, b) => Date.parse(a.scheduledStart) - Date.parse(b.scheduledStart));
    return days;
}

export function clockingInformation(shift: Shift, now: number): string[] {
    if (shift.requiresManagerCorrection) return [
        "Manager correction required",
        "You cannot resolve this missing clock-out yourself. Please contact your manager.",
    ];
    if (["COMPLETED", "CANCELLED", "NO_SHOW"].includes(shift.status)) return [];
    const information: string[] = [];
    if (shift.canClockIn) information.push(`Clock-in available — until ${formatShiftDateTime(shift.clockInDeadline)}`);
    if (shift.canClockOut && shift.clockOutDeadline) information.push(`Clock-out available — until ${formatShiftDateTime(shift.clockOutDeadline)}`);
    if (!shift.canClockIn && !shift.canClockOut && shift.status === "SCHEDULED" && !shift.actualStart) {
        if (now < Date.parse(shift.clockInOpensAt)) information.push(`Clock-in opens at ${formatShiftDateTime(shift.clockInOpensAt)}`);
        else if (now > Date.parse(shift.clockInDeadline)) information.push("Clock-in window closed");
    }
    return information;
}

/** Find UK midnight by calendar date, including the 23/25-hour DST days. */
export function nextLondonMidnight(now: number): number {
    const today = londonDate(now);
    let low = Math.floor(now);
    let high = low + 26 * 60 * 60 * 1000;
    while (high - low > 1) {
        const middle = Math.floor((low + high) / 2);
        if (londonDate(middle) === today) low = middle;
        else high = middle;
    }
    return high;
}

export function nextShiftRefresh(data: ShiftsResponse, now: number): number {
    const boundaries = data.shifts.flatMap((shift) => [shift.clockInOpensAt, shift.clockInDeadline, shift.clockOutDeadline])
        .filter((value): value is string => value !== null)
        .map((value) => Date.parse(value) + 1000)
        .filter((value) => value > now);
    return Math.min(nextLondonMidnight(now) + 1000, ...boundaries);
}
