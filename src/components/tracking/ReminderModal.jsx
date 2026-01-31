import React, { useState } from 'react';
import { X, Clock, Calendar, Bell } from 'lucide-react';

export const ReminderModal = ({ isOpen, onClose, onSave }) => {
    const [note, setNote] = useState('');
    const [customDate, setCustomDate] = useState('');
    const [customTime, setCustomTime] = useState('');

    if (!isOpen) return null;

    const handlePreset = (minutes) => {
        const dueAt = Date.now() + minutes * 60000;
        onSave({ dueAt, note, type: 'call' });
        resetAndClose();
    };

    const handleTomorrow = (hourStr = '10:00') => {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        const [h, m] = hourStr.split(':');
        date.setHours(parseInt(h), parseInt(m), 0, 0);
        onSave({ dueAt: date.getTime(), note, type: 'call' });
        resetAndClose();
    };

    const handleCustomSave = () => {
        if (!customDate || !customTime) return;
        const dueAt = new Date(`${customDate}T${customTime}`).getTime();
        onSave({ dueAt, note, type: 'call' });
        resetAndClose();
    };

    const resetAndClose = () => {
        setNote('');
        setCustomDate('');
        setCustomTime('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Bell className="text-blue-600" size={18} /> Programar Recordatorio
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <input
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Nota (ej. Llamar para cerrar venta)..."
                        className="w-full text-sm p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                    />

                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handlePreset(15)} className="p-2 border rounded-lg text-sm text-gray-600 hover:bg-blue-50 hover:border-blue-200 transition-colors flex items-center justify-center gap-1">
                            <Clock size={14} /> 15 min
                        </button>
                        <button onClick={() => handlePreset(60)} className="p-2 border rounded-lg text-sm text-gray-600 hover:bg-blue-50 hover:border-blue-200 transition-colors flex items-center justify-center gap-1">
                            <Clock size={14} /> 1 hora
                        </button>
                        <button onClick={() => handlePreset(180)} className="p-2 border rounded-lg text-sm text-gray-600 hover:bg-blue-50 hover:border-blue-200 transition-colors flex items-center justify-center gap-1">
                            <Clock size={14} /> Tarde (3h)
                        </button>
                        <button onClick={() => handleTomorrow()} className="p-2 border rounded-lg text-sm text-gray-600 hover:bg-blue-50 hover:border-blue-200 transition-colors flex items-center justify-center gap-1">
                            <Calendar size={14} /> Mañana
                        </button>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs font-bold text-gray-400 mb-2 uppercase">Personalizado</p>
                        <div className="flex gap-2">
                            <input type="date" className="flex-1 p-2 border rounded text-sm" onChange={e => setCustomDate(e.target.value)} />
                            <input type="time" className="w-24 p-2 border rounded text-sm" onChange={e => setCustomTime(e.target.value)} />
                        </div>
                        <button
                            disabled={!customDate || !customTime}
                            onClick={handleCustomSave}
                            className="w-full mt-3 bg-gray-900 text-white py-2 rounded-lg text-sm disabled:opacity-50 font-medium"
                        >
                            Guardar Personalizado
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
