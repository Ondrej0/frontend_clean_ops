import type { EventInput } from "@fullcalendar/core";
import type { ScheduleDetails, ScheduleRuleRequest } from "./schedules.ts";

const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

function dateForRule(dayOfWeek: string, time: string, today: Date) {
    const sunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const dayIndex = dayNames.indexOf(dayOfWeek.toUpperCase());
    const [hours, minutes, seconds] = time.split(":").map(Number);
    return new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + Math.max(dayIndex, 0), hours, minutes, seconds || 0);
}

export function rulesToEvents(schedule: ScheduleDetails, today = new Date()): EventInput[] {
    return (schedule.scheduleRules ?? []).map((rule) => {
        const start = dateForRule(rule.dayOfWeek, rule.startTime, today);
        const end = dateForRule(rule.dayOfWeek, rule.endTime, today);
        if (end < start) end.setDate(end.getDate() + 1);
        return { id: rule.scheduleRuleId, title: "Shift", start, end };
    });
}

export function eventsToRules(events: EventInput[]): ScheduleRuleRequest[] {
    return events.flatMap((event) => {
        if (!event.start || !event.end) return [];
        const start = new Date(event.start as string | number | Date);
        const end = new Date(event.end as string | number | Date);
        return [{
            dayOfWeek: dayNames[start.getDay()],
            startTime: start.toTimeString().slice(0, 8),
            endTime: end.toTimeString().slice(0, 8),
        }];
    });
}
