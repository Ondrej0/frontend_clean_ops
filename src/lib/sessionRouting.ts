export type AppRole = "MANAGER" | "CLEANER";

export function homeForRole(role: AppRole): string {
    return role === "MANAGER" ? "/manager/dashboard" : "/cleaner/my-work";
}

export function canVisitRolePath(role: AppRole, pathname: string): boolean {
    return pathname.startsWith(role === "MANAGER" ? "/manager/" : "/cleaner/");
}
