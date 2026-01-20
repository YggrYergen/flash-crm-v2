import React, { useState } from 'react';
import { TrendingUp, Users, Target, Award, Database, BarChart2, Clock, MoreVertical, Trash2, Check, X } from 'lucide-react';
import { StatusBadge } from '../ui/StatusBadge';

export const LeadList = ({
    stats,
    filteredLeads,
    openDetail,
    setFilterStatus,
    statusOptions,
    paymentStatusOptions,
    onQuickUpdate,
    onDelete
}) => {
    const [openMenuId, setOpenMenuId] = useState(null);

    const handleMenuClick = (e, id) => {
        e.stopPropagation();
        setOpenMenuId(openMenuId === id ? null : id);
    };

    const handleAction = (e, action, lead) => {
        e.stopPropagation();
        setOpenMenuId(null);
        if (action === 'delete') {
            onDelete(lead); // Confirmation handled by App via Modal
        } else if (action === 'contacted') {
            onQuickUpdate(lead, 'status', 'contactado');
        }
    };

    return (
        <div className="p-4 space-y-3 pb-20" onClick={() => setOpenMenuId(null)}>
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 text-white shadow-lg mb-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp size={14} className="text-blue-400" /> Resumen
                    </h2>
                    <div className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-300">
                        {filteredLeads.length !== stats.total ? `Viendo ${filteredLeads.length} de ${stats.total}` : `Total: ${stats.total}`}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/10 rounded-lg p-3 relative overflow-hidden cursor-pointer" onClick={() => setFilterStatus('lead')}>
                        <div className="absolute top-0 right-0 p-1 opacity-20"><Users size={40} /></div>
                        <div className="text-2xl font-bold text-blue-400">{stats.newLeads}</div>
                        <div className="text-xs text-gray-300">Por Contactar</div>
                        <div className="text-[10px] text-orange-400 mt-1 flex items-center gap-1"><Target size={10} /> {stats.highFit} Hot</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 relative overflow-hidden cursor-pointer" onClick={() => setFilterStatus('cerrado')}>
                        <div className="absolute top-0 right-0 p-1 opacity-20"><Award size={40} /></div>
                        <div className="text-2xl font-bold text-green-400">{stats.closed}</div>
                        <div className="text-xs text-gray-300">Clientes Activos</div>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/5 rounded-lg p-2 text-center cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setFilterStatus('contactado')}>
                        <div className="text-lg font-bold text-purple-400">{stats.following || 0}</div>
                        <div className="text-[10px] text-gray-400">Contactados</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setFilterStatus('reunion')}>
                        <div className="text-lg font-bold text-yellow-400">{stats.meeting || 0}</div>
                        <div className="text-[10px] text-gray-400">Reunión</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2 text-center cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setFilterStatus('negociacion')}>
                        <div className="text-lg font-bold text-orange-400">{stats.negotiating || 0}</div>
                        <div className="text-[10px] text-gray-400">Negociación</div>
                    </div>
                </div>
            </div>

            {filteredLeads.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                    <Database size={48} className="mx-auto mb-2 opacity-20" />
                    <p>Sin datos.</p>
                </div>
            ) : (
                filteredLeads.map(lead => (
                    <div key={lead.id} onClick={() => openDetail(lead)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer relative overflow-visible">
                        {(lead.webScore > 80 || lead.gbpScore > 80 || lead.sercotecScore > 80) && lead.status === 'lead' && (
                            <div className="absolute top-0 right-10 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-b-lg font-bold">Oportunidad Alta</div>
                        )}

                        {/* Quick Actions Menu - Enhanced Visibility */}
                        <div className="absolute top-3 right-2 z-10">
                            <button onClick={(e) => handleMenuClick(e, lead.id)} className="p-3 -mt-2 -mr-2 text-gray-500 hover:text-gray-800 bg-white/50 backdrop-blur-sm rounded-full shadow-sm hover:bg-white active:bg-gray-100 transition-all">
                                <MoreVertical size={20} strokeWidth={2.5} />
                            </button>
                            {openMenuId === lead.id && (
                                <div className="absolute right-0 top-6 bg-white rounded-xl shadow-xl border border-gray-100 py-1 text-sm w-40 animate-in fade-in zoom-in-95 z-50">
                                    <div onClick={(e) => handleAction(e, 'contacted', lead)} className="px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-blue-600 font-medium border-b border-gray-50">
                                        <Check size={14} /> Marcar Contactado
                                    </div>
                                    <div onClick={(e) => handleAction(e, 'delete', lead)} className="px-4 py-3 hover:bg-red-50 flex items-center gap-2 text-red-600 font-medium">
                                        <Trash2 size={14} /> Eliminar
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-start mb-2 pr-6">
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg leading-tight truncate max-w-[200px]">{lead.name}</h3>
                                {lead.company && <p className="text-gray-500 text-sm font-medium truncate max-w-[200px]">{lead.company}</p>}
                            </div>
                            <StatusBadge statusId={lead.status} options={statusOptions} />
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                            <div className="flex gap-2"><StatusBadge statusId={lead.paymentStatus} options={paymentStatusOptions} /></div>
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                                {lead.fitnessScore > 50 ? <BarChart2 size={12} className="text-indigo-400" /> : <Clock size={12} />} Score: {lead.fitnessScore}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};
