import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ShiftCard } from "@/components/layout/cleaner/myWork/ShiftCard";
import { AttendanceScanner } from "@/components/layout/cleaner/myWork/AttendanceScanner";
import type { AttendanceAction } from "@/lib/attendance";
import { formatShiftDate, getShifts, groupShiftsByDay, londonDate, nextShiftRefresh, type Shift, type ShiftsResponse } from "@/lib/shifts";

export function MyWork() {
    const [data, setData] = useState<ShiftsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [now, setNow] = useState(Date.now);
    const [attempt, setAttempt] = useState(0);
    const [scanner, setScanner] = useState<{ shift: Shift; action: AttendanceAction } | null>(null);
    const [notice, setNotice] = useState("");

    function closeScanner() {
        setScanner(null);
        setLoading(true);
        setAttempt((value) => value + 1);
    }

    useEffect(() => {
        let active = true;
        let controller: AbortController | undefined;
        let timer: ReturnType<typeof setTimeout>;

        async function refresh() {
            clearTimeout(timer);
            controller?.abort();
            const request = new AbortController();
            controller = request;
            const requestedAt = Date.now();
            setLoading(true);
            setError("");
            try {
                const result = await getShifts(request.signal);
                if (!active || request.signal.aborted) return;
                const updatedAt = Date.now();
                setData(result);
                setNow(updatedAt);
                // If a boundary passed during the request, immediately obtain a fresh snapshot.
                timer = setTimeout(() => void refresh(), Math.max(0, nextShiftRefresh(result, requestedAt) - updatedAt));
            } catch (cause) {
                if (!active || request.signal.aborted) return;
                setError(cause instanceof Error ? cause.message : "We couldn't load your shifts. Please try again.");
                // A failed boundary refresh must not leave old availability on screen indefinitely.
                timer = setTimeout(() => void refresh(), 30_000);
            } finally {
                if (active && !request.signal.aborted) setLoading(false);
            }
        }
        const onFocus = () => { void refresh(); };
        const onVisibility = () => { if (document.visibilityState === "visible") void refresh(); };
        void refresh();
        window.addEventListener("focus", onFocus);
        window.addEventListener("pageshow", onFocus);
        window.addEventListener("attendance-updated", onFocus);
        document.addEventListener("visibilitychange", onVisibility);
        return () => {
            active = false;
            clearTimeout(timer);
            controller?.abort();
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("pageshow", onFocus);
            window.removeEventListener("attendance-updated", onFocus);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [attempt]);

    const today = londonDate(now);
    const days = data ? groupShiftsByDay(data) : [];
    const sections = [
        { title: "Today", days: days.filter((day) => day.date === today) },
        { title: "Upcoming shifts", days: days.filter((day) => day.date > today) },
        { title: "Recent shifts", days: days.filter((day) => day.date < today).reverse() },
    ];

    return (
        <main className="min-h-full p-6 sm:p-10">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Cleaner</p>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-950">My Work</h1>
                    <p className="mt-2 text-slate-500">Your shifts and clocking availability. All dates and times are in Europe/London.</p>
                </div>
                {notice && <div role="status" className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"><CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />{notice}</div>}
                {loading && <div role="status" className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">Loading shifts…</div>}
                {!loading && error && (
                    <div role="alert" className="flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 sm:flex-row sm:items-center sm:justify-between">
                        <p>{error}</p>
                        <button type="button" onClick={() => setAttempt((value) => value + 1)} className="inline-flex w-fit items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold transition hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-100">
                            <RefreshCw size={16} aria-hidden="true" />Try again
                        </button>
                    </div>
                )}
                {!loading && !error && data && (
                    <>
                        <p className="mb-4 text-sm text-slate-500">{formatShiftDate(data.fromDate)} – {formatShiftDate(data.toDate)}</p>
                        {data.shifts.length === 0 && (
                            <div className="mb-5 rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 p-6 text-center">
                                <CalendarDays className="mx-auto size-9 text-blue-500" aria-hidden="true" />
                                <h2 className="mt-3 text-lg font-semibold text-slate-900">No shifts this week</h2>
                                <p className="mt-1 text-sm text-slate-500">You have no shifts in the displayed date range.</p>
                            </div>
                        )}
                        <div className="grid gap-8">
                            {sections.filter((section) => section.days.length > 0).map((section) => (
                                <section key={section.title} aria-label={section.title}>
                                    <h2 className="mb-4 text-xl font-semibold tracking-tight text-slate-900">{section.title}</h2>
                                    <div className="grid gap-5">
                                        {section.days.map((day) => (
                                            <section key={day.date} aria-label={formatShiftDate(day.date)} className={`rounded-2xl border p-4 sm:p-5 ${day.date === today ? "border-blue-300 bg-blue-50/50 ring-1 ring-blue-200" : "border-slate-200 bg-white/50"}`}>
                                                <div className="mb-4 flex flex-wrap items-center gap-3">
                                                    <h3 className="font-semibold text-slate-900">{formatShiftDate(day.date)}</h3>
                                                    {day.date === today && <Badge className="bg-blue-600 text-white">Today</Badge>}
                                                </div>
                                                {day.shifts.length === 0 ? <p className="text-sm text-slate-500">No shifts</p> : (
                                                    <div className="grid gap-4 lg:grid-cols-2">{day.shifts.map((shift) => <ShiftCard key={shift.id} shift={shift} now={now} onClock={(action) => { setNotice(""); setScanner({ shift, action }); }} />)}</div>
                                                )}
                                            </section>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </>
                )}
            </div>
            {scanner && <AttendanceScanner
                shift={(!error && data?.shifts.find((shift) => shift.id === scanner.shift.id)) || { ...scanner.shift, canClockIn: false, canClockOut: false }}
                action={scanner.action}
                onClose={closeScanner}
                onRecorded={() => {
                    setNotice(`${scanner.action === "clockIn" ? "Clock-in" : "Clock-out"} submitted for ${scanner.shift.site.name}.`);
                    closeScanner();
                }}
            />}
        </main>
    );
}
