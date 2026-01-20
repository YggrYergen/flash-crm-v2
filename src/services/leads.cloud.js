
import { db } from '../firebase';
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    writeBatch,
    getDocs,
    query,
    where
} from 'firebase/firestore';

const LEADS_COLLECTION = 'leads';

export const cloudLeadsService = {
    addLead: async (lead) => {
        await setDoc(doc(db, LEADS_COLLECTION, lead.id), lead);
    },

    updateLead: async (leadId, updates) => {
        const leadRef = doc(db, LEADS_COLLECTION, leadId);
        await updateDoc(leadRef, { ...updates, updatedAt: Date.now() });
    },

    softDeleteLead: async (leadId) => {
        const leadRef = doc(db, LEADS_COLLECTION, leadId);
        await updateDoc(leadRef, { deletedAt: Date.now() });
    },

    restoreLead: async (leadId) => {
        const leadRef = doc(db, LEADS_COLLECTION, leadId);
        await updateDoc(leadRef, { deletedAt: null });
    },

    hardDeleteLead: async (leadId) => {
        await deleteDoc(doc(db, LEADS_COLLECTION, leadId));
    },

    batchUpload: async (leads, onProgress) => {
        const batchSize = 400;
        for (let i = 0; i < leads.length; i += batchSize) {
            const batch = writeBatch(db);
            const chunk = leads.slice(i, i + batchSize);
            chunk.forEach(lead => {
                const ref = doc(db, LEADS_COLLECTION, lead.id);
                batch.set(ref, lead, { merge: true });
            });
            await batch.commit();
            if (onProgress) onProgress(Math.min(i + batchSize, leads.length));
        }
    },

    nukeCollection: async () => {
        const snapshot = await getDocs(collection(db, LEADS_COLLECTION));
        const batch = writeBatch(db);
        snapshot.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
    }
};
