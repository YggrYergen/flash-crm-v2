import React from 'react';

export const ProgressBar = ({ label, score, colorClass, icon: Icon }) => (
    <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                {Icon && <Icon size={12} className="text-gray-400" />} {label}
            </span>
            <span className={`text-xs font-bold ${score > 70 ? 'text-green-600' : 'text-gray-400'}`}>{score}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
            <div
                className={`h-2 rounded-full transition-all duration-1000 ${colorClass}`}
                style={{ width: `${score}%` }}
            ></div>
        </div>
    </div>
);
