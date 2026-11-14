import { identity } from "@/lib/sessionIdentity";
import { useEffect, useState } from "react";
import { Building2, RefreshCw } from "lucide-react";
import { SiteCard } from "@/components/layout/manager/sites/SiteCard";
import { getSites, type Site } from "@/lib/sites";

export function CleanerSites() {
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let active = true;
        getSites(identity.userId)
            .then((data) => active && setSites(data))
            .catch(() => active && setError("We couldn't load your sites. Please try again."))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [attempt]);

    function retry() {
        setLoading(true);
        setError("");
        setAttempt((value) => value + 1);
    }

    return (
        <main className="min-h-full p-6 sm:p-10">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Cleaner</p>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-950">My Sites</h1>
                    <p className="mt-2 text-slate-500">Your assigned locations, contact details, and pay rates.</p>
                </div>

                {loading && <p role="status" className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">Loading sites…</p>}
                {!loading && error && (
                    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                        <p>{error}</p>
                        <button type="button" onClick={retry} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold shadow-sm transition hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-100">
                            <RefreshCw className="size-4" aria-hidden="true" />Try again
                        </button>
                    </div>
                )}
                {!loading && !error && sites.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 px-6 py-14 text-center">
                        <Building2 className="mx-auto size-9 text-blue-500" aria-hidden="true" />
                        <h2 className="mt-4 text-lg font-semibold text-slate-900">No sites assigned yet</h2>
                        <p className="mt-1 text-sm text-slate-500">Your sites will appear here once your manager assigns them to you.</p>
                    </div>
                )}
                {!loading && !error && sites.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {sites.map((site) => <SiteCard key={site.id} site={site} to={`/cleaner/my-sites/${encodeURIComponent(site.id)}`} />)}
                    </div>
                )}
            </div>
        </main>
    );
}
