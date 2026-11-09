import { config } from "../config/config.ts";

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

/** The fields accepted by PUT /api/sites/{siteId}. */
export interface EditSiteRequest {
    tenantId: string;
    siteId: string;
    name: string;
    addressLine1: string;
    city: string;
    postcode: string;
    contactName: string;
    contactPhone: string;
    contactEmail: string;
    hourlyRate: number | null;
}

interface GetSitesResponse {
    Sites: Site[];
}

/** Retrieves tenant sites, optionally restricted to the given user. */
export async function getSites(userId?: string): Promise<Site[]> {
    const query = new URLSearchParams({ tenantId: config.testTenant });
    if (userId !== undefined) query.set("userId", userId);

    const response = await fetch(
        `${config.apiBaseUrl}/api/sites?${query}`
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

/** Updates the editable location and contact fields for a site. */
export async function editSite(siteId: string, request: EditSiteRequest): Promise<void> {
    const response = await fetch(`${config.apiBaseUrl}/api/sites/${encodeURIComponent(siteId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        let message = "Failed to save site changes.";
        try {
            const data: unknown = await response.json();
            if (typeof data === "object" && data !== null && "message" in data && typeof data.message === "string") {
                message = data.message;
            }
        } catch {
            // The API may return an empty or non-JSON error response.
        }
        throw new Error(message);
    }
}
