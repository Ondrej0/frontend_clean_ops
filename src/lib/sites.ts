import { config } from "@/config/config";

export interface Site {
    id: string;
    name: string;
    addressLine1: string;
    city: string;
    postcode: string;
    state?: string;
}

export interface SiteSchedule {
    scheduleId: string;
    name: string;
}

export interface SiteCleaner {
    cleanerId: string;
    firstName: string;
    lastName: string;
}

/** The complete site record returned by GET /api/sites/{siteId}. */
export interface SiteDetails {
    siteId: string;
    name: string;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    postcode: string | null;
    contactName: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    status: string | null;
    hourlyRate: number | null;
    createdAt: string;
    updatedAt: string;
    assignedSchedules: SiteSchedule[];
    assignedCleaners: SiteCleaner[];
}

interface GetSitesResponse {
    Sites: Site[];
}

/** Retrieves the sites that belong to the configured tenant. */
export async function getSites(): Promise<Site[]> {
    const response = await fetch(
        `${config.apiBaseUrl}/api/sites?tenantId=${config.testTenant}`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch sites");
    }

    const data: GetSitesResponse = await response.json();
    return data.Sites ?? [];
}

/** Retrieves all available details and assignments for one site. */
export async function getSite(siteId: string): Promise<SiteDetails> {
    const response = await fetch(`${config.apiBaseUrl}/api/sites/${encodeURIComponent(siteId)}`);

    if (!response.ok) {
        throw new Error("Failed to fetch site");
    }

    return response.json() as Promise<SiteDetails>;
}
