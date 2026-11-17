import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, EventChangeArg, EventClickArg } from "@fullcalendar/core";
import { WeeklyCalendar } from "@/components/layout/WeeklyCalendar";
import { ShiftEditorDialog, type ShiftEditorValue } from "./ShiftEditorDialog";
import { calendarRange, calendarTime, calendarWeek } from "@/lib/shiftCalendar";
import { getShifts, updateShift, type ShiftFilter, type ShiftsResponse } from "@/lib/shifts";
import { buildManagerShiftEvents, defaultShiftTimes, type ManagerShiftContext } from "@/lib/managerShifts";
import { attendanceVariance } from "@/lib/shifts";

export function ManagerShiftsSection({ filter, context }: { filter: ShiftFilter; context: ManagerShiftContext }) {
    const [range, setRange] = useState(() => calendarWeek(Date.now()));
    const [data, setData] = useState<ShiftsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);
    const [editor, setEditor] = useState<ShiftEditorValue | null>(null);
    const [mutationError, setMutationError] = useState("");
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

    const events = useMemo(() => data ? buildManagerShiftEvents(data.shifts, data.timezone, context) : [], [context, data]);

    function retry() {
        setLoading(true);
        setError("");
        setAttempt((value) => value + 1);
    }

    function refreshAfterMutation() {
        setEditor(null);
        setMutationError("");
        setLoading(true);
        setAttempt((value) => value + 1);
    }

    function openSelectedRange(info: DateSelectArg) {
        setEditor({ start: info.start.toISOString().slice(0, 16), end: info.end.toISOString().slice(0, 16) });
        info.view.calendar.unselect();
    }

    function openEvent(info: EventClickArg) {
        const shift = data?.shifts.find((candidate) => candidate.id === info.event.id);
        if (!shift) return;
        setEditor({
            shift,
            start: calendarTime(shift.scheduledStart, data?.timezone).slice(0, 16),
            end: calendarTime(shift.scheduledEnd, data?.timezone).slice(0, 16),
        });
    }

    async function changeEvent(info: EventChangeArg) {
        const shift = data?.shifts.find((candidate) => candidate.id === info.event.id);
        if (!shift || !info.event.start || !info.event.end) {
            info.revert();
            return;
        }
        setMutationError("");
        try {
            await updateShift(shift.id, {
                userId: shift.employee.id,
                scheduledStart: info.event.start.toISOString().slice(0, 19),
                scheduledEnd: info.event.end.toISOString().slice(0, 19),
            });
            refreshAfterMutation();
        } catch (cause) {
            info.revert();
            setMutationError(cause instanceof Error ? cause.message : "Unable to update this shift.");
        }
    }

    return (
        <div className="lg:col-span-3">
            <WeeklyCalendar
                heading="Actual shifts"
                description={`Dated shifts for this ${context}. Dates and times are in ${data?.timezone || "Europe/London"}.`}
                repeatsWeekly={false}
                plugins={[timeGridPlugin, interactionPlugin]}
                initialDate={range.fromDate}
                now={() => calendarTime(Date.now(), data?.timezone)}
                headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
                dayHeaderFormat={{ weekday: "long", day: "numeric", month: "short" }}
                datesSet={({ start, end }) => {
                    const next = calendarRange(start, end);
                    if (next.fromDate === range.fromDate && next.toDate === range.toDate) return;
                    setLoading(true);
                    setError("");
                    setRange(next);
                }}
                firstDay={1}
                timeZone="UTC"
                editable
                selectable
                selectMirror
                slotMinTime="00:00:00"
                slotMaxTime="24:00:00"
                scrollTime="06:00:00"
                slotEventOverlap={false}
                eventMinHeight={64}
                height={650}
                events={events}
                select={openSelectedRange}
                eventClick={openEvent}
                eventChange={(info) => void changeEvent(info)}
                eventContent={({ event, timeText }) => (
                    <div className="h-full min-w-0 overflow-hidden text-xs leading-snug">
                        <div className="truncate font-semibold">{event.extendedProps.heading}</div>
                        <div className="truncate">{event.extendedProps.scheduleName}</div>
                        <div className="mt-1 truncate text-[11px] font-medium tabular-nums">{timeText}</div>
                        <div className="mt-1 truncate text-[10px] font-semibold uppercase tracking-wide">{event.extendedProps.statusLabel}</div>
                        {event.extendedProps.originLabel && <div className="mt-1 truncate text-[10px] font-semibold">{event.extendedProps.originLabel}</div>}
                        {event.extendedProps.actualTime && <div className="mt-1 truncate text-[10px]">Actual {event.extendedProps.actualTime}</div>}
                        {event.extendedProps.attendanceException?.status === "OPEN" && <div className="mt-1 truncate text-[10px] font-semibold text-amber-700">Needs review</div>}
                    </div>
                )}
                eventDidMount={({ el, event }) => {
                    const details = event.extendedProps;
                    const variance = attendanceVariance(details.shift).join("; ");
                    const review = details.attendanceException?.status === "OPEN" ? " Attendance exception needs review." : "";
                    const label = `${event.title}. ${details.statusLabel}.${details.actualTime ? ` Actual ${details.actualTime}.` : ""}${variance ? ` ${variance}.` : ""}${review}`;
                    el.title = label;
                    el.setAttribute("aria-label", label);
                    el.tabIndex = 0;
                }}
            >
                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => setEditor(defaultShiftTimes(range, Date.now()))} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"><Plus className="size-4" aria-hidden="true" />Add shift</button>
                    <p className="text-sm text-slate-500">Drag across empty time to add, or drag and resize a future shift to adjust it.</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700">Scheduled</span>
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-blue-700">In progress</span>
                    <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-green-700">Completed</span>
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-700">Attendance exception / needs review</span>
                    <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-red-700">No show / correction required</span>
                    <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1.5 text-slate-600">Cancelled</span>
                </div>
                {loading && <p role="status" className="mt-3 text-sm text-slate-500">Loading shifts…</p>}
                {mutationError && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{mutationError}</p>}
            {!loading && error && (
                <div role="alert" className="mt-3 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
                    <p>{error}</p>
                    <button type="button" onClick={retry} className="inline-flex w-fit items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 font-semibold transition hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-100"><RefreshCw className="size-4" aria-hidden="true" />Try again</button>
                </div>
            )}
                {!loading && !error && events.length === 0 && <p className="mt-3 text-sm text-slate-500">No shifts in this week.</p>}
            </WeeklyCalendar>
            {editor && <ShiftEditorDialog
                key={`${editor.shift?.id || "new"}-${editor.start}-${editor.end}`}
                value={editor}
                filter={filter}
                context={context}
                onClose={() => setEditor(null)}
                onSaved={refreshAfterMutation}
            />}
        </div>
    );
}
