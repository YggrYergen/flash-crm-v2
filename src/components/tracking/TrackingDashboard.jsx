import React, { useMemo } from 'react';
import {
    CheckCircle, Clock, Calendar, AlertTriangle, Phone,
    Truck, Award, ChevronRight
} from 'lucide-react';
import { ProgressBar } from '../ui/ProgressBar';
import { EventModal } from '../calendar/EventModal';

export const TrackingDashboard = ({ leads, openDetail, setActiveTab, onUpdateLead }) => {

    const [selectedEvent, setSelectedEvent] = React.useState(null);
    const [isEventModalOpen, setIsEventModalOpen] = React.useState(false);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = useMemo(() => {
        // Gamification: Calls Today (based on lastCallAttemptAt)
        const contactedToday = leads.filter(l => {
            if (!l.lastCallAttemptAt) return false;
            const callDate = new Date(l.lastCallAttemptAt);
            callDate.setHours(0, 0, 0, 0);
            return callDate.getTime() === today.getTime();
        }).length;

        // Reminders & Events
        const now = Date.now();
        const pendingActions = [];

        leads.forEach(lead => {
            // Existing Reminders
            if (lead.reminders && Array.isArray(lead.reminders)) {
                lead.reminders.forEach(rem => {
                    if (!rem.completed && rem.dueAt) {
                        pendingActions.push({ ...rem, lead, type: 'reminder' });
                    }
                });
            }

            // New Calendar Events (Calls and Meetings)
            if (lead.events && Array.isArray(lead.events)) {
                lead.events.forEach(ev => {
                    // Include future events or past incomplete events (if we tracked completion, which we don't yet explicitly other than time, but let's show upcoming)
                    // Showing all upcoming events or past ones from today? 
                    // User said: "mostrar las llamadas agendadas, primero las más próximas, último las más lejanas"
                    // We should show everything not done? For now just time based.
                    if (ev.type === 'call' || ev.type === 'meeting') {
                        pendingActions.push({
                            id: ev.id,
                            dueAt: ev.start,
                            note: ev.title + (ev.notes ? ` - ${ev.notes}` : ''),
                            lead,
                            type: 'event'
                        });
                    }
                });
            }
        });

        // Sort: Overdue/Earliest first
        pendingActions.sort((a, b) => a.dueAt - b.dueAt);

        // Deliveries (Closed Clients) & Deadlines
        const pendingDeliveries = [];
        leads.forEach(l => {
            if ((l.status === 'cerrado' || l.paymentStatus === 'pagado') && l.delivery?.status !== 'delivered') {
                pendingDeliveries.push({ ...l, isEvent: false });
            }

            // Deadline events
            if (l.events) {
                l.events.filter(e => e.type === 'deadline').forEach(ev => {
                    pendingDeliveries.push({
                        id: ev.id,
                        name: l.name,
                        delivery: { status: 'scheduled', details: ev.title },
                        isEvent: true,
                        lead: l
                    });
                });
            }
        });

        return { contactedToday, pendingActions, pendingDeliveries };
    }, [leads]);

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
    };

    const getDueLabel = (timestamp) => {
        const diff = timestamp - Date.now();
        const minutes = Math.floor(diff / 60000);

        if (diff < 0) return <span className="text-red-600 font-bold">¡Vencido!</span>;
        if (minutes < 60) return <span className="text-orange-600 font-medium">En {minutes} min</span>;
        if (minutes < 1440) return <span className="text-blue-600">Hoy {formatTime(timestamp)}</span>;
        return <span className="text-gray-500">{formatDate(timestamp)}</span>;
    };

    const handleEventClick = (item, e) => {
        e.stopPropagation();
        setSelectedEvent({ ...item, leadId: item.lead.id, leadName: item.lead.name });
        setIsEventModalOpen(true);
    };

    const handleUpdateEvent = (updatedEvent) => {
        const lead = leads.find(l => l.id === updatedEvent.leadId);
        if (lead) {
            const currentEvents = lead.events || [];
            const newEvents = currentEvents.map(e => e.id === updatedEvent.id ? updatedEvent : e);
            onUpdateLead(lead.id, 'events', newEvents);
        }
        setIsEventModalOpen(false);
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
        setIsEventModalOpen(false);
    };

    const handleStatusUpdate = (lead, status) => {
        onUpdateLead(lead.id, 'delivery', { ...lead.delivery, status, updatedAt: Date.now() });
    };

    return (
        <div className="bg-gray-50 min-h-full pb-20">
            {/* Gamification Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-b-3xl shadow-lg mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Award className="text-yellow-300" /> Objetivo Diario
                        </h2>
                        <p className="text-indigo-100 text-sm opacity-90">¡Sigue empujando! 🚀</p>
                    </div>
                    <div className="text-right">
                        <span className="text-4xl font-bold">{stats.contactedToday}</span>
                        <span className="text-indigo-200 text-sm">/100</span>
                    </div>
                </div>
                <div className="w-full bg-black/20 rounded-full h-3">
                    <div
                        className="bg-yellow-400 h-3 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min((stats.contactedToday / 100) * 100, 100)}%` }}
                    />
                </div>
            </div>

            <div className="px-4 space-y-6">

                {/* Reminders / Calls Section */}
                <div>
                    <h3 className="text-gray-800 font-bold mb-3 flex items-center gap-2">
                        <Phone size={18} className="text-blue-600" /> Próximas Llamadas y Reuniones
                    </h3>

                    {stats.pendingActions.length === 0 ? (
                        <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
                            <CheckCircle className="mx-auto text-green-400 mb-2" size={32} />
                            <p className="text-gray-400 text-sm">¡Todo al día! No hay llamadas pendientes.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {stats.pendingActions.map((item, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center active:scale-95 transition-transform">
                                    <div className="flex-1" onClick={() => openDetail(item.lead)}>
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-gray-800">{item.lead.name}</h4>
                                            <span className="text-xs ml-2">{getDueLabel(item.dueAt)}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-1 mt-1">{item.note || "Sin nota"}</p>
                                    </div>
                                    <button onClick={(e) => handleEventClick(item, e)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                                        <Calendar size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Delivery Tracking */}
                <div>
                    <h3 className="text-gray-800 font-bold mb-3 flex items-center gap-2">
                        <Truck size={18} className="text-green-600" /> Entregas Pendientes
                    </h3>

                    {stats.pendingDeliveries.length === 0 ? (
                        <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
                            <p className="text-gray-400 text-sm">No hay entregas pendientes.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {stats.pendingDeliveries.map(item => {
                                const lead = item.isEvent ? item.lead : item;
                                return (
                                    <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-green-500 flex justify-between items-center">
                                        <div onClick={() => openDetail(lead)} className="flex-1">
                                            <h4 className="font-bold text-gray-800">{lead.name}</h4>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {item.isEvent ? `📅 ${item.delivery.details}` : (lead.delivery?.details || "Servicio pendiente")}
                                            </p>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-2">
                                            <span className={`text-xs px-2 py-1 rounded-full ${item.isEvent ? 'bg-purple-100 text-purple-700' : (lead.delivery?.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700')}`}>
                                                {item.isEvent ? 'Agendado' : (lead.delivery?.status === 'in_progress' ? 'En proceso' : 'Pendiente')}
                                            </span>
                                            {!item.isEvent && (
                                                <button
                                                    onClick={() => handleStatusUpdate(lead, 'delivered')}
                                                    className="text-[10px] text-green-600 font-bold border border-green-200 px-2 py-0.5 rounded italic"
                                                >
                                                    Marcar Entregado
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>

            <EventModal
                isOpen={isEventModalOpen}
                onClose={() => { setIsEventModalOpen(false); setSelectedEvent(null); }}
                onSave={handleUpdateEvent}
                onDelete={handleDeleteEvent}
                initialEvent={selectedEvent}
            />
        </div>
    );
};
