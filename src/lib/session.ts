import { config } from "../config/config.ts";
import { setSessionIdentity } from "./sessionIdentity.ts";

export interface SessionUser {
    id: string;
    tenantId: string;
    name: string;
    role: "CLEANER" | "MANAGER";
}

export function sessionChanged() {
    if (typeof window !== "undefined") window.dispatchEvent(new Event("session-changed"));
}

async function csrfToken(): Promise<string> {
    const response = await fetch(`${config.apiBaseUrl}/api/session/csrf`, { credentials: "include", cache: "no-store" });
    if (!response.ok) throw new Error("We couldn't start a secure session. Please try again.");
    const data = await response.json() as { token: string };
    return data.token;
}

export async function sessionRequest(path: string, init: RequestInit = {}, fallback = "We couldn't complete the request. Please try again."): Promise<Response> {
    const headers = new Headers(init.headers);
    if (init.method && !["GET", "HEAD"].includes(init.method)) headers.set("X-CSRF-TOKEN", await csrfToken());
    const response = await fetch(`${config.apiBaseUrl}${path}`, { ...init, headers, credentials: "include", cache: "no-store" });
    if (response.status === 401) {
        setSessionIdentity(null);
        sessionChanged();
        throw new Error("Your session has expired. Please sign in again.");
    }
    if (response.status === 403) throw new Error("You don't have permission for this action. Sign in again if your session has expired.");
    if (!response.ok) {
        let message = fallback;
        try {
            const data: unknown = await response.json();
            if (typeof data === "object" && data !== null && "message" in data && typeof data.message === "string" && data.message) message = data.message;
        } catch { /* Empty/non-JSON API errors use the supplied fallback. */ }
        throw new Error(message);
    }
    return response;
}

export async function getSession(signal?: AbortSignal): Promise<SessionUser | null> {
    const response = await fetch(`${config.apiBaseUrl}/api/session/me`, { credentials: "include", cache: "no-store", signal });
    if (response.status === 401) return null;
    if (!response.ok) throw new Error("We couldn't check your session. Please try again.");
    return response.json() as Promise<SessionUser>;
}

export async function signIn(email: string, password: string): Promise<void> {
    const response = await fetch(`${config.apiBaseUrl}/api/session/login`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "X-CSRF-TOKEN": await csrfToken() },
        body: new URLSearchParams({ username: `${config.testTenant}:${email.trim()}`, password }),
    });
    if (!response.ok) throw new Error(response.status === 401 ? "Email or password is incorrect." : "We couldn't sign you in. Please try again.");
    sessionChanged();
}

export async function signOut(): Promise<void> {
    await sessionRequest("/api/session/logout", { method: "POST" });
    setSessionIdentity(null);
    sessionChanged();
}
