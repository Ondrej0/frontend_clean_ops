import { config } from "@/config/config";

export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
}

export interface AssignedSchedule {
    id: string;
    name: string;
}

export interface AssignedSite {
    id: string;
    name: string;
    addressLine1: string;
    postcode: string;
}

export interface Cleaner extends Employee {
    role: string;
    payRate: number | null;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    assignedSchedules: AssignedSchedule[];
    assignedSites: AssignedSite[];
}

interface GetCleanersResponse {
    cleaners: Employee[];
}

/** Retrieves the cleaners that belong to the configured tenant. */
export async function getCleaners(): Promise<Employee[]> {
    const response = await fetch(
        `${config.apiBaseUrl}/api/cleaner?tenantId=${config.testTenant}`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch cleaners");
    }

    const data: GetCleanersResponse = await response.json();
    return data.cleaners ?? [];
}

/** Retrieves all available details for one cleaner. */
export async function getCleaner(cleanerId: string): Promise<Cleaner> {
    const response = await fetch(`${config.apiBaseUrl}/api/cleaner/${encodeURIComponent(cleanerId)}`);

    if (!response.ok) {
        throw new Error("Failed to fetch cleaner");
    }

    return response.json() as Promise<Cleaner>;
}
