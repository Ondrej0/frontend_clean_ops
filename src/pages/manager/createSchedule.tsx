import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import type {
    DateSelectArg,
    EventChangeArg,
    EventInput,
} from "@fullcalendar/core";

export function CreateSchedule() {
    const [events, setEvents] = useState<EventInput[]>([]);

    // Called when the user drags across an empty area
    // of the calendar to create a shift.
    const handleSelect = (selectInfo: DateSelectArg) => {
        const title = window.prompt("Shift name:");

        if (!title) {
            selectInfo.view.calendar.unselect();
            return;
        }

        const newEvent: EventInput = {
            id: crypto.randomUUID(),
            title,
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

            {/* Calendar */}
            <div className="rounded-lg border bg-white p-4">
                <FullCalendar
                    plugins={[
                        timeGridPlugin,
                        interactionPlugin,
                    ]}
                    initialView="timeGridWeek"

                    // Allow dragging across empty time slots
                    // to create a new event.
                    selectable={true}

                    // Allow existing events to be moved/resized.
                    editable={true}

                    // Shows the event while selecting.
                    selectMirror={true}

                    // Don't show the "all day" row.
                    allDaySlot={false}

                    // Calendar working hours.
                    slotMinTime="06:00:00"
                    slotMaxTime="23:00:00"

                    // Calendar height.
                    height="auto"

                    // Event handlers.
                    select={handleSelect}
                    eventChange={handleEventChange}

                    // Our React events.
                    events={events}
                />
            </div>
        </div>
    );
}