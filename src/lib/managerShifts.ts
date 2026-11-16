import type { Shift } from "./shifts.ts";

export type ManagerShiftContext = "employee" | "site";

export function managerShiftHeading(shift: Shift, context: ManagerShiftContext) {
    return context === "site"
        ? [shift.employee.firstName, shift.employee.lastName].filter(Boolean).join(" ") || "Unnamed employee"
        : shift.site.name || "Unnamed site";
}
