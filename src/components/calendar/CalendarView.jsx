import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus } from 'lucide-react';
import { getDaysInMonth, getDaysInWeek, isSameDay, formatTime, addMonths, addDays } from '../../utils/dateUtils';
import { EVENT_TYPES } from '../../utils/helpers';
import { EventModal } from './EventModal';

export const CalendarView = ({ leads, onUpdateLead, navigateToLead }) => {
    const [view, setView] = useState('month'); // month, week, day
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEventDate, setNewEventDate] = useState(null);

    // Flatten all events from all leads
    const events = useMemo(() => {
        const allEvents = [];
        leads.forEach(lead => {
            if (lead.events && Array.isArray(lead.events)) {
                lead.events.forEach(event => {
                    allEvents.push({ ...event, leadId: lead.id, leadName: lead.name });
                });
            }
        });
        return allEvents.sort((a, b) => a.start - b.start);
    }, [leads]);

    const handlePrev = () => {
        if (view === 'month') setCurrentDate(addMonths(currentDate, -1));
        else if (view === 'week') setCurrentDate(addDays(currentDate, -7));
        else setCurrentDate(addDays(currentDate, -1));
    };

    const handleNext = () => {
        if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
        else if (view === 'week') setCurrentDate(addDays(currentDate, 7));
        else setCurrentDate(addDays(currentDate, 1));
    };

    const handleToday = () => setCurrentDate(new Date());

    const handleEventClick = (event) => {
        setSelectedEvent(event);
        setIsModalOpen(true);
    };

    const handleSaveEvent = (eventData) => {
        const lead = leads.find(l => l.id === eventData.leadId);
        if (!lead) return; // Should not happen if creating from here, but logic needs lead context. 
        // WAIT: Creating global events not attached to a lead? 
        // Requirement says "from view of each lead". 
        // But Calendar view might want to edit existing events.

        const currentEvents = lead.events || [];
        const updatedEvents = currentEvents.map(e => e.id === eventData.id ? eventData : e);

        // If it's a new event created from Calendar (if we allow that), we need a lead context.
        // For now, let's assume we allow editing existing events here.

        onUpdateLead(lead.id, 'events', updatedEvents);
    };

    // Note: Creating new events from blank calendar implies selecting a lead.
    // Simplifying: Calendar is mostly for viewing and editing existing. 
    // New events are created from Lead Detail as per requirements "desde la vista de cada lead".
    // EDIT: User said "The objective ... is to be able -from the view of each lead- to schedule...".
    // So creation is primarily from Lead. 
    // However, clicking an event here should allow editing it.

    const handleUpdateEvent = (updatedEvent) => {
        const lead = leads.find(l => l.id === updatedEvent.leadId);
        if (lead) {
            const currentEvents = lead.events || [];
            const newEvents = currentEvents.map(e => e.id === updatedEvent.id ? updatedEvent : e);
            onUpdateLead(lead.id, 'events', newEvents);
        }
    };

    const handleDeleteEvent = (eventId) => {
        if (selectedEvent) {
            const lead = leads.find(l => l.id === selectedEvent.leadId);
            if (lead) {
                const currentEvents = lead.events || [];
                const newEvents = currentEvents.filter(e => e.id !== eventId);
                onUpdateLead(lead.id, 'events', newEvents);
            }
        }
    };

    const renderEventChip = (event, isCompact = false) => {
        const type = EVENT_TYPES.find(t => t.id === event.type) || EVENT_TYPES[3];
        return (
            <div
                key={event.id}
                onClick={(e) => { e.stopPropagation(); handleEventClick(event); }}
                className={`text-[10px] rounded px-1 py-0.5 mb-1 cursor-pointer truncate border-l-2 shadow-sm hover:opacity-80 ${type.color.replace('text-', 'text-gray-800 ').replace('bg-', 'bg-opacity-20 bg-')}`}
                title={`${event.title} - ${event.leadName}`}
            >
                <span className="font-bold mr-1">{formatTime(new Date(event.start))}</span>
                {event.title}
            </div>
        );
    };

    const renderMonthView = () => {
        const days = getDaysInMonth(currentDate);
        const startDay = days[0].getDay() === 0 ? 6 : days[0].getDay() - 1; // Adjust for Mon start
        const emptyDays = Array.from({ length: startDay });

        return (
            <div className="grid grid-cols-7 gap-1 auto-rows-fr bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                    <div key={d} className="bg-gray-100 p-2 text-center text-xs font-bold text-gray-500 uppercase">
                        {d}
                    </div>
                ))}
                {emptyDays.map((_, i) => <div key={`empty-${i}`} className="bg-white min-h-[80px]" />)}
                {days.map(day => {
                    const dayEvents = events.filter(e => isSameDay(new Date(e.start), day));
                    const isToday = isSameDay(day, new Date());
                    return (
                        <div key={day.toISOString()} className={`bg-white min-h-[80px] p-1 border-t transition-colors hover:bg-gray-50 flex flex-col ${isToday ? 'bg-blue-50/30' : ''}`}>
                            <div className={`text-right text-xs mb-1 font-medium ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>
                                {isToday ? <span className="bg-blue-600 text-white px-1.5 rounded-full">{day.getDate()}</span> : day.getDate()}
                            </div>
                            <div className="flex-1 overflow-y-auto max-h-[100px] no-scrollbar">
                                {dayEvents.map(ev => renderEventChip(ev, true))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderDayView = () => {
        const dayEvents = events.filter(e => isSameDay(new Date(e.start), currentDate));
        return (
            <div className="bg-white rounded-lg border border-gray-200 min-h-[400px] p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="text-blue-600 text-3xl">{currentDate.getDate()}</span>
                    <div className="flex flex-col leading-tight">
                        <span className="text-sm text-gray-500 uppercase">{currentDate.toLocaleDateString([], { weekday: 'long' })}</span>
                        <span className="text-xs text-gray-400">{currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}</span>
                    </div>
                </h3>
                <div className="space-y-2 relative">
                    {/* Simple time slots 8am - 8pm */}
                    {Array.from({ length: 13 }, (_, i) => i + 8).map(hour => (
                        <div key={hour} className="flex border-b border-gray-100 min-h-[60px] group">
                            <div className="w-16 text-right pr-4 text-xs text-gray-400 py-2 -mt-2 group-odd:bg-gray-50/50">
                                {hour}:00
                            </div>
                            <div className="flex-1 relative py-1">
                                {dayEvents.filter(e => new Date(e.start).getHours() === hour).map(ev => (
                                    <div key={ev.id} onClick={(e) => { e.stopPropagation(); handleEventClick(ev); }} className="absolute left-0 right-0 m-1 p-2 rounded bg-blue-100 border-l-4 border-blue-500 text-xs cursor-pointer hover:shadow-md transition-shadow z-10">
                                        <p className="font-bold text-blue-800 flex justify-between">
                                            <span>{ev.title}</span>
                                            <span>{formatTime(new Date(ev.start))} - {formatTime(new Date(ev.end))}</span>
                                        </p>
                                        <p className="text-blue-600 truncate">{ev.leadName}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderWeekView = () => {
        const days = getDaysInWeek(currentDate); // Using the imported util directly
        const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8am - 8pm

        return (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col min-w-[800px] overflow-x-auto">
                {/* Header Row */}
                <div className="flex border-b border-gray-200 bg-gray-50">
                    <div className="w-16 flex-shrink-0 border-r border-gray-200"></div>
                    {days.map(day => {
                        const isToday = isSameDay(day, new Date());
                        return (
                            <div key={day.toISOString()} className={`flex-1 p-2 text-center border-r border-gray-200 last:border-r-0 ${isToday ? 'bg-blue-50' : ''}`}>
                                <div className={`text-xs uppercase font-semibold ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                                    {day.toLocaleDateString([], { weekday: 'short' })}
                                </div>
                                <div className={`text-sm font-bold ${isToday ? 'text-blue-700' : 'text-gray-800'}`}>
                                    {day.getDate()}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto">
                    {hours.map(hour => (
                        <div key={hour} className="flex border-b border-gray-100 min-h-[60px]">
                            {/* Time Column */}
                            <div className="w-16 flex-shrink-0 text-right pr-2 text-xs text-gray-400 py-2 border-r border-gray-100">
                                {hour}:00
                            </div>

                            {/* Days Columns */}
                            {days.map(day => {
                                const dayEvents = events.filter(e => isSameDay(new Date(e.start), day));
                                const slotEvents = dayEvents.filter(e => new Date(e.start).getHours() === hour);

                                return (
                                    <div key={day.toISOString() + hour} className="flex-1 border-r border-gray-100 last:border-r-0 relative p-1 transition-colors hover:bg-gray-50/50">
                                        {slotEvents.map(ev => (
                                            <div
                                                key={ev.id}
                                                onClick={(e) => { e.stopPropagation(); handleEventClick(ev); }}
                                                className="mb-1 p-1 rounded bg-blue-100 border-l-2 border-blue-500 text-[10px] cursor-pointer hover:brightness-95 truncate shadow-sm"
                                                title={`${ev.title} (${formatTime(new Date(ev.start))} - ${formatTime(new Date(ev.end))})`}
                                            >
                                                <div className="font-bold text-blue-900 truncate">{ev.title}</div>
                                                <div className="text-blue-700 truncate text-[9px]">{formatTime(new Date(ev.start))}</div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white min-h-full pb-20">
            {/* Header */}
            <div className="sticky top-0 bg-white z-20 border-b border-gray-200 shadow-sm">
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-800 capitalize">
                            {view === 'month' && currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                            {view !== 'month' && "Calendario"}
                        </h2>
                    </div>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button onClick={() => setView('month')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${view === 'month' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Mes</button>
                        <button onClick={() => setView('week')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${view === 'week' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Semana</button>
                        <button onClick={() => setView('day')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${view === 'day' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Día</button>
                    </div>
                </div>

                <div className="px-4 pb-3 flex justify-between items-center">
                    <button onClick={handleToday} className="text-xs font-bold text-gray-500 hover:text-blue-600 border px-2 py-1 rounded">Hoy</button>
                    <div className="flex items-center gap-4">
                        <button onClick={handlePrev} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft size={20} /></button>
                        <span className="text-sm font-medium text-gray-600 capitalize">
                            {view === 'day' ? currentDate.toLocaleDateString([], { day: 'numeric', month: 'short' }) : ''}
                        </span>
                        <button onClick={handleNext} className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight size={20} /></button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 overflow-x-auto">
                {view === 'month' && renderMonthView()}
                {view === 'week' && renderWeekView()}
                {view === 'day' && renderDayView()}
            </div>

            <EventModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedEvent(null); }}
                onSave={handleUpdateEvent}
                onDelete={handleDeleteEvent}
                initialEvent={selectedEvent}
            />
        </div>
    );
};
