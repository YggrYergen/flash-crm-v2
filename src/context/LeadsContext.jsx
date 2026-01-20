
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { localLeadsService } from '../services/leads.local';
import { cloudLeadsService } from '../services/leads.cloud';

const LeadsContext = createContext();

export const useLeads = () => {
    const context = useContext(LeadsContext);
    if (!context) throw new Error('useLeads must be used within a LeadsProvider');
    return context;
};

export const LeadsProvider = ({ children }) => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState(localStorage.getItem('flash_mode') || 'local'); // 'local' or 'cloud'
    const [isSyncing, setIsSyncing] = useState(false);

    // Sync state with storage/Firestore
    useEffect(() => {
        localStorage.setItem('flash_mode', mode);

        if (mode === 'local') {
            const localData = localLeadsService.getLeads();
            setLeads(localData);
            setLoading(false);
        } else {
            setLoading(true);
            const q = collection(db, "leads");
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const cloudData = snapshot.docs.map(doc => doc.data());
                setLeads(cloudData);
                setLoading(false);
            }, (error) => {
                console.error("Firestore Sync Error:", error);
                setLoading(false);
            });
            return () => unsubscribe();
        }
    }, [mode]);

    const addLeads = useCallback(async (newLeads) => {
        if (mode === 'local') {
            const updated = localLeadsService.addLeads(newLeads);
            setLeads(updated);
        } else {
            await cloudLeadsService.batchUpload(newLeads);
        }
    }, [mode]);

    const addLead = useCallback(async (lead) => {
        if (mode === 'local') {
            const updated = localLeadsService.addLead(lead);
            setLeads(updated);
        } else {
            await cloudLeadsService.addLead(lead);
        }
    }, [mode]);

    const updateLead = useCallback(async (leadId, updates) => {
        if (mode === 'local') {
            const updated = localLeadsService.updateLead(leadId, updates);
            setLeads(updated);
        } else {
            await cloudLeadsService.updateLead(leadId, updates);
        }
    }, [mode]);

    const deleteLead = useCallback(async (leadId, permanent = false) => {
        if (mode === 'local') {
            const updated = permanent
                ? localLeadsService.deleteLead(leadId)
                : localLeadsService.softDeleteLead(leadId);
            setLeads(updated);
        } else {
            if (permanent) {
                await cloudLeadsService.hardDeleteLead(leadId);
            } else {
                await cloudLeadsService.softDeleteLead(leadId);
            }
        }
    }, [mode]);

    const restoreLead = useCallback(async (leadId) => {
        if (mode === 'local') {
            const updated = localLeadsService.restoreLead(leadId);
            setLeads(updated);
        } else {
            await cloudLeadsService.restoreLead(leadId);
        }
    }, [mode]);

    const uploadLocalToCloud = async () => {
        setIsSyncing(true);
        try {
            const localData = localLeadsService.getLeads();
            await cloudLeadsService.batchUpload(localData);
            setMode('cloud');
            return true;
        } catch (e) {
            console.error(e);
            throw e;
        } finally {
            setIsSyncing(false);
        }
    };

    const connectToCloud = () => {
        setMode('cloud');
    };

    const disconnectFromCloud = () => {
        localLeadsService.saveAll(leads);
        setMode('local');
    };

    const nukeCloud = async () => {
        if (mode !== 'cloud') return;
        await cloudLeadsService.nukeCollection();
    };

    const clearAllLocal = () => {
        const updated = localLeadsService.clearAll();
        if (mode === 'local') setLeads(updated);
    };

    return (
        <LeadsContext.Provider value={{
            leads,
            loading,
            mode,
            isSyncing,
            addLead,
            addLeads,
            updateLead,
            deleteLead,
            restoreLead,
            uploadLocalToCloud,
            connectToCloud,
            disconnectFromCloud,
            nukeCloud,
            clearAllLocal,
            setMode
        }}>
            {children}
        </LeadsContext.Provider>
    );
};
