import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Check, Trash2 } from 'lucide-react';
import { EVENT_TYPES } from '../../utils/helpers';

export const EventModal = ({ isOpen, onClose, onSave, onDelete, initialEvent = null }) => {
    const [eventData, setEventData] = useState({
        title: '',
        type: 'meeting',
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '11:00',
        allDay: false,
        notes: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (initialEvent) {
                const start = new Date(initialEvent.start);
                const end = new Date(initialEvent.end);

                setEventData({
                    id: initialEvent.id,
                    title: initialEvent.title,
                    type: initialEvent.type,
                    date: start.toISOString().split('T')[0],
                    startTime: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                    endTime: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                    allDay: initialEvent.allDay,
                    notes: initialEvent.notes || ''
                });
            } else {
                setEventData({
                    title: '',
                    type: 'meeting',
                    date: new Date().toISOString().split('T')[0],
                    startTime: '10:00',
                    endTime: '11:00',
                    allDay: false,
                    notes: ''
                });
            }
        }
    }, [isOpen, initialEvent]);

    const handleSave = () => {
        if (!eventData.title || !eventData.date) return;

        const startDateTime = new Date(`${eventData.date}T${eventData.startTime}`);
        const endDateTime = new Date(`${eventData.date}T${eventData.endTime}`);

        onSave({
            ...eventData,
            id: eventData.id || Date.now().toString(),
            start: startDateTime.getTime(),
            end: endDateTime.getTime(),
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-100 p-4 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        {initialEvent ? 'Editar Evento' : 'Nuevo Evento'}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Título</label>
                        <input
                            autoFocus
                            className="w-full p-2 bg-gray-50 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                            placeholder="Reunión con cliente..."
                            value={eventData.title}
                            onChange={e => setEventData({ ...eventData, title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Tipo</label>
                            <select
                                className="w-full p-2 bg-gray-50 rounded-lg border text-sm outline-none"
                                value={eventData.type}
                                onChange={e => setEventData({ ...eventData, type: e.target.value })}
                            >
                                {EVENT_TYPES.map(t => (
                                    <option key={t.id} value={t.id}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Fecha</label>
                            <input
                                type="date"
                                className="w-full p-2 bg-gray-50 rounded-lg border text-sm outline-none"
                                value={eventData.date}
                                onChange={e => setEventData({ ...eventData, date: e.target.value })}
                            />
                        </div>
                    </div>

                    {!eventData.allDay && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Inicio</label>
                                <input
                                    type="time"
                                    className="w-full p-2 bg-gray-50 rounded-lg border text-sm outline-none"
                                    value={eventData.startTime}
                                    onChange={e => setEventData({ ...eventData, startTime: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Fin</label>
                                <input
                                    type="time"
                                    className="w-full p-2 bg-gray-50 rounded-lg border text-sm outline-none"
                                    value={eventData.endTime}
                                    onChange={e => setEventData({ ...eventData, endTime: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="allDay"
                            className="rounded text-blue-600 focus:ring-blue-500"
                            checked={eventData.allDay}
                            onChange={e => setEventData({ ...eventData, allDay: e.target.checked })}
                        />
                        <label htmlFor="allDay" className="text-sm text-gray-600">Todo el día</label>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Notas</label>
                        <textarea
                            className="w-full p-2 bg-gray-50 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            rows="2"
                            placeholder="Detalles adicionales..."
                            value={eventData.notes}
                            onChange={e => setEventData({ ...eventData, notes: e.target.value })}
                        />
                    </div>
                </div>

                <div className="bg-gray-50 p-4 flex gap-3">
                    {initialEvent && (
                        <button
                            onClick={() => { if (window.confirm('¿Borrar evento?')) { onDelete(initialEvent.id); onClose(); } }}
                            className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={!eventData.title}
                        className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg shadow-lg active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100 flex justify-center items-center gap-2"
                    >
                        <Check size={18} /> Guardar Evento
                    </button>
                </div>
            </div>
        </div>
    );
};
