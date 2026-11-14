import { sessionRequest } from "./session.ts";
import type { ShiftDateRange, ShiftsResponse } from "./shifts.ts";
import type { SchedulesBySite } from "./schedules.ts";

export type EmployeeFlagStatus = "OPEN" | "RESOLVED";
export interface EmployeeFlag {
    id: string;
    employeeId: string;
    employeeName: string;
    type: "SCHEDULE_OVERLAP";
    status: EmployeeFlagStatus;
    message: string;
    createdAt: string;
    resolvedAt: string | null;
    resolvedBy: string | null;
    firstShiftId: string | null;
    secondShiftId: string | null;
}
export interface OverlapReportResult { detected: number; created: number; alreadyReported: number }

export async function reportScheduleOverlaps(range: ShiftDateRange): Promise<OverlapReportResult> {
    const response = await sessionRequest("/api/employee-flags/schedule-overlaps", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromDate: range.fromDate, toDate: range.toDate }),
    });
    return response.json() as Promise<OverlapReportResult>;
}

export function overlapReportMessage(result: OverlapReportResult): string {
    if (result.detected === 0) return "No overlaps were found. Your schedule may have changed since it was loaded.";
    if (result.created === 0) return "All detected overlaps have already been reported and are awaiting resolution.";
    return `${result.created} ${result.created === 1 ? "overlap has" : "overlaps have"} been reported to your manager.${result.alreadyReported > 0 ? ` ${result.alreadyReported} already reported.` : ""}`;
}

export async function getEmployeeFlags(status?: EmployeeFlagStatus, employeeId?: string, signal?: AbortSignal): Promise<EmployeeFlag[]> {
    const query = new URLSearchParams();
    if (status) query.set("status", status);
    if (employeeId) query.set("employeeId", employeeId);
    const response = await sessionRequest(`/api/employee-flags?${query}`, { signal });
    return response.json() as Promise<EmployeeFlag[]>;
}

export async function resolveEmployeeFlag(id: string): Promise<EmployeeFlag> {
    const response = await sessionRequest(`/api/employee-flags/${encodeURIComponent(id)}/resolve`, { method: "POST" });
    return response.json() as Promise<EmployeeFlag>;
}

export async function getMyCalendarShifts(range: ShiftDateRange, signal?: AbortSignal): Promise<ShiftsResponse> {
    const query = new URLSearchParams({ fromDate: range.fromDate, toDate: range.toDate });
    const response = await sessionRequest(`/api/me/shifts?${query}`, { signal });
    return response.json() as Promise<ShiftsResponse>;
}

export async function getMySchedules(signal?: AbortSignal): Promise<SchedulesBySite[]> {
    return (await sessionRequest("/api/me/schedules", { signal })).json() as Promise<SchedulesBySite[]>;
}
