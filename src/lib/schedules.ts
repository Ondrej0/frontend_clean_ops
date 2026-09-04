import { config } from "@/config/config";

export interface ScheduleRule {
    scheduleRuleId: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
}

export interface Schedule {
    scheduleId: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    scheduleRules: ScheduleRule[];
}

export interface ScheduleSite {
    siteId: string;
    name: string;
    postcode: string;
}

export interface AssignedCleaner {
    cleanerId: string;
    firstName: string;
    lastName: string;
}

export interface ScheduleDetails extends Schedule {
    site: ScheduleSite;
    assignedCleaners: AssignedCleaner[];
}

export interface ScheduleRuleRequest {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
}

export interface EditScheduleRequest {
    tenantId: string;
    scheduleId: string;
    name: string;
    scheduleRule: ScheduleRuleRequest[];
}

export interface SchedulesBySite {
    siteId: string;
    siteName: string;
    addressLine1: string;
    city: string;
    postcode: string;
    schedules: Schedule[];
}

/** Retrieves active sites and their active schedules for the configured tenant. */
export async function getSchedulesBySites(): Promise<SchedulesBySite[]> {
    const query = new URLSearchParams({ tenantId: config.testTenant });
    const response = await fetch(
        `${config.apiBaseUrl}/api/schedules/by-site?${query.toString()}`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch schedules");
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
        throw new Error("Unexpected schedules response");
    }

    return data as SchedulesBySite[];
}

async function getErrorMessage(response: Response, fallback: string) {
    try {
        const data = await response.json() as { message?: string };
        return data.message || fallback;
    } catch {
        return fallback;
    }
}

export async function getSchedule(scheduleId: string): Promise<ScheduleDetails> {
    const query = new URLSearchParams({ scheduleId });
    const response = await fetch(`${config.apiBaseUrl}/api/schedules?${query.toString()}`);

    if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to fetch schedule"));
    }

    return response.json() as Promise<ScheduleDetails>;
}

export async function editSchedule(request: EditScheduleRequest): Promise<void> {
    const response = await fetch(`${config.apiBaseUrl}/api/schedules/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to update schedule"));
    }
}

export async function assignCleaner(scheduleId: string, cleanerId: string): Promise<void> {
    const query = new URLSearchParams({
        tenantId: config.testTenant,
        scheduleId,
        cleanerId,
    });
    const response = await fetch(
        `${config.apiBaseUrl}/api/schedules/assign/cleaner?${query.toString()}`,
        { method: "POST" }
    );

    if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to assign cleaner"));
    }
}
