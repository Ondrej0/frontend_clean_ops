import { useEffect, useState } from "react";
import { CalendarDays, RefreshCw } from "lucide-react";
import { ScheduleSiteCard } from "@/components/layout/manager/schedules/ScheduleSiteCard";
import { ScheduleCalendar } from "@/components/layout/cleaner/ScheduleCalendar";
import { config } from "@/config/config";
import { getSchedulesBySites, type SchedulesBySite } from "@/lib/schedules";

export function MySchedule() {
    const [sites, setSites] = useState<SchedulesBySite[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let active = true;
        getSchedulesBySites(config.testUser)
            .then((data) => active && setSites(data))
            .catch(() => active && setError("We couldn't load your schedules. Please try again."))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, [attempt]);

    function retry() {
        setLoading(true);
        setError("");
        setAttempt((value) => value + 1);
    }

    const scheduleCount = sites.reduce((total, site) => total + (site.schedules?.length ?? 0), 0);

    return (
        <main className="min-h-full p-6 sm:p-10">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Cleaner</p>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-950">My Schedule</h1>
                    <p className="mt-2 text-slate-500">Your assigned weekly cleaning hours across all your sites.</p>
                </div>

                {loading && <p role="status" className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">Loading schedules…</p>}
                {!loading && error && (
                    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
                        <p>{error}</p>
                        <button type="button" onClick={retry} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold shadow-sm transition hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-100">
                            <RefreshCw className="size-4" aria-hidden="true" />Try again
                        </button>
                    </div>
                )}
                {!loading && !error && (
                    <>
                        <ScheduleCalendar sites={sites} />
                        {scheduleCount === 0 && (
                            <div className="mb-5 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 px-6 py-10 text-center">
                                <CalendarDays className="mx-auto size-9 text-blue-500" aria-hidden="true" />
                                <h2 className="mt-4 text-lg font-semibold text-slate-900">No schedules assigned yet</h2>
                                <p className="mt-1 text-sm text-slate-500">Your schedules will appear here once your manager assigns them to you.</p>
                            </div>
                        )}
                        {sites.length > 0 && (
                            <>
                                <h2 className="mb-2 text-lg font-semibold text-slate-900">Schedules by site</h2>
                                <p className="mb-4 text-sm text-slate-500">{scheduleCount} {scheduleCount === 1 ? "schedule" : "schedules"} across {sites.length} {sites.length === 1 ? "site" : "sites"}</p>
                                <div className="grid gap-5">
                                    {sites.map((site) => <ScheduleSiteCard key={site.siteId} site={site} readOnly />)}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
