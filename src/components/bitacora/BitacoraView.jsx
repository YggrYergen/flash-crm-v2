import React, { useState, useMemo } from 'react';
import {
    Clock, Calendar, Phone, UserPlus, Trash2, Edit3,
    RefreshCcw, BookOpen, ChevronDown, ChevronUp, User,
    FileText, Tag, CheckCircle2, MessageSquare, Zap
} from 'lucide-react';
import { activityLogger } from '../../services/activityLogger';

export const BitacoraView = () => {
    const [viewMode, setViewMode] = useState('diario'); // diario, historico
    const [expandedGroups, setExpandedGroups] = useState(new Set());
    const [isAllDetailed, setIsAllDetailed] = useState(false);

    const logs = useMemo(() => {
        if (viewMode === 'diario') {
            return activityLogger.getDailyLogs();
        }
        return activityLogger.getLogs();
    }, [viewMode]);

    const groupedLogs = useMemo(() => {
        const groups = [];
        let currentGroup = null;

        logs.forEach((log) => {
            if (currentGroup && log.entityId && log.entityId === currentGroup.entityId) {
                currentGroup.items.push(log);
            } else {
                if (currentGroup) {
                    groups.push(currentGroup);
                }
                currentGroup = {
                    id: `group_${log.id}`,
                    entityId: log.entityId,
                    entityName: log.entityName,
                    timestamp: log.timestamp,
                    items: [log],
                    type: log.entityId ? 'client_activity' : 'system'
                };
            }
        });
        if (currentGroup) {
            groups.push(currentGroup);
        }
        return groups;
    }, [logs]);

    const toggleExpand = (groupId) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupId)) newExpanded.delete(groupId);
        else newExpanded.add(groupId);
        setExpandedGroups(newExpanded);
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'call': return <Phone size={14} className="text-green-600" />;
            case 'lead_created': return <UserPlus size={14} className="text-blue-600" />;
            case 'lead_deleted': return <Trash2 size={14} className="text-red-600" />;
            case 'status_change': return <RefreshCcw size={14} className="text-purple-600" />;
            case 'lead_updated': return <Edit3 size={14} className="text-amber-600" />;
            case 'note_added': return <MessageSquare size={14} className="text-pink-600" />;
            case 'import': return <Zap size={14} className="text-yellow-600" />;
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
                        {isAllDetailed ? 'Expandir Todo' : 'Vista Compacta'}
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

            <div className="px-4 space-y-4">
                {groupedLogs.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen size={24} className="text-gray-300" />
                        </div>
                        <p className="text-gray-400 font-medium">No hay registros de actividad aún.</p>
                    </div>
                ) : (
                    groupedLogs.map((group) => {
                        const isExpanded = isAllDetailed || expandedGroups.has(group.id);
                        const isMultiItem = group.items.length > 1;

                        return (
                            <div
                                key={group.id}
                                className={`bg-white rounded-2xl shadow-sm border border-gray-100 transition-all overflow-hidden ${isMultiItem ? 'p-0' : 'p-0'}`}
                            >
                                {/* Header of the Card */}
                                <div
                                    className={`flex items-center justify-between p-4 ${isMultiItem ? 'bg-gray-50/50 border-b border-gray-100' : ''} cursor-pointer`}
                                    onClick={() => toggleExpand(group.id)}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        {!isMultiItem && (
                                            <div className="p-2 bg-gray-50 rounded-xl flex-shrink-0">
                                                {getTypeIcon(group.items[0].type)}
                                            </div>
                                        )}
                                        {isMultiItem && (
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl flex-shrink-0">
                                                <User size={14} />
                                            </div>
                                        )}

                                        <div className="overflow-hidden">
                                            <h4 className="font-bold text-gray-800 truncate text-sm">
                                                {group.entityName || 'Sistema'}
                                            </h4>
                                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                                {isMultiItem
                                                    ? `${group.items.length} acciones recientes • ${formatTime(group.timestamp)}`
                                                    : `${formatTime(group.items[0].timestamp)}`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    {isMultiItem && (
                                        <div className="text-gray-300">
                                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </div>
                                    )}
                                </div>

                                {/* Body of the Card */}
                                <div className={`p-4 pt-2 ${!isExpanded && isMultiItem ? 'hidden' : 'block'}`}>
                                    <div className="relative pl-2  space-y-6">
                                        {/* Vertical Timeline Line */}
                                        {isMultiItem && (
                                            <div className="absolute left-[19px] top-2 bottom-4 w-[1px] bg-gray-100"></div>
                                        )}

                                        {group.items.map((log, idx) => (
                                            <div key={log.id} className="relative z-10 group">
                                                <div className="flex gap-3">
                                                    {isMultiItem && (
                                                        <div className="mt-1 relative flex-shrink-0">
                                                            <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm z-20 relative">
                                                                {getTypeIcon(log.type)}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className={`flex-1 ${!isMultiItem ? '' : 'pt-1'}`}>
                                                        <div className="flex justify-between items-start mb-1">
                                                            {!isMultiItem && (
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                                                                    {getTypeIcon(log.type)} {formatTime(log.timestamp)}
                                                                </span>
                                                            )}
                                                            {isMultiItem && (
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                                    {formatTime(log.timestamp)}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* The Content / Comment */}
                                                        <div className="text-sm text-gray-600 leading-relaxed font-medium bg-gray-50 p-2.5 rounded-lg border border-gray-100/50">
                                                            {log.description}
                                                        </div>

                                                        {(isAllDetailed || expandedGroups.has(group.id)) && log.metadata && Object.keys(log.metadata).length > 0 && (
                                                            <div className="mt-2 text-[10px] text-gray-400 font-mono pl-1">
                                                                {JSON.stringify(log.metadata)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

