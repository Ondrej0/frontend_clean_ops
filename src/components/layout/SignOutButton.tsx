import { useState } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/session";

export function SignOutButton() {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    async function logout() {
        if (busy) return;
        setBusy(true);
        setError("");
        try { await signOut(); }
        catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to sign out. Please try again."); }
        finally { setBusy(false); }
    }
    return <>
        <button type="button" className="app-navigation-link w-full cursor-pointer border-0 bg-transparent disabled:opacity-50" aria-label="Sign out" title="Sign out" disabled={busy} onClick={() => void logout()}>
            <LogOut aria-hidden="true" />
            <span className="app-navigation-label">{busy ? "Signing out…" : "Sign out"}</span>
        </button>
        {error && <p role="alert" className="absolute bottom-full left-2 right-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 lg:static lg:mt-2">{error}</p>}
    </>;
}
