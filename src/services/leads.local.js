
const LOCAL_STORAGE_KEY = 'flashcrm_leads';

const getLocalLeads = () => {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
};

const saveLocalLeads = (leads) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(leads));
};

export const localLeadsService = {
    getLeads: () => getLocalLeads(),

    saveAll: (leads) => saveLocalLeads(leads),

    addLead: (lead) => {
        const leads = getLocalLeads();
        const newLeads = [...leads, lead];
        saveLocalLeads(newLeads);
        return newLeads;
    },

    updateLead: (leadId, updates) => {
        const leads = getLocalLeads();
        const newLeads = leads.map(l => l.id === leadId ? { ...l, ...updates, updatedAt: Date.now() } : l);
        saveLocalLeads(newLeads);
        return newLeads;
    },

    deleteLead: (leadId) => {
        const leads = getLocalLeads();
        const newLeads = leads.filter(l => l.id !== leadId);
        saveLocalLeads(newLeads);
        return newLeads;
    },

    // Soft delete for consistency with Cloud logic if needed
    softDeleteLead: (leadId) => {
        return localLeadsService.updateLead(leadId, { deletedAt: Date.now() });
    },

    restoreLead: (leadId) => {
        return localLeadsService.updateLead(leadId, { deletedAt: null });
    },

    clearAll: () => {
        saveLocalLeads([]);
        return [];
    }
};
