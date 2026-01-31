import React, { useState, useMemo } from 'react';
import {
    Clock, Calendar, Phone, UserPlus, Trash2, Edit3,
    RefreshCcw, BookOpen, ChevronDown, ChevronUp, User,
    FileText, Tag, CheckCircle2
} from 'lucide-react';
import { activityLogger } from '../../services/activityLogger';

export const BitacoraView = () => {
    const [viewMode, setViewMode] = useState('diario'); // diario, historico
    const [expandedLogs, setExpandedLogs] = useState(new Set());
    const [isAllDetailed, setIsAllDetailed] = useState(false);

    const logs = useMemo(() => {
        if (viewMode === 'diario') {
            return activityLogger.getDailyLogs();
        }
        return activityLogger.getLogs();
    }, [viewMode]);

    const toggleExpand = (id) => {
        const newExpanded = new Set(expandedLogs);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedLogs(newExpanded);
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'call': return <Phone size={14} className="text-green-600" />;
            case 'lead_created': return <UserPlus size={14} className="text-blue-600" />;
            case 'lead_deleted': return <Trash2 size={14} className="text-red-600" />;
            case 'status_change': return <RefreshCcw size={14} className="text-purple-600" />;
            case 'lead_updated': return <Edit3 size={14} className="text-amber-600" />;
            case 'import': return <CheckCircle2 size={14} className="text-indigo-600" />;
            default: return <FileText size={14} className="text-gray-600" />;
        }
    };

    const formatTime = (ts) => {
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (ts) => {
        return new Date(ts).toLocaleDateString([], { day: 'numeric', month: 'short' });
    };

    return (
        <div className="bg-gray-50 min-h-full pb-20">
            {/* Header section */}
            <div className="bg-white p-6 rounded-b-3xl shadow-sm border-b border-gray-100 mb-4 sticky top-0 z-10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <BookOpen className="text-amber-500" /> Bitácora
                    </h2>
                    <button
                        onClick={() => setIsAllDetailed(!isAllDetailed)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${isAllDetailed ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200'}`}
                    >
                        {isAllDetailed ? 'Vista Resumida' : 'Vista Detallada'}
                    </button>
                </div>

                <div className="flex bg-gray-100 rounded-xl p-1">
                    <button
                        onClick={() => setViewMode('diario')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${viewMode === 'diario' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-500'}`}
                    >
                        <Clock size={16} /> Diario
                    </button>
                    <button
                        onClick={() => setViewMode('historico')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${viewMode === 'historico' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-500'}`}
                    >
                        <Calendar size={16} /> Histórico
                    </button>
                </div>
            </div>

            <div className="px-4 space-y-3">
                {logs.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen size={24} className="text-gray-300" />
                        </div>
                        <p className="text-gray-400 font-medium">No hay registros de actividad aún.</p>
                    </div>
                ) : (
                    logs.map((log) => {
                        const isExpanded = isAllDetailed || expandedLogs.has(log.id);

                        return (
                            <div
                                key={log.id}
                                onClick={() => !isAllDetailed && toggleExpand(log.id)}
                                className={`bg-white rounded-2xl shadow-sm border border-gray-100 transition-all active:scale-[0.99] group ${isExpanded ? 'p-4' : 'px-4 py-3'}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`p-2 rounded-xl flex-shrink-0 ${isExpanded ? 'bg-gray-50' : ''}`}>
                                            {getTypeIcon(log.type)}
                                        </div>
                                        <div className="overflow-hidden">
                                            <h4 className={`font-bold text-gray-800 truncate ${isExpanded ? 'text-base' : 'text-sm'}`}>
                                                {log.entityName || 'Sistema'}
                                            </h4>
                                            {!isExpanded && (
                                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                                    {log.description} • {formatTime(log.timestamp)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {!isAllDetailed && (
                                        <div className="text-gray-300 group-hover:text-gray-400">
                                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </div>
                                    )}
                                </div>

                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-gray-50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                    <Tag size={10} /> Acción
                                                </p>
                                                <p className="text-sm text-gray-700 font-medium">{log.description}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                    <Clock size={10} /> Hora
                                                </p>
                                                <p className="text-sm text-gray-700 font-medium">{formatTime(log.timestamp)}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                <Calendar size={10} /> Fecha Completa
                                            </p>
                                            <p className="text-sm text-gray-700 font-medium">
                                                {new Date(log.timestamp).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>

                                        {log.entityId && (
                                            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <User size={12} className="text-gray-400" />
                                                        <span className="text-[10px] text-gray-500 font-mono">ID: {log.entityId}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
