import React, { useState, useRef, useEffect } from 'react';
import {
    MoreVertical, Target, Layout, Calendar, Settings,
    BookOpen, X, ChevronRight, BarChart2
} from 'lucide-react';

export const NavMenu = ({ activeTab, onTabChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const menuItems = [
        { id: 'tracking', label: 'Objetivos', icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { id: 'list', label: 'Dashboard', icon: Layout, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'calendar', label: 'Calendario', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
        { id: 'bitacora', label: 'Bitácora', icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'settings', label: 'Configuración', icon: Settings, color: 'text-gray-600', bg: 'bg-gray-50' },
    ];

    const handleItemClick = (id) => {
        onTabChange(id);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-full transition-all duration-300 ${isOpen ? 'bg-gray-800 text-white rotate-90' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
                <MoreVertical size={20} />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop for mobile */}
                    <div className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[1px]" onClick={() => setIsOpen(false)} />

                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
                        <div className="px-4 py-2 border-b border-gray-50 mb-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Navegación</p>
                        </div>

                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleItemClick(item.id)}
                                    className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${isActive ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isActive ? item.bg : 'bg-gray-50'} ${item.color}`}>
                                            <Icon size={18} />
                                        </div>
                                        <span className={`text-sm font-semibold ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                                            {item.label}
                                        </span>
                                    </div>
                                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shadow-sm shadow-blue-200" />}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};
