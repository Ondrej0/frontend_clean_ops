import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { ManagerShiftCard } from "./ManagerShiftCard";
import { calendarWeek, moveCalendarWeek } from "@/lib/shiftCalendar";
import { formatShiftDate, getShifts, groupShiftsByDay, londonDate, type ShiftFilter, type ShiftsResponse } from "@/lib/shifts";
import type { ManagerShiftContext } from "@/lib/managerShifts";

export function ManagerShiftsSection({ filter, context }: { filter: ShiftFilter; context: ManagerShiftContext }) {
    const [today] = useState(() => londonDate(Date.now()));
    const [currentWeek] = useState(() => calendarWeek(Date.now()));
    const [range, setRange] = useState(currentWeek);
    const [data, setData] = useState<ShiftsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);
    const filterType = filter.userId !== undefined ? "userId" : "siteId";
    const filterId = filter.userId ?? filter.siteId!;

    useEffect(() => {
        let active = true;
        const controller = new AbortController();
        getShifts(controller.signal, range, filterType === "userId" ? { userId: filterId } : { siteId: filterId })
            .then((result) => active && setData(result))
            .catch((cause: unknown) => {
                if (active && !controller.signal.aborted) setError(cause instanceof Error ? cause.message : "We couldn't load these shifts. Please try again.");
            })
            .finally(() => active && !controller.signal.aborted && setLoading(false));
        return () => {
            active = false;
            controller.abort();
        };
    }, [attempt, filterId, filterType, range]);

    const days = data ? groupShiftsByDay(data) : [];
    const isCurrentWeek = range.fromDate === currentWeek.fromDate;

    function selectRange(nextRange: typeof range) {
        setLoading(true);
        setError("");
        setRange(nextRange);
    }

    function retry() {
        setLoading(true);
        setError("");
        setAttempt((value) => value + 1);
    }

    return (
        <section aria-labelledby={`${context}-shifts-heading`} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <CalendarDays className="size-5 text-blue-600" aria-hidden="true" />
                        <h2 id={`${context}-shifts-heading`} className="font-semibold text-slate-900">Actual shifts</h2>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{formatShiftDate(range.fromDate)} – {formatShiftDate(range.toDate)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => selectRange(moveCalendarWeek(range, -1))} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-100"><ChevronLeft className="size-4" aria-hidden="true" />Previous</button>
                    <button type="button" onClick={() => selectRange(currentWeek)} disabled={isCurrentWeek} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-default disabled:opacity-50">This week</button>
                    <button type="button" onClick={() => selectRange(moveCalendarWeek(range, 1))} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-100">Next<ChevronRight className="size-4" aria-hidden="true" /></button>
                </div>
            </div>

            {loading && <p role="status" className="mt-6 text-sm text-slate-500">Loading shifts…</p>}
            {!loading && error && (
                <div role="alert" className="mt-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
                    <p>{error}</p>
                    <button type="button" onClick={retry} className="inline-flex w-fit items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 font-semibold transition hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-100"><RefreshCw className="size-4" aria-hidden="true" />Try again</button>
                </div>
            )}
            {!loading && !error && data?.shifts.length === 0 && (
                <div className="mt-6 rounded-xl border border-dashed border-blue-200 bg-blue-50/50 p-6 text-center">
                    <CalendarDays className="mx-auto size-8 text-blue-500" aria-hidden="true" />
                    <h3 className="mt-3 font-semibold text-slate-900">No shifts this week</h3>
                    <p className="mt-1 text-sm text-slate-500">There are no actual shifts in the selected date range.</p>
                </div>
            )}
            {!loading && !error && data && data.shifts.length > 0 && (
                <div className="mt-6 grid gap-5">
                    {days.filter((day) => day.shifts.length > 0).map((day) => (
                        <section key={day.date} aria-label={formatShiftDate(day.date)} className={`rounded-2xl border p-4 sm:p-5 ${day.date === today ? "border-blue-300 bg-blue-50/50 ring-1 ring-blue-200" : "border-slate-200 bg-slate-50/40"}`}>
                            <h3 className="mb-4 font-semibold text-slate-900">{formatShiftDate(day.date)}{day.date === today ? " · Today" : ""}</h3>
                            <div className="grid gap-4 lg:grid-cols-2">
                                {day.shifts.map((shift) => <ManagerShiftCard key={shift.id} shift={shift} context={context} />)}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </section>
    );
}
