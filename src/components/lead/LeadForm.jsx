import React from 'react';
import { Trash2 } from 'lucide-react';

export const LeadForm = ({
    formData,
    setFormData,
    onSave,
    onCancel,
    onDelete,
    isNew,
    statusOptions
}) => {
    return (
        <div className="p-4 bg-white min-h-full">
            <div className="flex justify-between items-center mb-6">
                <button onClick={onCancel} className="text-gray-500">Cancelar</button>
                <h2 className="font-bold text-lg">{isNew ? 'Nuevo Lead' : 'Editar Lead'}</h2>
                <button onClick={onSave} className="text-blue-600 font-bold">Guardar</button>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Nombre</label>
                    <input
                        className="w-full p-3 bg-gray-50 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Nombre del cliente o negocio"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Estado</label>
                    <select
                        className="w-full p-3 bg-gray-50 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                        {statusOptions.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Teléfono</label>
                    <input
                        className="w-full p-3 bg-gray-50 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="+56 9..."
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Dirección</label>
                    <input
                        className="w-full p-3 bg-gray-50 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Dirección completa"
                        value={formData.full_address}
                        onChange={e => setFormData({ ...formData, full_address: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Empresa / Razón Social</label>
                    <input
                        className="w-full p-3 bg-gray-50 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Nombre de la empresa"
                        value={formData.company}
                        onChange={e => setFormData({ ...formData, company: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Email</label>
                    <input
                        className="w-full p-3 bg-gray-50 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="correo@ejemplo.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>

                {!isNew && (
                    <div className="pt-8 border-t mt-8">
                        <button
                            onClick={onDelete}
                            className="w-full flex items-center justify-center gap-2 p-3 text-red-600 bg-red-50 rounded-lg font-bold hover:bg-red-100 transition-colors"
                        >
                            <Trash2 size={18} /> Eliminar Lead
                        </button>
                        <p className="text-center text-xs text-gray-400 mt-2">Esta acción no se puede deshacer.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
