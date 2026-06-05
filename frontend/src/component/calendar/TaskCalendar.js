'use client';

import React, { useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { toDateKey } from '@/utils/calendarTasks';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar.css';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }),
    getDay,
    locales,
});

const TaskCalendar = ({
    events = [],
    calendarDate,
    onNavigate,
    onSelectDate,
}) => {
    const { components, eventPropGetter } = useMemo(
        () => ({
            eventPropGetter: (event) => ({
                className:
                    event.resource?.type === 'offer'
                        ? 'rbc-event-offer'
                        : 'rbc-event-order',
            }),
            components: {
                month: {
                    dateHeader: ({ label, date }) => {
                        const dateKey = toDateKey(date);
                        const count = events.filter(
                            (e) => toDateKey(e.start) === dateKey,
                        ).length;
                        return (
                            <button
                                type="button"
                                className="rbc-button-link"
                                onClick={() => onSelectDate(dateKey)}
                            >
                                <span>{label}</span>
                                {count > 0 && (
                                    <span className="ml-1 text-[10px] text-gray-500">
                                        ({count})
                                    </span>
                                )}
                            </button>
                        );
                    },
                },
            },
        }),
        [events, onSelectDate],
    );

    return (
        <div className="task-calendar bg-white border border-gray-200 rounded-lg p-3 md:p-4">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
                defaultView={Views.MONTH}
                date={calendarDate}
                onNavigate={onNavigate}
                selectable
                popup
                onSelectSlot={({ start }) => onSelectDate(toDateKey(start))}
                onSelectEvent={(event) => onSelectDate(toDateKey(event.start))}
                eventPropGetter={eventPropGetter}
                components={components}
                style={{ height: 680 }}
                messages={{
                    next: 'Next',
                    previous: 'Back',
                    today: 'Today',
                    month: 'Month',
                    week: 'Week',
                    agenda: 'Agenda',
                    noEventsInRange: 'No tasks in this period.',
                    showMore: (total) => `+${total} more`,
                }}
            />
        </div>
    );
};

export default TaskCalendar;
