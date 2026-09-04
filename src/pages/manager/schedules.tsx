import { useEffect, useState } from "react";
import { CalendarDays, Plus, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { ScheduleSiteCard } from "@/components/layout/manager/schedules/ScheduleSiteCard";
import { getSchedulesBySites, type SchedulesBySite } from "@/lib/schedules";

export function Schedules() {
    const [sites, setSites] = useState<SchedulesBySite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadSchedules() {
        setLoading(true);
        setError("");

        try {
            setSites(await getSchedulesBySites());
        } catch {
            setError("We couldn't load your schedules. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let active = true;

        getSchedulesBySites()
            .then((siteList) => active && setSites(siteList))
            .catch(() => active && setError("We couldn't load your schedules. Please try again."))
            .finally(() => active && setLoading(false));

        return () => {
            active = false;
        };
    }, []);

    const scheduleCount = sites.reduce(
        (total, site) => total + (site.schedules?.length ?? 0),
        0
    );

    return (
        <main className="min-h-full p-6 sm:p-10">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                    <div>
                        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Operations</p>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Schedules</h1>
                        <p className="mt-2 text-slate-500">View the weekly cleaning schedules across your sites.</p>
                    </div>
                    <Link to="/manager/schedules/create" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100">
                        <Plus size={18} />
                        Create schedule
                    </Link>
                </div>

                {loading && (
                    <div aria-live="polite" className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
                        Loading schedules…
                    </div>
                )}

                {!loading && error && (
                    <div role="alert" className="flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 sm:flex-row sm:items-center sm:justify-between">
                        <p>{error}</p>
                        <button
                            type="button"
                            onClick={() => void loadSchedules()}
                            className="inline-flex w-fit items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold transition hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-100"
                        >
                            <RefreshCw size={16} />
                            Try again
                        </button>
                    </div>
                )}

                {!loading && !error && sites.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 px-6 py-14 text-center">
                        <CalendarDays className="mx-auto size-9 text-blue-500" />
                        <h2 className="mt-4 text-lg font-semibold text-slate-900">No sites or schedules yet</h2>
                        <p className="mt-1 text-sm text-slate-500">Create a site first, then add its weekly schedule.</p>
                    </div>
                )}

                {!loading && !error && sites.length > 0 && (
                    <>
                        <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
                            <p>
                                <span className="font-semibold text-slate-900">{scheduleCount}</span> {scheduleCount === 1 ? "schedule" : "schedules"} across <span className="font-semibold text-slate-900">{sites.length}</span> {sites.length === 1 ? "site" : "sites"}
                            </p>
                        </div>
                        <div className="grid gap-5">
                            {sites.map((site) => (
                                <ScheduleSiteCard key={site.siteId} site={site} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
