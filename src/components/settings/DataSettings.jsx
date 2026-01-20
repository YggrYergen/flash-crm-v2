
import React, { useState, useEffect } from 'react';
import { Download, Trash2, RefreshCw, AlertTriangle, Archive, RotateCcw, Cloud, ShieldAlert, Database, Info } from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useLeads } from '../../context/LeadsContext';

export const DataSettings = ({ showToast }) => {
    const {
        leads,
        mode,
        isSyncing,
        restoreLead,
        deleteLead,
        uploadLocalToCloud,
        connectToCloud,
        disconnectFromCloud,
        nukeCloud,
        clearAllLocal
    } = useLeads();

    const [deletedLeads, setDeletedLeads] = useState([]);
    const [leadToRestore, setLeadToRestore] = useState(null);
    const [leadToPermDelete, setLeadToPermDelete] = useState(null);
    const [showNukeConfirm, setShowNukeConfirm] = useState(false);
    const [showClearLocalConfirm, setShowClearLocalConfirm] = useState(false);

    useEffect(() => {
        setDeletedLeads(leads.filter(l => l.deletedAt));
    }, [leads]);

    const activeLeads = leads.filter(l => !l.deletedAt);

    const handleExport = () => {
        if (activeLeads.length === 0) return showToast("No hay leads activos para exportar");

        const headers = ["ID", "Nombre", "Teléfono", "Email", "Empresa", "Estado", "Estado Pago", "Detalles Entrega", "Notas", "Creado", "Actualizado"];
        const csvContent = [
            headers.join(","),
            ...activeLeads.map(l => [
                l.id,
                `"${l.name || ''}"`,
                `"${l.phone || ''}"`,
                `"${l.email || ''}"`,
                `"${l.company || ''}"`,
                l.status,
                l.paymentStatus,
                `"${l.delivery?.status || ''} - ${l.delivery?.details || ''}"`,
                `"${(l.notes || []).map(n => n.content).join(' | ')}"`,
                new Date(l.createdAt).toLocaleString(),
                new Date(l.updatedAt).toLocaleString()
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `flashcrm_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Exportación exitosa 📥");
    };

    const handleRestoreConfirm = async () => {
        if (leadToRestore) {
            await restoreLead(leadToRestore.id);
            setLeadToRestore(null);
            showToast("Lead restaurado");
        }
    };

    const handlePermDeleteConfirm = async () => {
        if (leadToPermDelete) {
            await deleteLead(leadToPermDelete.id, true);
            setLeadToPermDelete(null);
            showToast("Lead eliminado permanentemente");
        }
    };

    const handleUploadLocal = async () => {
        if (confirm("Se subirán todos tus datos locales a la nube. Si ya hay datos en la nube, se fusionarán por ID.")) {
            try {
                await uploadLocalToCloud();
                showToast("¡Datos subidos y sincronizados! ☁️");
            } catch (e) {
                showToast("Error al subir datos");
            }
        }
    };

    const handleDisconnect = () => {
        if (confirm("Dejarás de sincronizar con la nube. Se guardará una copia de los datos actuales en este dispositivo.")) {
            disconnectFromCloud();
            showToast("Modo Local activado");
        }
    };

    const handleNukeCloud = async () => {
        try {
            await nukeCloud();
            setShowNukeConfirm(false);
            showToast("Base de datos en la nube eliminada");
        } catch (e) {
            showToast("Error al eliminar datos");
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-24">
            <ConfirmModal
                isOpen={!!leadToPermDelete}
                onClose={() => setLeadToPermDelete(null)}
                onConfirm={handlePermDeleteConfirm}
                title="¿Eliminar Permanentemente?"
                message="Esta acción no se puede deshacer."
            />

            <ConfirmModal
                isOpen={showNukeConfirm}
                onClose={() => setShowNukeConfirm(false)}
                onConfirm={handleNukeCloud}
                title="⚠️ ELIMINAR NUBE"
                message="¿Estás COMPLETAMENTE seguro? Esto borrará la base de datos para TODOS los usuarios. (Se recomienda exportar primero)."
            />

            <ConfirmModal
                isOpen={showClearLocalConfirm}
                onClose={() => setShowClearLocalConfirm(false)}
                onConfirm={() => { clearAllLocal(); setShowClearLocalConfirm(false); showToast("Datos locales borrados"); }}
                title="Borrar Datos Locales"
                message="¿Borrar todos los datos guardados en este dispositivo?"
            />

            <div className="bg-white px-4 py-3 shadow-sm border-b border-gray-100 sticky top-0 z-10 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Archive className="text-blue-600" size={20} /> Gestión de Datos
                </h2>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${mode === 'cloud' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    Modo: {mode}
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Cloud Status / Controls */}
                <div className={`rounded-2xl p-6 shadow-sm border transition-all ${mode === 'cloud' ? 'bg-green-50 border-green-100' : 'bg-blue-50 border-blue-100'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className={`font-bold flex items-center gap-2 ${mode === 'cloud' ? 'text-green-800' : 'text-blue-800'}`}>
                                {mode === 'cloud' ? <RefreshCw className="animate-spin-slow" size={20} /> : <Database size={20} />}
                                {mode === 'cloud' ? 'Sincronizado con la Nube' : 'Modo Local (Offline)'}
                            </h3>
                            <p className={`text-xs mt-1 ${mode === 'cloud' ? 'text-green-600' : 'text-blue-600'}`}>
                                {mode === 'cloud'
                                    ? 'Tus cambios se guardan instantáneamente en Firebase.'
                                    : 'Los datos solo se guardan en este navegador/teléfono.'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {mode === 'local' ? (
                            <>
                                <button
                                    onClick={handleUploadLocal}
                                    disabled={isSyncing}
                                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 shadow-md shadow-blue-200 disabled:opacity-50"
                                >
                                    <Cloud size={18} /> {isSyncing ? 'Subiendo...' : 'Subir Base a la Nube'}
                                </button>
                                <button
                                    onClick={() => connectToCloud()}
                                    className="w-full bg-white text-blue-600 border border-blue-200 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-all"
                                >
                                    <RefreshCw size={18} /> Conectar a Base Existente
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleDisconnect}
                                className="w-full bg-white text-gray-700 border border-gray-200 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
                            >
                                <ShieldAlert size={18} /> Dejar de Seguir Nube
                            </button>
                        )}
                    </div>
                </div>

                {/* Export Section */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Download size={18} /> Copia de Seguridad</h3>
                    <p className="text-xs text-gray-500 mb-4">Descarga un archivo CSV con toda la información actual.</p>
                    <button onClick={handleExport} className="w-full bg-gray-50 text-gray-700 py-3 border border-gray-100 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-all">
                        <Download size={18} /> Exportar CSV ({activeLeads.length})
                    </button>
                </div>

                {/* Recycle Bin */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><Trash2 size={18} /> Papelera ({deletedLeads.length})</h3>
                        {deletedLeads.length > 0 && (
                            <button
                                onClick={() => { if (confirm("¿Vaciar papelera?")) deletedLeads.forEach(l => deleteLead(l.id, true)) }}
                                className="text-xs text-red-500 font-bold hover:underline"
                            >
                                Vaciar
                            </button>
                        )}
                    </div>

                    {deletedLeads.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-xs italic bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            No hay leads eliminados
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {deletedLeads.map(l => (
                                <div key={l.id} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100 rounded-xl">
                                    <div className="min-w-0">
                                        <div className="font-bold text-sm text-gray-800 truncate">{l.name}</div>
                                        <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                            <RotateCcw size={10} /> {new Date(l.deletedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button onClick={() => setLeadToRestore(l)} className="p-2 bg-white text-green-600 rounded-lg shadow-sm border border-green-100 hover:bg-green-50"><RotateCcw size={14} /></button>
                                        <button onClick={() => setLeadToPermDelete(l)} className="p-2 bg-white text-red-500 rounded-lg shadow-sm border border-red-100 hover:bg-red-50"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Danger Zone */}
                <div className="pt-4">
                    <div className="p-6 bg-red-50 border border-red-100 rounded-2xl">
                        <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2"><AlertTriangle size={18} /> Zona de Peligro</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => setShowClearLocalConfirm(true)}
                                className="w-full py-3 text-red-600 bg-white border border-red-200 rounded-xl text-xs font-bold hover:bg-red-50 transition-all"
                            >
                                Borrar Datos Locales de este Equipo
                            </button>
                            {mode === 'cloud' && (
                                <button
                                    onClick={() => setShowNukeConfirm(true)}
                                    className="w-full py-3 text-white bg-red-600 rounded-xl text-xs font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95"
                                >
                                    Eliminar Base de Datos en la Nube
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {leadToRestore && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in duration-200">
                        <h3 className="font-bold text-xl mb-2">Restaurar Lead</h3>
                        <p className="text-gray-600 mb-6 text-sm">¿Deseas restaurar a <b>{leadToRestore.name}</b>? Aparecerá nuevamente en tu panel principal.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setLeadToRestore(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl active:scale-95 transition-all">Cancelar</button>
                            <button onClick={handleRestoreConfirm} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200 active:scale-95 transition-all">Restaurar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
