import React from 'react';
import { X, Calendar, Clock, User, AlignLeft, Edit3, Trash2, ChevronRight } from 'lucide-react';
import { EVENT_TYPES } from '../../utils/helpers';
import { formatTime } from '../../utils/dateUtils';

export const EventDetailModal = ({ isOpen, onClose, event, onEdit, onDelete }) => {
    if (!isOpen || !event) return null;

    const type = EVENT_TYPES.find(t => t.id === event.type) || EVENT_TYPES[3];
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
                {/* Header with color stripe */}
                <div className={`h-2 w-full ${type.color.split(' ')[0]}`} />

                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${type.color}`}>
                                {type.label}
                            </span>
                            <h3 className="text-xl font-bold text-gray-900 mt-2 leading-tight">
                                {event.title}
                            </h3>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-5">
                        {/* Client Info */}
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <User size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cliente</p>
                                <p className="text-gray-800 font-semibold">{event.leadName || "Sin asignar"}</p>
                            </div>
                        </div>

                        {/* Date & Time */}
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <Calendar size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cuándo</p>
                                <p className="text-gray-800">
                                    {startDate.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
                                </p>
                                <div className="flex items-center gap-1 text-gray-500 text-sm mt-0.5">
                                    <Clock size={12} />
                                    <span>{formatTime(startDate)} - {formatTime(endDate)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Notes/Details */}
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-gray-50 text-gray-600 rounded-lg">
                                <AlignLeft size={18} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Detalles y Notas</p>
                                <div className="mt-1 p-3 bg-gray-50 rounded-xl border border-gray-100 min-h-[60px]">
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                        {event.notes || "Sin notas adicionales."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 mt-8">
                        <button
                            onClick={() => onDelete(event.id)}
                            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-red-100 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors"
                        >
                            <Trash2 size={18} /> Eliminar
                        </button>
                        <button
                            onClick={onEdit}
                            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
                        >
                            <Edit3 size={18} /> Editar Evento
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
