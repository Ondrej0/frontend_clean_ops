import { config } from "../config/config.ts";
import { editEmployee, getCleaner, type Cleaner } from "./employee.ts";

/** Personal details only: employment fields must never come from the form. */
export interface CleanerProfileFields {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
}

export function getProfileFields(cleaner: Cleaner): CleanerProfileFields {
    return {
        firstName: cleaner.firstName ?? "",
        lastName: cleaner.lastName ?? "",
        email: cleaner.email ?? "",
        phone: cleaner.phone ?? "",
        address: cleaner.address ?? "",
    };
}

export function validateProfile(fields: CleanerProfileFields): string | null {
    if (!fields.firstName.trim() || !fields.lastName.trim()) return "First and last names are required.";
    if (fields.firstName.trim().length > 100 || fields.lastName.trim().length > 100) return "Names must be 100 characters or fewer.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim()) || fields.email.trim().length > 255) return "Enter a valid email address.";
    if (fields.phone.trim().length > 50) return "Phone number must be 50 characters or fewer.";
    if (fields.address.trim().length > 500) return "Address must be 500 characters or fewer.";
    return null;
}

export async function saveCleanerProfile(fields: CleanerProfileFields): Promise<Cleaner> {
    const validationError = validateProfile(fields);
    if (validationError) throw new Error(validationError);

    // This PUT requires role and payRate. Read them immediately before saving,
    // and explicitly whitelist form values rather than spreading a form object.
    const current = await getCleaner(config.testUser);
    const request = {
        tenantId: config.testTenant,
        firstName: fields.firstName.trim(),
        lastName: fields.lastName.trim(),
        email: fields.email.trim(),
        phone: fields.phone.trim() || null,
        address: fields.address.trim(),
        role: current.role,
        payRate: current.payRate,
    };
    await editEmployee(config.testUser, request);
    return { ...current, ...request };
}
