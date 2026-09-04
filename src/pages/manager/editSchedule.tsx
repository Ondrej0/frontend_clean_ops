import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, EventChangeArg, EventClickArg, EventInput } from "@fullcalendar/core";
import { Building2, CalendarDays, Clock3, LoaderCircle, MapPin, UserPlus, Users } from "lucide-react";
import { PageBackLink } from "@/components/layout/PageBackLink";
import { config } from "@/config/config";
import { assignCleaner, editSchedule, getSchedule, type ScheduleDetails, type ScheduleRuleRequest } from "@/lib/schedules";

const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

function dateForRule(dayOfWeek: string, time: string) {
    const today = new Date();
    const sunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const dayIndex = dayNames.indexOf(dayOfWeek.toUpperCase());
    const [hours, minutes, seconds] = time.split(":").map(Number);
    return new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + Math.max(dayIndex, 0), hours, minutes, seconds || 0);
}

function rulesToEvents(schedule: ScheduleDetails): EventInput[] {
    return (schedule.scheduleRules ?? []).map((rule) => ({
        id: rule.scheduleRuleId,
        title: "Shift",
        start: dateForRule(rule.dayOfWeek, rule.startTime),
        end: dateForRule(rule.dayOfWeek, rule.endTime),
    }));
}

function eventsToRules(events: EventInput[]): ScheduleRuleRequest[] {
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

function formatDate(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

export function EditSchedule() {
    const { scheduleId = "" } = useParams();
    const [schedule, setSchedule] = useState<ScheduleDetails | null>(null);
    const [name, setName] = useState("");
    const [events, setEvents] = useState<EventInput[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function loadSchedule() {
        if (!scheduleId) return;
        setLoading(true);
        setError("");
        try {
            const data = await getSchedule(scheduleId);
            setSchedule(data);
            setName(data.name ?? "");
            setEvents(rulesToEvents(data));
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Unable to load this schedule.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let active = true;

        getSchedule(scheduleId)
            .then((data) => {
                if (!active) return;
                setSchedule(data);
                setName(data.name ?? "");
                setEvents(rulesToEvents(data));
            })
            .catch((loadError: unknown) => {
                if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load this schedule.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => { active = false; };
    }, [scheduleId]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");
        try {
            await editSchedule({
                tenantId: config.testTenant,
                scheduleId,
                name: name.trim(),
                scheduleRule: eventsToRules(events),
            });
            setSuccess("Schedule updated successfully.");
            const refreshed = await getSchedule(scheduleId);
            setSchedule(refreshed);
            setName(refreshed.name ?? "");
            setEvents(rulesToEvents(refreshed));
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Unable to update this schedule.");
        } finally {
            setSaving(false);
        }
    }

    async function handleAssignCleaner() {
        const cleanerId = window.prompt("Enter the cleaner user ID:")?.trim();
        if (!cleanerId) return;
        setAssigning(true);
        setError("");
        setSuccess("");
        try {
            await assignCleaner(scheduleId, cleanerId);
            setSuccess("Cleaner assigned successfully.");
            const refreshed = await getSchedule(scheduleId);
            setSchedule(refreshed);
            setName(refreshed.name ?? "");
            setEvents(rulesToEvents(refreshed));
        } catch (assignError) {
            setError(assignError instanceof Error ? assignError.message : "Unable to assign this cleaner.");
        } finally {
            setAssigning(false);
        }
    }

    function handleSelect(info: DateSelectArg) {
        setEvents((current) => [...current, { id: crypto.randomUUID(), title: "Shift", start: info.start, end: info.end }]);
        info.view.calendar.unselect();
    }

    function handleEventChange(info: EventChangeArg) {
        setEvents((current) => current.map((event) => event.id === info.event.id
            ? { ...event, start: info.event.start ?? undefined, end: info.event.end ?? undefined }
            : event));
    }

    function handleEventClick(info: EventClickArg) {
        if (window.confirm("Do you want to delete this shift?")) {
            setEvents((current) => current.filter((event) => event.id !== info.event.id));
        }
    }

    if (loading) return <main className="min-h-full p-6 sm:p-10"><div className="mx-auto flex max-w-6xl items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm"><LoaderCircle className="size-5 animate-spin text-blue-600" />Loading schedule…</div></main>;

    if (!schedule) return <main className="min-h-full p-6 sm:p-10"><div className="mx-auto max-w-6xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700"><p>{error || "Schedule not found."}</p><button type="button" onClick={() => void loadSchedule()} className="mt-4 rounded-lg bg-white px-3 py-2 text-sm font-semibold">Try again</button></div></main>;

    return (
        <main className="min-h-full p-6 sm:p-10">
            <div className="mx-auto max-w-6xl">
                <PageBackLink to="/manager/schedules">Back to schedules</PageBackLink>
                <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                    <div>
                        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Operations</p>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Edit Schedule</h1>
                        <p className="mt-2 text-slate-500">Update details, adjust weekly shifts, and manage assigned cleaners.</p>
                    </div>
                    <button type="button" onClick={() => void handleAssignCleaner()} disabled={assigning} className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60">
                        {assigning ? <LoaderCircle className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                        Assign cleaner
                    </button>
                </div>

                <div className="mb-6 grid gap-4 lg:grid-cols-3">
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                        <div className="flex gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Building2 className="size-5" /></div><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Site</p><h2 className="mt-1 font-semibold text-slate-900">{schedule.site.name}</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="size-3.5 text-blue-500" />{schedule.site.postcode}</p></div></div>
                        <dl className="mt-5 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2 xl:grid-cols-4"><div><dt className="text-slate-400">Schedule ID</dt><dd className="mt-1 break-all font-medium text-slate-700">{schedule.scheduleId}</dd></div><div><dt className="text-slate-400">Site ID</dt><dd className="mt-1 break-all font-medium text-slate-700">{schedule.site.siteId}</dd></div><div><dt className="text-slate-400">Created</dt><dd className="mt-1 font-medium text-slate-700">{formatDate(schedule.createdAt)}</dd></div><div><dt className="text-slate-400">Last updated</dt><dd className="mt-1 font-medium text-slate-700">{formatDate(schedule.updatedAt)}</dd></div></dl>
                    </section>
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Users className="size-5 text-blue-600" /><h2 className="font-semibold text-slate-900">Assigned cleaners</h2></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{schedule.assignedCleaners?.length ?? 0}</span></div>{!schedule.assignedCleaners?.length ? <p className="mt-5 text-sm text-slate-500">No cleaners assigned yet.</p> : <ul className="mt-4 space-y-2">{schedule.assignedCleaners.map((cleaner) => <li key={cleaner.cleanerId} className="rounded-xl bg-slate-50 px-3 py-2.5"><p className="text-sm font-semibold text-slate-800">{cleaner.firstName} {cleaner.lastName}</p><p className="mt-0.5 break-all text-xs text-slate-400">{cleaner.cleanerId}</p></li>)}</ul>}</section>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end">
                        <div className="flex-1"><label htmlFor="scheduleName" className="mb-1.5 block text-sm font-medium text-slate-700">Schedule name</label><input id="scheduleName" value={name} onChange={(event) => setName(event.target.value)} required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100" /></div>
                        <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{saving && <LoaderCircle className="size-4 animate-spin" />}{saving ? "Saving…" : "Save changes"}</button>
                    </div>
                    {error && <div role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
                    {success && <div role="status" className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-700">{success}</div>}
                    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                        <div className="mb-5 flex items-start gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><CalendarDays className="size-5" /></div><div><h2 className="font-semibold text-slate-900">Weekly schedule</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><Clock3 className="size-3.5" />Drag to create, move or resize shifts. Click a shift to delete it.</p></div></div>
                        <FullCalendar plugins={[timeGridPlugin, interactionPlugin]} initialView="timeGridWeek" initialDate={new Date()} dayHeaderContent={(arg) => arg.date.toLocaleDateString("en-GB", { weekday: "long" })} headerToolbar={{ left: "", center: "", right: "" }} selectable editable selectMirror allDaySlot={false} slotMinTime="06:00:00" slotMaxTime="23:00:00" height="auto" select={handleSelect} eventChange={handleEventChange} eventClick={handleEventClick} events={events} />
                    </section>
                </form>
            </div>
        </main>
    );
}
