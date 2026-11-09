import type { SchedulesBySite } from "./schedules.ts";

const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const daySeconds = 24 * 60 * 60;
const weekSeconds = 7 * daySeconds;

function seconds(time: string) {
    const [hours, minutes, seconds = 0] = time.split(":").map(Number);
    return hours * 3600 + minutes * 60 + seconds;
}

/** Weekly wall-clock rules; end times before start times continue into the next day. */
export function buildScheduleEvents(sites: SchedulesBySite[]) {
    const rules = sites.flatMap((site) => (site.schedules ?? []).flatMap((schedule) =>
        (schedule.scheduleRules ?? []).map((rule) => {
            const day = days.indexOf(rule.dayOfWeek);
            const start = seconds(rule.startTime);
            const end = seconds(rule.endTime);
            return {
                id: `${site.siteId}:${schedule.scheduleId}:${rule.scheduleRuleId}`,
                siteName: site.siteName || "Unnamed site",
                scheduleName: schedule.name || "Unnamed schedule",
                day,
                startTime: rule.startTime,
                endTime: rule.endTime,
                start: day * daySeconds + start,
                end: day * daySeconds + end + (end < start ? daySeconds : 0),
            };
        })
    ));

    return rules.map((rule, index) => {
        const conflicts = rules.filter((other, otherIndex) => otherIndex !== index &&
            // Compare neighbouring weeks too, including Sunday-night/Monday overlaps.
            [-weekSeconds, 0, weekSeconds].some((offset) =>
                rule.start < other.end + offset && other.start + offset < rule.end
            )
        );
        const overlaps = conflicts.length > 0;
        const color = overlaps ? "#b91c1c" : "#15803d";

        return {
            id: rule.id,
            title: `${rule.siteName} · ${rule.scheduleName}`,
            daysOfWeek: [rule.day],
            startTime: rule.startTime,
            // A duration preserves overnight rules in FullCalendar's weekly recurrence.
            duration: { seconds: rule.end - rule.start },
            backgroundColor: color,
            borderColor: color,
            textColor: "#ffffff",
            extendedProps: {
                siteName: rule.siteName,
                scheduleName: rule.scheduleName,
                timeLabel: `${rule.startTime.slice(0, 5)}–${rule.endTime.slice(0, 5)}${rule.end > (rule.day + 1) * daySeconds ? " (next day)" : ""}`,
                overlaps,
                conflicts: conflicts.map((other) => `${other.siteName} · ${other.scheduleName}`),
            },
        };
    });
}
