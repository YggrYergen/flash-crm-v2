import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-red-700 flex items-center gap-2">
                        <AlertTriangle size={20} /> {title || 'Confirmar Acción'}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-red-100 rounded-full text-red-400"><X size={20} /></button>
                </div>

                <div className="p-6">
                    <p className="text-gray-600 text-center mb-6">{message || '¿Estás seguro de continuar?'}</p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-colors"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
