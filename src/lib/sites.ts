import { config } from "@/config/config";

export interface Site {
    id: string;
    name: string;
    addressLine1: string;
    city: string;
    postcode: string;
    state?: string;
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
