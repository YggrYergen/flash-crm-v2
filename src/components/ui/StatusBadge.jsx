import React from 'react';

export const StatusBadge = ({ statusId, options }) => {
    const opt = options.find(o => o.id === statusId) || options[0];
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${opt.color}`}>
            {opt.label}
        </span>
    );
};
