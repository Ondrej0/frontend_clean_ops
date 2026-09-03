import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { config } from "@/config/config.ts";
import { getSites, type Site } from "@/lib/sites";

import type {
    DateSelectArg,
    EventChangeArg,
    EventClickArg,
    EventInput,
} from "@fullcalendar/core";

interface ScheduleRuleRequest {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
}

interface CreateScheduleRequest {
    tenantID: string;
    siteID: string;
    name: string;
    scheduleRule: ScheduleRuleRequest[];
}

export function CreateSchedule() {
    const [events, setEvents] = useState<EventInput[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [selectedSiteID, setSelectedSiteID] = useState<string>("");
    const [name, setName] = useState<string>("");

    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");

    useEffect(() => {
        getSites().then(setSites).catch(() => setError("Unable to load sites."));
    }, []);

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        const scheduleRules: ScheduleRuleRequest[] = [];

        for (const calendarEvent of events) {
            if (!calendarEvent.start || !calendarEvent.end) {
                continue;
            }

            const start = new Date(calendarEvent.start as string | number | Date);
            const end = new Date(calendarEvent.end as string | number | Date);

            const daysOfWeek = [
                "SUNDAY",
                "MONDAY",
                "TUESDAY",
                "WEDNESDAY",
                "THURSDAY",
                "FRIDAY",
                "SATURDAY",
            ];

            const scheduleRule: ScheduleRuleRequest = {
                dayOfWeek: daysOfWeek[start.getDay()],
                startTime: start.toTimeString().slice(0, 5),
                endTime: end.toTimeString().slice(0, 5),
            };

            scheduleRules.push(scheduleRule);
        }

        const request: CreateScheduleRequest = {
            tenantID: config.testTenant,
            siteID: selectedSiteID,
            name: name,
            scheduleRule: scheduleRules,
        };

        console.log(request);

        await createSchedule(request);
    };

    async function createSchedule(request: CreateScheduleRequest) {
        try {
            const response = await fetch(
                `${config.apiBaseUrl}/api/schedules`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(request),
                }
            );

            if (!response.ok) {
                let errorMessage = "Failed to create schedule";

                try {
                    const data = await response.json();

                    if (data.message) {
                        errorMessage = data.message;
                    }
                } catch {
                    // Response did not contain JSON
                }

                setError(errorMessage);
                return;
            }

            setSuccess("Schedule created successfully.");
        } catch {
            setError("Unable to connect to the server.");
        }
    }

    // Called when the user drags across an empty area
    // of the calendar to create a shift.
    const handleSelect = (selectInfo: DateSelectArg) => {
        const newEvent: EventInput = {
            id: crypto.randomUUID(),
            title: "Shift",
            start: selectInfo.start,
            end: selectInfo.end,
        };

        setEvents((currentEvents) => [
            ...currentEvents,
            newEvent,
        ]);

        selectInfo.view.calendar.unselect();
    };

    // Called when an existing shift is dragged or resized.
    const handleEventChange = (changeInfo: EventChangeArg) => {
        const changedEvent = changeInfo.event;

        setEvents((currentEvents) =>
            currentEvents.map((event) =>
                event.id === changedEvent.id
                    ? {
                        ...event,
                        start: changedEvent.start ?? undefined,
                        end: changedEvent.end ?? undefined,
                    }
                    : event
            )
        );
    };

    // Called when the user clicks an existing shift.
    const handleEventClick = (clickInfo: EventClickArg) => {
        const confirmed = window.confirm(
            "Do you want to delete this shift?"
        );

        if (!confirmed) {
            return;
        }

        setEvents((currentEvents) =>
            currentEvents.filter(
                (event) => event.id !== clickInfo.event.id
            )
        );
    };

    return (
        <main className="min-h-full p-6 sm:p-10">
            <div className="mx-auto max-w-6xl">
                {/* Page heading */}
                <div className="mb-8">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Operations</p>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                        Create Schedule
                    </h1>
                    <p className="mt-2 text-slate-500">
                        Drag across the calendar to create a shift.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Schedule details */}
                    <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end">
                        {/* Site */}
                        <div className="flex-1">
                            <label
                                htmlFor="site"
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                                Site
                            </label>

                            <select
                                id="site"
                                value={selectedSiteID}
                                onChange={(event) =>
                                    setSelectedSiteID(event.target.value)
                                }
                                required
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 sm:w-auto"
                            >
                                <option value="">
                                    Select a site
                                </option>

                                {sites.map((site) => (
                                    <option
                                        key={site.id}
                                        value={site.id}
                                    >
                                        {site.name} - {site.postcode}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Schedule name */}
                        <div className="flex-1">
                            <label
                                htmlFor="scheduleName"
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                                Schedule name
                            </label>

                            <input
                                id="scheduleName"
                                type="text"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                placeholder="Schedule name"
                                required
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 sm:w-auto"
                            />
                        </div>

                        {/* Submit */}
                        <div>
                            <button
                                type="submit"
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 sm:w-auto"
                            >
                                Create schedule
                            </button>
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Success message */}
                    {success && (
                        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-700">
                            {success}
                        </div>
                    )}

                    {/* Calendar */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                        <FullCalendar
                            plugins={[
                                timeGridPlugin,
                                interactionPlugin,
                            ]}
                            initialView="timeGridWeek"

                            dayHeaderContent={(arg) =>
                                arg.date.toLocaleDateString("en-GB", {
                                    weekday: "long",
                                })
                            }

                            headerToolbar={{
                                left: "",
                                center: "",
                                right: "",
                            }}

                            selectable={true}
                            editable={true}
                            selectMirror={true}
                            allDaySlot={false}

                            slotMinTime="06:00:00"
                            slotMaxTime="23:00:00"

                            height="auto"

                            select={handleSelect}
                            eventChange={handleEventChange}
                            eventClick={handleEventClick}

                            events={events}
                        />
                    </div>
                </form>
            </div>
        </main>
    );
}