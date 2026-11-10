import { useMemo } from "react";
import { WeeklyCalendar } from "@/components/layout/WeeklyCalendar";
import timeGridPlugin from "@fullcalendar/timegrid";
import type { SchedulesBySite } from "@/lib/schedules";
import { buildScheduleEvents } from "@/lib/scheduleCalendar";

export function ScheduleCalendar({ sites }: { sites: SchedulesBySite[] }) {
    const events = useMemo(() => buildScheduleEvents(sites), [sites]);
    const overlapCount = events.filter((event) => event.extendedProps.overlaps).length;

    return (
        <div className="mb-8">
            <WeeklyCalendar
                heading="Your weekly schedule"
                description="All your sites in one calendar. Hours repeat each week in site local time."
                plugins={[timeGridPlugin]}
                firstDay={1}
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
                        <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide">{event.extendedProps.overlaps ? "Overlap" : "No overlap"}</div>
                    </div>
                )}
                eventDidMount={({ el, event }) => {
                    const details = event.extendedProps;
                    const label = `${event.title}, ${details.timeLabel}. ${details.overlaps ? `Overlaps with ${details.conflicts.join(", ")}` : "No overlap"}`;
                    el.title = label;
                    el.setAttribute("aria-label", label);
                    el.tabIndex = 0;
                }}
            >
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-green-800"><span aria-hidden="true" className="size-2 rounded-full bg-green-700" />No overlap</span>
                    <span className="flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-red-800"><span aria-hidden="true" className="size-2 rounded-full bg-red-700" />Overlapping hours</span>
                </div>
                {overlapCount > 0 && <p role="status" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{overlapCount} weekly {overlapCount === 1 ? "rule overlaps" : "rules overlap"} with other assigned hours. Contact your manager to resolve the clashes.</p>}
                {events.length === 0 && <p className="mt-3 text-sm text-slate-500">No weekly hours assigned yet.</p>}
            </WeeklyCalendar>
        </div>
    );
}
