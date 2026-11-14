import { identity } from "./sessionIdentity.ts";
import { config } from "../config/config.ts";
import type { Shift } from "./shifts.ts";

export type AttendanceAction = "clockIn" | "clockOut";

export interface AttendanceRequest {
    tenantId: string;
    siteId: string;
    shiftId: string;
    userId: string;
}

export function scannedSiteId(value: string): string | null {
    const id = value.trim();
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? id : null;
}

export function canRecordAttendance(shift: Shift, action: AttendanceAction): boolean {
    if (shift.requiresManagerCorrection || ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(shift.status)) return false;
    return action === "clockIn" ? shift.canClockIn : shift.canClockOut;
}

export async function recordAttendance(action: AttendanceAction, shift: Shift, qrValue: string): Promise<void> {
    const siteId = scannedSiteId(qrValue);
    if (!siteId) throw new Error("This QR code does not contain a valid site ID. Scan the QR code displayed at your site.");
    if (!canRecordAttendance(shift, action)) throw new Error("This action is no longer available. Check your shifts for the latest status.");

    const body: AttendanceRequest = {
        tenantId: identity.tenantId,
        // This must always be the scanned UUID, never shift.site.id.
        siteId,
        shiftId: shift.id,
        userId: identity.userId,
    };
    let response: Response;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
        response = await fetch(`${config.apiBaseUrl}/api/attendance/${action}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
    } catch {
        // The server may have recorded the request before the connection failed.
        throw new Error("We couldn't confirm your attendance. Check your shifts before scanning again.");
    } finally {
        clearTimeout(timeout);
    }
    if (!response.ok) {
        if (response.status === 400 || response.status === 403 || response.status === 422) {
            throw new Error("Attendance was not accepted. Make sure you scanned this site's QR code and that clocking is still available.");
        }
        if (response.status === 409) throw new Error("Your shift may have changed or this action was already recorded. Check your shifts for the latest status.");
        if (response.status === 401) throw new Error("Your session has expired. Sign in again before clocking.");
        throw new Error("We couldn't confirm your attendance. Check your shifts before scanning again.");
    }
}
