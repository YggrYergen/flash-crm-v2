
const STORAGE_KEY = 'flash_crm_activity_log';

export const activityLogger = {
    logAction: (type, description, entityId, entityName, metadata = {}) => {
        try {
            const logs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            const newLog = {
                id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                timestamp: Date.now(),
                type,        // 'call', 'event_created', 'lead_created', 'status_change', etc.
                description,
                entityId,    // ID of the lead or event
                entityName,  // Name of the lead
                metadata     // Any extra info
            };

            // Keep only last 1000 logs to prevent localStorage bloat
            const updatedLogs = [newLog, ...logs].slice(0, 1000);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
            return newLog;
        } catch (e) {
            console.error("Failed to log activity:", e);
        }
    },

    getLogs: () => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (e) {
            return [];
        }
    },

    getDailyLogs: () => {
        const now = Date.now();
        const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
        return activityLogger.getLogs().filter(log => log.timestamp > twentyFourHoursAgo);
    },

    clearLogs: () => {
        localStorage.removeItem(STORAGE_KEY);
    }
};
