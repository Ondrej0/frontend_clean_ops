import { useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/lib/useSession";
import { sessionChanged, signIn, signOut, type SessionUser } from "@/lib/session";

/** The application boundary: no navigation or pages mount before authentication. */
export function EmployeeSession({ children }: { children: (user: SessionUser) => ReactNode }) {
    const { user, loading, error } = useSession();
    const [busy, setBusy] = useState(false);
    const [actionError, setActionError] = useState("");
    async function login(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setBusy(true);
        setActionError("");
        try { await signIn(String(form.get("email")), String(form.get("password"))); }
        catch (cause) { setActionError(cause instanceof Error ? cause.message : "Unable to sign in."); }
        finally { setBusy(false); }
    }
    async function logout() {
        setBusy(true);
        setActionError("");
        try { await signOut(); }
        catch (cause) { setActionError(cause instanceof Error ? cause.message : "Unable to sign out."); }
        finally { setBusy(false); }
    }
    if (loading) return <p role="status" className="p-6 text-slate-500">Checking your session…</p>;
    if (error) return <div className="p-6"><p role="alert" className="mb-3 text-red-700">{error}</p><Button onClick={sessionChanged}>Try again</Button></div>;
    if (!user) return <main className="p-6 sm:p-10">
        <form onSubmit={login} className="mx-auto max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div><h1 className="text-2xl font-bold text-slate-950">Sign in to CleanOps</h1><p className="mt-2 text-sm text-slate-500">Sign in to access your CleanOps workspace.</p></div>
            <div><label htmlFor="session-email" className="mb-2 block text-sm font-medium">Email</label><Input id="session-email" name="email" type="email" autoComplete="username" required disabled={busy} /></div>
            <div><label htmlFor="session-password" className="mb-2 block text-sm font-medium">Password</label><Input id="session-password" name="password" type="password" autoComplete="current-password" required disabled={busy} /></div>
            {actionError && <p role="alert" className="text-sm text-red-700">{actionError}</p>}
            <Button type="submit" disabled={busy} className="w-full bg-blue-600 text-white hover:bg-blue-700">{busy ? "Signing in…" : "Sign in"}</Button>
        </form>
    </main>;
    return <>
        <div className="flex flex-wrap items-center justify-end gap-3 bg-slate-50 px-6 py-3 text-sm text-slate-600 lg:pl-72">
            <span>Signed in as {user.name}</span><Button variant="outline" disabled={busy} onClick={() => void logout()}>Sign out</Button>
            {actionError && <p role="alert" className="text-red-700">{actionError}</p>}
        </div>
        {children(user)}
    </>;
}

