import React from 'react';
import { Download, Trash2, RefreshCw, AlertTriangle, Archive, RotateCcw } from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';

export const DataSettings = ({ leads, setLeads, saveLeads, showToast }) => {
    const [deletedLeads, setDeletedLeads] = React.useState([]);
    const [leadToRestore, setLeadToRestore] = React.useState(null);
    const [leadToPermDelete, setLeadToPermDelete] = React.useState(null);

    React.useEffect(() => {
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

    const handleRestore = () => {
        if (!leadToRestore) return;
        const updated = leads.map(l => l.id === leadToRestore.id ? { ...l, deletedAt: null } : l);
        saveLeads(updated);
        setLeadToRestore(null);
        showToast("Lead restaurado ♻️");
    };

    const handlePermDelete = () => {
        if (!leadToPermDelete) return;
        const updated = leads.filter(l => l.id !== leadToPermDelete.id);
        saveLeads(updated);
        setLeadToPermDelete(null);
        showToast("Lead eliminado permanentemente 🗑️");
    };

    const handleEmptyTrash = () => {
        if (!confirm("¿Eliminar DEFINITIVAMENTE todos los elementos de la papelera?")) return;
        const updated = leads.filter(l => !l.deletedAt);
        saveLeads(updated);
        showToast("Papelera vaciada");
    };

    const handleRestoreBackup = () => {
        const backup = localStorage.getItem('flashcrm_backup_last');
        if (!backup) return showToast("No hay copias de seguridad disponibles");

        if (confirm("⚠️ ¿Restaurar la última copia de seguridad automática? Esto sobrescribirá los datos actuales.")) {
            try {
                const parsed = JSON.parse(backup);
                saveLeads(parsed);
                showToast("Sistema restaurado ✅");
            } catch (e) {
                showToast("Error al restaurar copia");
            }
        }
    };

    return (
        <div className="bg-gray-50 min-h-full pb-20">
            <ConfirmModal
                isOpen={!!leadToPermDelete}
                onClose={() => setLeadToPermDelete(null)}
                onConfirm={handlePermDelete}
                title="¿Eliminar Permanentemente?"
                message="Esta acción no se puede deshacer."
            />

            <div className="bg-white px-4 py-3 shadow-sm border-b border-gray-100 sticky top-0 z-10">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Archive className="text-blue-600" size={20} /> Gestión de Datos</h2>
            </div>

            <div className="p-4 space-y-6">
                {/* Export Section */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2"><Download size={18} /> Exportar Datos</h3>
                    <p className="text-xs text-gray-500 mb-4">Descarga todos tus leads activos, notas y estados en formato CSV compatible con Excel.</p>
                    <button onClick={handleExport} className="w-full bg-blue-50 text-blue-600 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors">
                        <Download size={18} /> Descargar CSV ({activeLeads.length})
                    </button>
                </div>

                {/* Recycle Bin */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2"><Trash2 size={18} /> Papelera ({deletedLeads.length})</h3>
                        {deletedLeads.length > 0 && <button onClick={handleEmptyTrash} className="text-xs text-red-500 font-bold hover:underline">Vaciar</button>}
                    </div>

                    {deletedLeads.length === 0 ? (
                        <div className="text-center py-6 text-gray-400 text-xs italic bg-gray-50 rounded-lg">Papelera vacía</div>
                    ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {deletedLeads.map(l => (
                                <div key={l.id} className="flex justify-between items-center p-3 bg-red-50 border border-red-100 rounded-lg">
                                    <div>
                                        <div className="font-bold text-sm text-gray-800">{l.name}</div>
                                        <div className="text-[10px] text-gray-500">Eliminado: {new Date(l.deletedAt).toLocaleDateString()}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setLeadToRestore(l)} className="p-2 bg-white text-green-600 rounded shadow-sm border border-green-200"><RotateCcw size={14} /></button>
                                        <button onClick={() => setLeadToPermDelete(l)} className="p-2 bg-white text-red-600 rounded shadow-sm border border-red-200"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {leadToRestore && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm">
                                <h3 className="font-bold text-lg mb-2">¿Restaurar Lead?</h3>
                                <p className="text-gray-600 mb-4">"{leadToRestore.name}" volverá a tu lista principal.</p>
                                <div className="flex gap-2">
                                    <button onClick={() => setLeadToRestore(null)} className="flex-1 py-2 bg-gray-100 rounded-lg">Cancelar</button>
                                    <button onClick={handleRestore} className="flex-1 py-2 bg-green-600 text-white font-bold rounded-lg">Restaurar</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Disaster Recovery */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 border-l-4 border-l-orange-400">
                    <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2"><AlertTriangle size={18} className="text-orange-500" /> Zona de Rescate</h3>
                    <p className="text-xs text-gray-500 mb-4">Si borraste todo por error, puedes intentar recuperar el último punto de restauración automático.</p>
                    <button onClick={handleRestoreBackup} className="w-full bg-orange-50 text-orange-700 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-orange-100 transition-colors">
                        <RefreshCw size={18} /> Restaurar Copia de Seguridad
                    </button>
                </div>
            </div>
        </div>
    );
};
