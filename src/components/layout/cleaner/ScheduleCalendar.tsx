import { useEffect, useMemo, useRef, useState } from "react";
import { Flag, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMyCalendarShifts, overlapReportMessage, reportScheduleOverlaps } from "@/lib/employeeFlags";
import { WeeklyCalendar } from "@/components/layout/WeeklyCalendar";
import timeGridPlugin from "@fullcalendar/timegrid";
import type { ShiftsResponse } from "@/lib/shifts";
import { buildShiftEvents, calendarRange, calendarTime, calendarWeek } from "@/lib/shiftCalendar";

export function ScheduleCalendar() {
    const [range, setRange] = useState(() => calendarWeek(Date.now()));
    const [data, setData] = useState<ShiftsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);
    const [reporting, setReporting] = useState(false);
    const reportingRef = useRef(false);
    const [reportResult, setReportResult] = useState<{ message: string; error: boolean; fromDate: string; toDate: string } | null>(null);

    useEffect(() => {
        let active = true;
        let controller: AbortController | undefined;
        async function refresh() {
            controller?.abort();
            const request = new AbortController();
            controller = request;
            setLoading(true);
            setError("");
            setData(null);
            try {
                const result = await getMyCalendarShifts(range, request.signal);
                if (active && !request.signal.aborted) setData(result);
            } catch (cause) {
                if (active && !request.signal.aborted) setError(cause instanceof Error ? cause.message : "We couldn't load your shifts. Please try again.");
            } finally {
                if (active && !request.signal.aborted) setLoading(false);
            }
        }
        const onFocus = () => { void refresh(); };
        const onVisibility = () => { if (document.visibilityState === "visible") void refresh(); };
        void refresh();
        window.addEventListener("focus", onFocus);
        window.addEventListener("attendance-updated", onFocus);
        document.addEventListener("visibilitychange", onVisibility);
        return () => {
            active = false;
            controller?.abort();
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("attendance-updated", onFocus);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [range, attempt]);

    const events = useMemo(() => data ? buildShiftEvents(data.shifts, data.timezone) : [], [data]);
    const overlapCount = events.filter((event) => event.extendedProps.overlaps).length;
    const visibleReport = reportResult?.fromDate === range.fromDate && reportResult?.toDate === range.toDate ? reportResult : null;

    async function reportOverlaps() {
        if (reportingRef.current || loading || !data || overlapCount === 0) return;
        reportingRef.current = true;
        setReporting(true);
        setReportResult(null);
        const reportedRange = { fromDate: data.fromDate, toDate: data.toDate };
        try {
            const result = await reportScheduleOverlaps(reportedRange);
            setReportResult({ ...reportedRange, message: overlapReportMessage(result), error: false });
            setAttempt((value) => value + 1);
        } catch (cause) {
            setReportResult({ ...reportedRange, message: cause instanceof Error ? cause.message : "We couldn't report the overlaps. Please try again.", error: true });
        } finally {
            reportingRef.current = false;
            setReporting(false);
        }
    }

    return (
        <div className="mb-8">
            <WeeklyCalendar
                heading="Your weekly schedule"
                description={`All your shifts in one calendar. Dates and times are in ${data?.timezone || "Europe/London"}.`}
                repeatsWeekly={false}
                plugins={[timeGridPlugin]}
                initialDate={range.fromDate}
                now={() => calendarTime(Date.now(), data?.timezone)}
                headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
                dayHeaderFormat={{ weekday: "long", day: "numeric", month: "short" }}
                datesSet={({ start, end }) => {
                    const next = calendarRange(start, end);
                    setRange((current) => current.fromDate === next.fromDate && current.toDate === next.toDate ? current : next);
                }}
                firstDay={1}
                // Events and now are explicitly converted to site wall time for this UTC grid.
                timeZone="UTC"
                editable={false}
                selectable={false}
                slotMinTime="00:00:00"
                slotMaxTime="24:00:00"
                scrollTime="06:00:00"
                slotEventOverlap={false}
                eventMinHeight={64}
                height={650}
                events={events}
                eventContent={({ event, timeText }) => (
                    <div className="overflow-hidden text-xs leading-snug">
                        <div className="font-semibold break-words">{event.extendedProps.siteName}</div>
                        <div className="break-words">{event.extendedProps.scheduleName}</div>
                        <div className="mt-1 text-[11px] font-medium tabular-nums">{timeText}</div>
                        <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide">{event.extendedProps.cancelled ? "Cancelled" : event.extendedProps.overlaps ? "Overlap" : "No overlap"}</div>
                    </div>
                )}
                eventDidMount={({ el, event }) => {
                    const details = event.extendedProps;
                    const label = `${event.title}, ${details.timeLabel}. ${details.status.replaceAll("_", " ")}. ${details.overlaps ? `Overlaps with ${details.conflicts.join(", ")}` : "No overlap"}`;
                    el.title = label;
                    el.setAttribute("aria-label", label);
                    el.tabIndex = 0;
                }}
            >
                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <Button variant="destructive" size="lg" className="bg-red-600 text-white hover:bg-red-700" disabled={loading || !!error || overlapCount === 0 || reporting} onClick={() => void reportOverlaps()}>
                        <Flag aria-hidden="true" />{reporting ? "Reporting…" : "Flag Overlaps"}
                    </Button>
                    <p className="text-sm text-slate-500">{!loading && !error && overlapCount === 0 ? "No overlaps to report this week." : "Report this week's overlapping shifts to your manager."}</p>
                </div>
                {visibleReport && <p role={visibleReport.error ? "alert" : "status"} className={`mb-4 rounded-xl px-4 py-3 text-sm ${visibleReport.error ? "bg-red-50 text-red-800" : "bg-blue-50 text-blue-800"}`}>{visibleReport.message}</p>}
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-green-800"><span aria-hidden="true" className="size-2 rounded-full bg-green-700" />No overlap</span>
                    <span className="flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-red-800"><span aria-hidden="true" className="size-2 rounded-full bg-red-700" />Overlapping hours</span>
                </div>
                {loading && <p role="status" className="mt-3 text-sm text-slate-500">Loading shifts…</p>}
                {!loading && error && <div role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
                    <p>{error}</p>
                    <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 font-semibold shadow-sm transition hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-100">
                        <RefreshCw className="size-4" aria-hidden="true" />Try again
                    </button>
                </div>}
                {overlapCount > 0 && <p role="status" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{overlapCount} {overlapCount === 1 ? "shift overlaps" : "shifts overlap"} with other assigned hours. Use Flag Overlaps to ask your manager to review them.</p>}
                {!loading && !error && events.length === 0 && <p className="mt-3 text-sm text-slate-500">No shifts assigned for this week.</p>}
            </WeeklyCalendar>
        </div>
    );
}
