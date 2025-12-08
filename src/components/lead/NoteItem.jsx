import React from 'react';
import { MessageCircle } from 'lucide-react';

export const NoteItem = ({ note }) => (
    <div className="flex gap-3 mb-4 animate-in fade-in slide-in-from-bottom-2">
        <div className="min-w-[40px] flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <MessageCircle size={14} />
            </div>
            <div className="h-full w-0.5 bg-gray-100 mt-1"></div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex-1">
            <p className="text-gray-800 text-sm whitespace-pre-wrap">{note.content}</p>
            <p className="text-xs text-gray-400 mt-2 text-right">
                {note.timestamp ? new Date(note.timestamp).toLocaleString('es-CL', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                }) : 'Reciente'}
            </p>
        </div>
    </div>
);
