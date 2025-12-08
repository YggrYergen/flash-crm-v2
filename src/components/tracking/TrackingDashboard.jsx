import React, { useMemo } from 'react';
import {
    CheckCircle, Clock, Calendar, AlertTriangle, Phone,
    Truck, Award, ChevronRight
} from 'lucide-react';
import { ProgressBar } from '../ui/ProgressBar';

export const TrackingDashboard = ({ leads, openDetail, setActiveTab }) => {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = useMemo(() => {
        // Gamification: Contacted Today
        const contactedToday = leads.filter(l => {
            if (!l.lastContactedAt) return false;
            const contactDate = new Date(l.lastContactedAt);
            contactDate.setHours(0, 0, 0, 0);
            return contactDate.getTime() === today.getTime();
        }).length;

        // Reminders
        const now = Date.now();
        const pendingReminders = [];

        leads.forEach(lead => {
            if (lead.reminders && Array.isArray(lead.reminders)) {
                lead.reminders.forEach(rem => {
                    if (!rem.completed && rem.dueAt) {
                        pendingReminders.push({ ...rem, lead });
                    }
                });
            }
        });

        // Sort reminders: Overdue first, then by urgency
        pendingReminders.sort((a, b) => a.dueAt - b.dueAt);

        // Deliveries (Closed Clients)
        const pendingDeliveries = leads.filter(l =>
            (l.status === 'cerrado' || l.paymentStatus === 'pagado') &&
            l.delivery?.status !== 'delivered'
        );

        return { contactedToday, pendingReminders, pendingDeliveries };
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
                        <Phone size={18} className="text-blue-600" /> Por Llamar
                    </h3>

                    {stats.pendingReminders.length === 0 ? (
                        <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
                            <CheckCircle className="mx-auto text-green-400 mb-2" size={32} />
                            <p className="text-gray-400 text-sm">¡Todo al día! No hay llamadas pendientes.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {stats.pendingReminders.map((item, idx) => (
                                <div key={idx} onClick={() => openDetail(item.lead)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center active:scale-95 transition-transform">
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-gray-800">{item.lead.name}</h4>
                                            <span className="text-xs ml-2">{getDueLabel(item.dueAt)}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-1 mt-1">{item.note || "Sin nota"}</p>
                                    </div>
                                    <ChevronRight className="text-gray-300 ml-2" size={16} />
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
                            {stats.pendingDeliveries.map(lead => (
                                <div key={lead.id} onClick={() => openDetail(lead)} className="bg-white p-4 rounded-xl shadow-sm border border-l-4 border-l-green-500 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-gray-800">{lead.name}</h4>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {lead.delivery?.details || "Servicio pendiente"}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xs px-2 py-1 rounded-full ${lead.delivery?.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {lead.delivery?.status === 'in_progress' ? 'En proceso' : 'Pendiente'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
