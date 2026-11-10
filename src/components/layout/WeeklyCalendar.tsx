import { useId, type ReactNode } from "react";
import FullCalendar from "@fullcalendar/react";
import type { CalendarOptions } from "@fullcalendar/core";
import { CalendarDays, Repeat2 } from "lucide-react";
import "./weeklyCalendar.css";

type WeeklyCalendarProps = CalendarOptions & {
    heading?: string;
    description: string;
    children?: ReactNode;
};

/** Shared presentation for both schedule editors and the cleaner's timetable. */
export function WeeklyCalendar({ heading = "Weekly schedule", description, children, ...options }: WeeklyCalendarProps) {
    const headingId = useId();

    return (
        <section aria-labelledby={headingId} className="weekly-calendar rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="rounded-t-2xl border-b border-slate-100 bg-gradient-to-r from-blue-50/80 to-white p-4 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600 shadow-sm">
                            <CalendarDays className="size-5" aria-hidden="true" />
                        </div>
                        <div>
                            <h2 id={headingId} className="text-lg font-semibold tracking-tight text-slate-900">{heading}</h2>
                            <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
                        </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                        <Repeat2 className="size-3.5" aria-hidden="true" />Repeats weekly
                    </span>
                </div>
                {children && <div className="mt-4">{children}</div>}
            </div>
            <div className="p-3 sm:p-5">
                <p className="mb-3 text-xs text-slate-500 sm:hidden">Swipe across to see all seven days.</p>
                <div className="weekly-calendar-scroll overflow-x-auto rounded-xl border border-slate-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600" role="region" aria-label={`${heading}; scroll horizontally to see all days`} tabIndex={0}>
                    <div className="min-w-[760px]">
                        <FullCalendar
                            initialView="timeGridWeek"
                            headerToolbar={false}
                            dayHeaderFormat={{ weekday: "long" }}
                            allDaySlot={false}
                            slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
                            eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
                            eventBackgroundColor="#eff6ff"
                            eventBorderColor="#3b82f6"
                            eventTextColor="#1e40af"
                            {...options}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
