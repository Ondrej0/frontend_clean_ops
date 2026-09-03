import { useEffect, useState } from "react";
import { Building2, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { SiteCard } from "@/components/layout/manager/sites/SiteCard";
import { getSites, type Site } from "@/lib/sites";

export function ManagerSites() {
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        getSites()
            .then((siteList) => active && setSites(siteList))
            .catch(() => active && setError("We couldn't load your sites. Please try again."))
            .finally(() => active && setLoading(false));

        return () => {
            active = false;
        };
    }, []);

    return (
        <main className="min-h-full p-6 sm:p-10">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                    <div>
                        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Operations</p>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Sites</h1>
                        <p className="mt-2 text-slate-500">Manage the locations your cleaning teams support.</p>
                    </div>
                    <Link to="/manager/sites/create" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100">
                        <Plus size={18} />
                        Create site
                    </Link>
                </div>

                {loading && <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">Loading sites…</p>}
                {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}

                {!loading && !error && sites.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 px-6 py-14 text-center">
                        <Building2 className="mx-auto size-9 text-blue-500" />
                        <h2 className="mt-4 text-lg font-semibold text-slate-900">No sites yet</h2>
                        <p className="mt-1 text-sm text-slate-500">Create your first location to get started.</p>
                    </div>
                )}

                {!loading && !error && sites.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {sites.map((site) => <SiteCard key={site.id} site={site} />)}
                    </div>
                )}
            </div>
        </main>
    );
}
