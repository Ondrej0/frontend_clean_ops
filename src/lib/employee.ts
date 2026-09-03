import { config } from "@/config/config";

export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
}

interface GetCleanersResponse {
    cleaners: Employee[];
}

/** Retrieves the cleaners that belong to the configured tenant. */
export async function getCleaners(): Promise<Employee[]> {
    const response = await fetch(
        `${config.apiBaseUrl}/api/cleaner?tenantID=${config.testTenant}`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch cleaners");
    }

    console.log(response);
    const data: GetCleanersResponse = await response.json();
    console.log(data);
    return data.cleaners ?? [];
}