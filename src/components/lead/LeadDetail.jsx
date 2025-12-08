import React, { useState, useRef } from 'react';
import {
    ChevronRight, Search, MapPin, Globe, Phone, MessageCircle, Mail,
    Target, Layout, Award, X, Edit3, Calendar, Save
} from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';
import { ProgressBar } from '../ui/ProgressBar';
import { NoteItem } from './NoteItem';
import { PostCallModal } from './PostCallModal';
import { ReminderModal } from '../tracking/ReminderModal';
import { QUICK_NOTES } from '../../utils/helpers';
import { Truck, Bell } from 'lucide-react';

export const LeadDetail = ({
    lead,
    setActiveTab,
    statusOptions,
    paymentStatusOptions,
    onUpdate,
    onAddNote,
    onDelete
}) => {
    const [isStatusEditing, setIsStatusEditing] = useState(false);
    const [currentNote, setCurrentNote] = useState('');
    const [showPostCall, setShowPostCall] = useState(false);
    const [showReminder, setShowReminder] = useState(false);
    const pressTimer = useRef(null);

    const handlePressStart = () => {
        if (isStatusEditing) return;
        pressTimer.current = setTimeout(() => {
            setIsStatusEditing(true);
            if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);
        }, 3000);
    };

    const handlePressEnd = () => {
        if (pressTimer.current) clearTimeout(pressTimer.current);
    };

    const handleNoteSubmit = () => {
        if (!currentNote.trim()) return;
        onAddNote(currentNote);
        setCurrentNote('');
    };

    const handleCall = (e) => {
        e.preventDefault();
        window.location.href = `tel:${lead.phone}`;
        setTimeout(() => {
            setShowPostCall(true);
        }, 1000);
    };

    const handlePostCallAction = (action) => {
        setShowPostCall(false);
        switch (action) {
            case 'no_answer':
                onAddNote('No contestó / Ocupado');
                break;
            case 'wrong_number':
                setTimeout(() => {
                    if (window.confirm("¿Confirmas borrar este lead por número erróneo?")) {
                        onDelete();
                    }
                }, 300);
                break;
            case 'contacted':
                onUpdate('status', 'contactado');
                onUpdate('lastContactedAt', Date.now());
                break;
            case 'meeting':
                onUpdate('status', 'reunion');
                break;
        }
    };

    const handleReminderSave = (reminder) => {
        const currentReminders = lead.reminders || [];
        onUpdate('reminders', [...currentReminders, { ...reminder, id: Date.now(), completed: false }]);
        onAddNote(`⏰ Recordatorio: ${reminder.note} (${new Date(reminder.dueAt).toLocaleString()})`);
    };

    const handleDeliveryUpdate = (status, details = '') => {
        onUpdate('delivery', {
            ...lead.delivery,
            status,
            details: details || lead.delivery?.details,
            updatedAt: Date.now()
        });
    };

    return (
        <div className="bg-white min-h-full pb-10">
            <PostCallModal
                isOpen={showPostCall}
                onClose={() => setShowPostCall(false)}
                onAction={handlePostCallAction}
            />

            <ReminderModal
                isOpen={showReminder}
                onClose={() => setShowReminder(false)}
                onSave={handleReminderSave}
            />

            <div className="sticky top-0 bg-white z-10 border-b border-gray-100 p-4 flex justify-between items-center shadow-sm">
                <button onClick={() => setActiveTab('list')} className="p-2 -ml-2 text-gray-600">
                    <ChevronRight className="rotate-180" />
                </button>
                <div className="flex-1 truncate px-2 text-center">
                    <span className="font-bold text-gray-800 block truncate leading-tight">{lead.name}</span>
                    <span className="text-xs text-gray-400 font-mono block">{lead.phone || 'Sin Teléfono'}</span>
                </div>
                <button onClick={() => setActiveTab('form')} className="text-blue-600 text-sm font-medium">Editar</button>
            </div>

            <div className="bg-gray-800 text-white p-3 flex gap-3 justify-around">
                <a href={`https://www.google.com/search?q=${encodeURIComponent(lead.name)}`} target="_blank" className="flex flex-col items-center gap-1"><Search size={18} /> <span className="text-[10px]">Google</span></a>
                <a href={lead.place_link || '#'} target="_blank" className="flex flex-col items-center gap-1"><MapPin size={18} /> <span className="text-[10px]">Maps</span></a>
                <a href={lead.website || '#'} target="_blank" className="flex flex-col items-center gap-1"><Globe size={18} /> <span className="text-[10px]">Web</span></a>
            </div>

            <div className="grid grid-cols-4 gap-2 p-4 border-b border-gray-100 bg-gray-50">
                <button onClick={handleCall} className="flex flex-col items-center gap-1 p-2 rounded-lg text-green-600 bg-green-50"><Phone size={20} /> <span className="text-[10px] font-bold">Llamar</span></button>
                <a href={`https://wa.me/${lead.phone?.replace(/[^0-9]/g, '')}`} target="_blank" className="flex flex-col items-center gap-1 p-2 rounded-lg text-green-600 bg-green-50"><MessageCircle size={20} /> <span className="text-[10px] font-bold">WhatsApp</span></a>
                <a href={`mailto:${lead.email}`} className="flex flex-col items-center gap-1 p-2 rounded-lg text-blue-600 bg-blue-50"><Mail size={20} /> <span className="text-[10px] font-bold">Email</span></a>
                <button onClick={() => setShowReminder(true)} className="flex flex-col items-center gap-1 p-2 rounded-lg text-orange-600 bg-orange-50"><Bell size={20} /> <span className="text-[10px] font-bold">Recordar</span></button>
            </div>

            <div className="p-4 space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2"><Target size={14} className="text-blue-600" /> Análisis</h4>
                    <ProgressBar label="Web" score={lead.webScore || 0} colorClass="bg-blue-500" icon={Layout} />
                    <ProgressBar label="Maps" score={lead.gbpScore || 0} colorClass="bg-green-500" icon={MapPin} />
                    <ProgressBar label="SERCOTEC" score={lead.sercotecScore || 0} colorClass="bg-purple-500" icon={Award} />
                </div>

                <div
                    className={`bg-white rounded-lg border border-gray-100 p-4 shadow-sm transition-all relative overflow-hidden ${isStatusEditing ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                    onMouseDown={handlePressStart} onMouseUp={handlePressEnd} onMouseLeave={handlePressEnd} onTouchStart={handlePressStart} onTouchEnd={handlePressEnd}
                >
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Estado {isStatusEditing ? ' (EDITANDO)' : ''}</h4>
                        {isStatusEditing && <button onClick={(e) => { e.stopPropagation(); setIsStatusEditing(false); }} className="text-xs bg-gray-200 px-2 py-1 rounded"><X size={12} /> Cerrar</button>}
                    </div>
                    {isStatusEditing ? (
                        <div className="space-y-4 animate-in fade-in">
                            <div className="flex flex-wrap gap-2">{statusOptions.map(opt => <button key={opt.id} onClick={() => onUpdate('status', opt.id)} className={`px-3 py-2 rounded-lg text-xs font-medium border ${lead.status === opt.id ? 'bg-blue-100 border-blue-400' : 'bg-white'}`}>{opt.label}</button>)}</div>
                            <div className="flex flex-wrap gap-2">{paymentStatusOptions.map(opt => <button key={opt.id} onClick={() => onUpdate('paymentStatus', opt.id)} className={`px-3 py-2 rounded-lg text-xs font-medium border ${lead.paymentStatus === opt.id ? 'bg-blue-100 border-blue-400' : 'bg-white'}`}>{opt.label}</button>)}</div>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-wrap gap-2 pointer-events-none"><StatusBadge statusId={lead.status} options={statusOptions} /><StatusBadge statusId={lead.paymentStatus} options={paymentStatusOptions} /></div>
                            <div className="w-full text-[10px] text-gray-300 italic mt-2 text-right flex justify-end items-center gap-1"><Edit3 size={10} /> Mantén 3s para editar</div>
                        </>
                    )}
                </div>

                {(lead.status === 'cerrado' || lead.paymentStatus === 'pagado') && (
                    <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Truck size={14} className="text-green-600" /> Entrega de Servicio
                        </h4>
                        <div className="flex flex-col gap-3">
                            <input
                                value={lead.delivery?.details || ''}
                                onChange={(e) => handleDeliveryUpdate(lead.delivery?.status || 'pending', e.target.value)}
                                placeholder="Detalles de entrega..."
                                className="text-sm p-2 border rounded bg-gray-50"
                            />
                            <div className="flex gap-2">
                                {['pending', 'in_progress', 'delivered'].map(st => (
                                    <button
                                        key={st}
                                        onClick={() => handleDeliveryUpdate(st)}
                                        className={`flex-1 py-2 text-xs rounded-lg border ${lead.delivery?.status === st ? 'bg-green-100 border-green-500 text-green-800 font-bold' : 'bg-white text-gray-500'}`}
                                    >
                                        {st === 'pending' && 'Pendiente'}
                                        {st === 'in_progress' && 'En Curso'}
                                        {st === 'delivered' && 'Entregado'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="pb-20">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider flex items-center gap-2"><Calendar size={14} /> Bitácora</h4>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 mb-6 sticky top-16 z-0">
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mb-2">{QUICK_NOTES.map((note, i) => <button key={i} onClick={() => setCurrentNote(note)} className="whitespace-nowrap px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600">{note}</button>)}</div>
                        <div className="flex gap-2">
                            <input value={currentNote} onChange={(e) => setCurrentNote(e.target.value)} placeholder="Nota rápida..." className="flex-1 bg-white border border-gray-300 text-sm rounded-lg px-3 py-2 outline-none" />
                            <button onClick={handleNoteSubmit} disabled={!currentNote.trim()} className="bg-blue-600 text-white p-2 rounded-lg disabled:opacity-50"><Save size={18} /></button>
                        </div>
                    </div>
                    <div className="space-y-1">
                        {lead.notes?.map((note, idx) => <NoteItem key={idx} note={note} />)}
                    </div>
                </div>
            </div>
        </div>
    );
};
