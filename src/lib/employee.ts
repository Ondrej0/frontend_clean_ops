import { identity } from "./sessionIdentity.ts";
import { config } from "../config/config.ts";
import { sessionRequest } from "./session.ts";

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
    address?: string | null;
    role: string;
    payRate: number | null;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    assignedSchedules: AssignedSchedule[];
    assignedSites: AssignedSite[];
}

/** The fields accepted by PUT /api/cleaner/{cleanerId}. */
export interface EditEmployeeRequest {
    tenantId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    role: string;
    payRate: number | null;
    address?: string;
}

interface GetCleanersResponse {
    cleaners: Employee[];
}

/** Retrieves the cleaners that belong to the configured tenant. */
export async function getCleaners(): Promise<Employee[]> {
    const response = await fetch(
        `${config.apiBaseUrl}/api/cleaner?tenantId=${identity.tenantId}`
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

/** Updates the editable details for one cleaner. */
export async function editEmployee(cleanerId: string, request: EditEmployeeRequest): Promise<void> {
    await sessionRequest(`/api/cleaner/${encodeURIComponent(cleanerId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
    }, "Failed to save employee changes.");
}
