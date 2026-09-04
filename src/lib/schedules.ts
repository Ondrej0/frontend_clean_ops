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
