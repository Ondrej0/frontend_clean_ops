import { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import type { SchedulesBySite } from "@/lib/schedules";
import { buildScheduleEvents } from "@/lib/scheduleCalendar";

export function ScheduleCalendar({ sites }: { sites: SchedulesBySite[] }) {
    const events = useMemo(() => buildScheduleEvents(sites), [sites]);
    const overlapCount = events.filter((event) => event.extendedProps.overlaps).length;

    return (
        <section aria-labelledby="weekly-schedule-heading" className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 id="weekly-schedule-heading" className="text-lg font-semibold text-slate-900">Your weekly schedule</h2>
            <p className="mt-1 text-sm text-slate-500">All your sites in one calendar. Hours repeat each week in site local time.</p>
            <div className="my-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
                <span className="flex items-center gap-2 text-green-800"><span aria-hidden="true" className="size-3 rounded-full bg-green-700" />No overlap</span>
                <span className="flex items-center gap-2 text-red-800"><span aria-hidden="true" className="size-3 rounded-full bg-red-700" />Overlapping hours</span>
            </div>
            {overlapCount > 0 && <p role="status" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{overlapCount} weekly {overlapCount === 1 ? "rule overlaps" : "rules overlap"} with other assigned hours. Contact your manager to resolve the clashes.</p>}
            {events.length === 0 && <p className="mb-4 text-sm text-slate-500">No weekly hours assigned yet.</p>}
            <div className="overflow-x-auto" role="region" aria-label="Weekly calendar; scroll horizontally on small screens" tabIndex={0}>
                <div className="min-w-[760px]">
                    <FullCalendar
                        plugins={[timeGridPlugin]}
                        initialView="timeGridWeek"
                        firstDay={1}
                        timeZone="UTC"
                        headerToolbar={false}
                        dayHeaderFormat={{ weekday: "long" }}
                        allDaySlot={false}
                        editable={false}
                        selectable={false}
                        slotMinTime="00:00:00"
                        slotMaxTime="24:00:00"
                        scrollTime="06:00:00"
                        slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
                        eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
                        slotEventOverlap={false}
                        eventMinHeight={64}
                        height={650}
                        events={events}
                        eventContent={({ event, timeText }) => (
                            <div className="overflow-hidden p-1 text-xs leading-snug">
                                <div className="font-bold break-words">{event.extendedProps.siteName}</div>
                                <div className="break-words">{event.extendedProps.scheduleName}</div>
                                <div>{timeText}</div>
                                <div className="font-semibold">{event.extendedProps.overlaps ? "Overlap" : "No overlap"}</div>
                            </div>
                        )}
                        eventDidMount={({ el, event }) => {
                            const details = event.extendedProps;
                            const label = `${event.title}, ${details.timeLabel}. ${details.overlaps ? `Overlaps with ${details.conflicts.join(", ")}` : "No overlap"}`;
                            el.title = label;
                            el.setAttribute("aria-label", label);
                            el.tabIndex = 0;
                        }}
                    />
                </div>
            </div>
        </section>
    );
}
