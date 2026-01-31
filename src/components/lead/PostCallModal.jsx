import React from 'react';
import { PhoneOff, Trash2, MessageSquare, CheckCircle, X } from 'lucide-react';

export const PostCallModal = ({ isOpen, onClose, onAction }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex justify-between items-center">
                    <h3 className="font-bold text-lg">Fin de la llamada</h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full"><X size={20} /></button>
                </div>

                <div className="p-4 space-y-3">
                    <p className="text-gray-500 text-sm text-center mb-2">¿Cómo te fue con el cliente?</p>

                    <button
                        onClick={() => onAction('no_answer')}
                        className="w-full flex items-center gap-3 p-3 bg-yellow-50 text-yellow-700 rounded-xl border border-yellow-100 font-bold hover:bg-yellow-100 transition-colors"
                    >
                        <div className="bg-yellow-200 p-2 rounded-full"><PhoneOff size={18} /></div>
                        No contestó / Ocupado
                    </button>

                    <button
                        onClick={() => onAction('wrong_number')}
                        className="w-full flex items-center gap-3 p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 font-bold hover:bg-red-100 transition-colors"
                    >
                        <div className="bg-red-200 p-2 rounded-full"><Trash2 size={18} /></div>
                        Número equivocado / Borrar
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => onAction('contacted')}
                            className="flex flex-col items-center gap-1 p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 font-bold hover:bg-blue-100 transition-colors"
                        >
                            <div className="bg-blue-200 p-2 rounded-full"><MessageSquare size={18} /></div>
                            <span className="text-xs">Contactado</span>
                        </button>
                        <button
                            onClick={() => onAction('meeting')}
                            className="flex flex-col items-center gap-1 p-3 bg-green-50 text-green-700 rounded-xl border border-green-100 font-bold hover:bg-green-100 transition-colors"
                        >
                            <div className="bg-green-200 p-2 rounded-full"><CheckCircle size={18} /></div>
                            <span className="text-xs">Reunión</span>
                        </button>
                    </div>

                    <button onClick={onClose} className="w-full py-2 text-gray-400 text-sm font-medium mt-2">
                        Descartar
                    </button>
                </div>
            </div>
        </div>
    );
};
