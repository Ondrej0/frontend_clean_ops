import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { config } from "@/config/config.ts";

import type {
    DateSelectArg,
    EventChangeArg,
    EventClickArg,
    EventInput,
} from "@fullcalendar/core";

interface Site {
    id: string;
    name: string;
    addressLine1: string;
    city: string;
    postcode: string;
    state: string;
}

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
        const fetchSites = async () => {
            const response = await fetch(
                `${config.apiBaseUrl}/api/sites?tenantID=${config.testTenant}`
            );

            if (!response.ok) {
                throw new Error("Failed to fetch sites");
            }

            const sitesList = await response.json();

            console.log(sitesList);

            setSites(sitesList.Sites);
        };

        void fetchSites();
    }, []);

    useEffect(() => {
        console.log("Sites state updated:", sites);
    }, [sites]);

    useEffect(() => {
        console.log("The events have been updated: ", events);
    }, [events]);

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

            const start = new Date(calendarEvent.start);
            const end = new Date(calendarEvent.end);

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
        <div className="p-6">
            {/* Page heading */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold">
                    Create Schedule
                </h1>

                <p className="text-gray-500">
                    Drag across the calendar to create a shift.
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Schedule details */}
                <div className="mb-6 flex items-end gap-4">
                    {/* Site */}
                    <div>
                        <label
                            htmlFor="site"
                            className="mb-1 block text-sm font-medium"
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
                            className="rounded-md border px-3 py-2"
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
                    <div>
                        <label
                            htmlFor="scheduleName"
                            className="mb-1 block text-sm font-medium"
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
                            className="rounded-md border px-3 py-2"
                        />
                    </div>

                    {/* Submit */}
                    <div>
                        <button
                            type="submit"
                            className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                        >
                            Create Schedule
                        </button>
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-6 rounded-md border border-red-300 bg-red-50 p-3 text-red-700">
                        {error}
                    </div>
                )}

                {/* Success message */}
                {success && (
                    <div className="mb-6 rounded-md border border-green-300 bg-green-50 p-3 text-green-700">
                        {success}
                    </div>
                )}

                {/* Calendar */}
                <div className="rounded-lg border bg-white p-4">
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
    );
}