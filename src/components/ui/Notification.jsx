import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

export const Notification = ({ message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl z-[110] flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <CheckCircle size={18} className="text-green-400" />
            <span className="text-sm font-medium">{message}</span>
        </div>
    );
};
