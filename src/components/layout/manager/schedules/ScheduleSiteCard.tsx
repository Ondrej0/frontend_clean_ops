import { Building2, CalendarDays, Clock3, MapPin } from "lucide-react";
import type { ScheduleRule, SchedulesBySite } from "@/lib/schedules";

interface ScheduleSiteCardProps {
    site: SchedulesBySite;
}

const dayOrder = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
];

function formatDay(day: string) {
    return day.charAt(0) + day.slice(1).toLowerCase();
}

function formatTime(time: string) {
    const [hours, minutes] = time.split(":").map(Number);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
        return time;
    }

    return new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC",
    }).format(new Date(Date.UTC(2000, 0, 1, hours, minutes)));
}

function sortRules(rules: ScheduleRule[]) {
    return [...rules].sort(
        (a, b) => dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek)
    );
}

export function ScheduleSiteCard({ site }: ScheduleSiteCardProps) {
    const location = [site.addressLine1, site.city, site.postcode]
        .filter(Boolean)
        .join(", ");
    const scheduleCount = site.schedules?.length ?? 0;

    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3.5">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Building2 size={22} />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                            {site.siteName || "Unnamed site"}
                        </h2>
                        <div className="mt-1 flex gap-1.5 text-sm text-slate-500">
                            <MapPin className="mt-0.5 size-4 shrink-0 text-blue-500" aria-hidden="true" />
                            <p>{location || "Address not yet provided"}</p>
                        </div>
                    </div>
                </div>
                <span className="w-fit shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    {scheduleCount} {scheduleCount === 1 ? "schedule" : "schedules"}
                </span>
            </div>

            {scheduleCount === 0 ? (
                <div className="px-5 py-8 text-center">
                    <CalendarDays className="mx-auto size-7 text-slate-300" />
                    <p className="mt-2 text-sm font-medium text-slate-700">No schedules for this site</p>
                    <p className="mt-1 text-xs text-slate-500">Create one to add weekly cleaning hours.</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {site.schedules.map((schedule) => {
                        const rules = sortRules(schedule.scheduleRules ?? []);

                        return (
                            <section key={schedule.scheduleId} className="p-5">
                                <div className="mb-3 flex items-center gap-2">
                                    <CalendarDays className="size-4 text-blue-500" aria-hidden="true" />
                                    <h3 className="font-semibold text-slate-900">
                                        {schedule.name || "Unnamed schedule"}
                                    </h3>
                                </div>

                                {rules.length === 0 ? (
                                    <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
                                        No weekly hours have been added.
                                    </p>
                                ) : (
                                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                        {rules.map((rule) => (
                                            <div
                                                key={rule.scheduleRuleId}
                                                className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5"
                                            >
                                                <span className="text-sm font-medium text-slate-700">
                                                    {formatDay(rule.dayOfWeek)}
                                                </span>
                                                <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-slate-500">
                                                    <Clock3 className="size-3.5 text-blue-500" aria-hidden="true" />
                                                    {formatTime(rule.startTime)}–{formatTime(rule.endTime)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        );
                    })}
                </div>
            )}
        </article>
    );
}
