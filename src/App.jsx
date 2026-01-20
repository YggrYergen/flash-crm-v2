import React, { useState, useMemo, useRef, useLayoutEffect } from 'react';
import {
  Plus, Search, Layout, Database, ArrowRight, Upload, User, Target, Trash2, Settings, Calendar as CalendarIcon, Cloud
} from 'lucide-react';
import { STATUS_OPTIONS, PAYMENT_STATUS, parseCSVLine, calculateCompositeScore } from './utils/helpers';
import { Notification } from './components/ui/Notification';
import { LeadList } from './components/lead/LeadList';
import { LeadDetail } from './components/lead/LeadDetail';
import { LeadForm } from './components/lead/LeadForm';
import { TrackingDashboard } from './components/tracking/TrackingDashboard';
import { DataSettings } from './components/settings/DataSettings';
import { CalendarView } from './components/calendar/CalendarView';
import { ConfirmModal } from './components/ui/ConfirmModal';
import { useLeads } from './context/LeadsContext';

export default function App() {
  const {
    leads,
    loading,
    addLead,
    addLeads,
    updateLead,
    deleteLead,
    clearAllLocal,
    mode
  } = useLeads();

  const [notification, setNotification] = useState(null);

  // UI State
  const [activeTab, setActiveTab] = useState('list');
  const [selectedLead, setSelectedLead] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [skippedLeadIds, setSkippedLeadIds] = useState([]);

  // Delete Modal State
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [formData, setFormData] = useState({
    name: '', company: '', phone: '', email: '',
    status: 'lead', paymentStatus: 'na', interests: [], serviceDetails: '',
    value: '', website: '', full_address: '', place_link: '',
    fitnessScore: 50, webScore: 0, gbpScore: 0, sercotecScore: 0
  });

  const fileInputRef = useRef(null);
  const mainRef = useRef(null);
  const scrollPositionRef = useRef(0);

  const handleTabChange = (tab) => {
    if (activeTab === 'list' && mainRef.current) {
      scrollPositionRef.current = mainRef.current.scrollTop;
    }
    setActiveTab(tab);
  };

  // Restore scroll when entering 'list' tab
  useLayoutEffect(() => {
    if (activeTab === 'list' && mainRef.current) {
      const timeoutId = setTimeout(() => {
        if (mainRef.current) {
          mainRef.current.scrollTop = scrollPositionRef.current;
        }
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [activeTab]);

  const showToast = (msg) => setNotification(msg);

  // --- ACTIONS ---
  const handleLeadUpdate = async (leadId, fieldOrUpdates, value) => {
    const updatesObj = (typeof fieldOrUpdates === 'string') ? { [fieldOrUpdates]: value } : fieldOrUpdates;
    try {
      await updateLead(leadId, updatesObj);
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({ ...selectedLead, ...updatesObj, updatedAt: Date.now() });
      }
    } catch (e) {
      showToast("Error al guardar cambios");
    }
  };

  const handleQuickUpdate = (fieldOrObj, value) => {
    if (!selectedLead) return;
    handleLeadUpdate(selectedLead.id, fieldOrObj, value);
    if (typeof fieldOrObj === 'string' && fieldOrObj === 'status') showToast("Estado actualizado");
  };

  const handleQuickUpdateByObj = (lead, field, value) => {
    handleLeadUpdate(lead.id, field, value);
    showToast("Estado actualizado");
  };

  const handleDeleteByObj = (lead) => {
    setLeadToDelete(lead);
  };

  const confirmDelete = async () => {
    if (!leadToDelete) return;
    try {
      await deleteLead(leadToDelete.id);
      if (selectedLead && selectedLead.id === leadToDelete.id) {
        setSelectedLead(null);
        handleTabChange('list');
      }
      setLeadToDelete(null);
      showToast("Lead movido a papelera 🗑️");
    } catch (e) {
      showToast("Error al eliminar");
    }
  };

  // --- CSV IMPORT ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split('\n');

      const newLeads = [];
      let skippedInvalid = 0;

      let startIndex = 0;
      const firstLine = lines[0] ? lines[0].trim().toLowerCase() : '';
      if (firstLine.includes('business_id') || firstLine.includes('phone') || firstLine.includes('name')) {
        startIndex = 1;
      }

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = parseCSVLine(line);
        if (cols.length < 3) continue;

        let phone = cols[1] || '';
        const cleanPhone = phone.replace(/[^0-9+]/g, '');
        const isValidPhone = /^(?:\+?56)?9\d{8}$/.test(cleanPhone);

        if (!isValidPhone) {
          skippedInvalid++;
          continue;
        }

        const rawData = {
          business_id: cols[0], phone_number: cleanPhone, name: cols[2], full_address: cols[3],
          review_count: cols[6], rating: cols[7], website: cols[9], place_link: cols[11],
          is_claimed: cols[14], verified: cols[15],
        };

        const scores = calculateCompositeScore(rawData);

        newLeads.push({
          id: 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          name: rawData.name || 'Sin Nombre',
          phone: rawData.phone_number || '',
          company: rawData.name,
          email: '',
          full_address: rawData.full_address || '',
          website: rawData.website || '',
          place_link: rawData.place_link || '',
          status: 'lead',
          paymentStatus: 'na',
          interests: [],
          fitnessScore: scores.generalScore,
          webScore: scores.webScore,
          gbpScore: scores.gbpScore,
          sercotecScore: scores.sercotecScore,
          source: 'import_csv',
          notes: [],
          searchStr: (rawData.name + ' ' + rawData.full_address).toLowerCase(),
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }

      try {
        await addLeads(newLeads);
        showToast(`¡${newLeads.length} detectados y subidos! (${skippedInvalid} omitidos)`);
      } catch (e) {
        showToast("Error al importar");
      }

      setImporting(false);
      setShowImport(false);
      setIsFabOpen(false);
    };

    reader.readAsText(file);
  };

  const handleNextBestLead = () => {
    const isDetailView = activeTab === 'detail';
    const currentId = isDetailView ? selectedLead?.id : null;

    if (currentId) {
      setSkippedLeadIds(prev => [...prev, currentId]);
    }

    const pendingLeads = leads
      .filter(l => !l.deletedAt && l.status === 'lead' && l.id !== currentId && !skippedLeadIds.includes(l.id))
      .sort((a, b) => (b.fitnessScore || 0) - (a.fitnessScore || 0));

    if (pendingLeads.length > 0) {
      openDetail(pendingLeads[0]);
      setIsFabOpen(false);
    } else {
      const allPending = leads.filter(l => l.status === 'lead' && l.id !== currentId);
      if (allPending.length > 0 && pendingLeads.length === 0) {
        showToast("Has revisado todos los candidatos. Reiniciando ciclo...");
        setSkippedLeadIds([]);
        openDetail(allPending[0]);
      } else {
        showToast("¡Buen trabajo! No hay más leads pendientes.");
      }
      setIsFabOpen(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name) return showToast("Falta el nombre");

    const payload = {
      ...formData,
      updatedAt: Date.now(),
      searchStr: (formData.name + ' ' + (formData.company || '')).toLowerCase()
    };

    try {
      if (selectedLead) {
        await updateLead(selectedLead.id, payload);
        setSelectedLead({ ...selectedLead, ...payload });
        showToast("Guardado");
      } else {
        const newId = 'lead_' + Date.now();
        const newLead = {
          id: newId,
          ...payload,
          fitnessScore: payload.fitnessScore || 50,
          createdAt: Date.now(),
          notes: []
        };
        await addLead(newLead);
        showToast("Creado");
      }
      handleTabChange('list');
      resetForm();
    } catch (e) {
      showToast("Error al guardar");
    }
  };

  const handleClearAll = () => {
    setShowClearConfirm(true);
    setIsFabOpen(false);
  };

  const confirmClearAll = async () => {
    if (confirm("¿Estás seguro de que quieres BORRAR TODO?")) {
      try {
        if (mode === 'local') {
          clearAllLocal();
          showToast("Base de datos local vaciada");
        } else {
          showToast("Usa la pestaña Configuración para vaciar la nube");
        }
      } catch (e) {
        showToast("Error al vaciar BD");
      }
    }
    setShowClearConfirm(false);
  };

  const handleDelete = () => {
    if (selectedLead) setLeadToDelete(selectedLead);
  };

  const handleAddNote = async (noteContent) => {
    if (!selectedLead) return;
    const newNote = { content: noteContent, timestamp: Date.now(), id: Math.random().toString(36).substr(2, 9) };
    const updatedNotes = [newNote, ...(selectedLead.notes || [])];
    try {
      await updateLead(selectedLead.id, { notes: updatedNotes });
      setSelectedLead({ ...selectedLead, notes: updatedNotes, updatedAt: Date.now() });
    } catch (e) {
      showToast("Error al guardar nota");
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', company: '', phone: '', email: '', status: 'lead', paymentStatus: 'na', interests: [],
      serviceDetails: '', value: '', website: '', full_address: '', place_link: '',
      fitnessScore: 50, webScore: 0, gbpScore: 0, sercotecScore: 0
    });
    setSelectedLead(null);
  };

  const openNew = () => { resetForm(); handleTabChange('form'); setIsFabOpen(false); };
  const openDetail = (lead) => { setSelectedLead(lead); setFormData(lead); handleTabChange('detail'); };

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      if (l.deletedAt) return false;
      const matchesSearch = (l.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.company || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'todos' || l.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [leads, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const total = leads.length;
    const newLeads = leads.filter(l => l.status === 'lead').length;
    const following = leads.filter(l => l.status === 'contactado').length;
    const meeting = leads.filter(l => l.status === 'reunion').length;
    const negotiating = leads.filter(l => l.status === 'negociacion').length;
    const closed = leads.filter(l => l.status === 'cerrado').length;
    const pendingPayment = leads.filter(l => ['pendiente', 'parcial'].includes(l.paymentStatus)).length;
    const highFit = leads.filter(l => l.status === 'lead' && (l.fitnessScore || 0) > 75).length;
    return { total, newLeads, following, meeting, negotiating, closed, pendingPayment, highFit };
  }, [leads]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500">Cargando...</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative select-none">
      {notification && <Notification message={notification} onClose={() => setNotification(null)} />}
      <ConfirmModal
        isOpen={!!leadToDelete}
        onClose={() => setLeadToDelete(null)}
        onConfirm={confirmDelete}
        message={`¿Estás seguro de eliminar a ${leadToDelete?.name}?`}
      />

      <header className="bg-white px-4 py-3 shadow-sm z-10 flex-none">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            Flash CRM <span className="text-xs bg-gray-100 text-gray-500 px-1 rounded">v2.1</span>
            {mode === 'cloud' && <Cloud size={14} className="text-blue-500 animate-pulse" />}
          </h1>
          <div className="flex gap-2">
            <button
              className={`p-2 rounded-full ${activeTab === 'tracking' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}
              onClick={() => handleTabChange('tracking')}
            >
              <Target size={18} />
            </button>
            <button className={`p-2 rounded-full ${activeTab === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`} onClick={() => handleTabChange('list')}>
              <Layout size={18} />
            </button>
            <button
              onClick={() => handleTabChange('calendar')}
              className={`p-2 rounded-full ${activeTab === 'calendar' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}
            >
              <CalendarIcon size={18} />
            </button>
            <button className={`p-2 rounded-full ${activeTab === 'settings' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`} onClick={() => handleTabChange('settings')}>
              <Settings size={18} />
            </button>
          </div>
        </div>
        {activeTab === 'list' && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar cliente..."
                className="w-full bg-gray-100 pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button onClick={() => setFilterStatus('todos')} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border ${filterStatus === 'todos' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-200 text-gray-600'}`}>Todos</button>
              {STATUS_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => setFilterStatus(opt.id)} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border ${filterStatus === opt.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-600'}`}>{opt.label}</button>
              ))}
            </div>
          </div>
        )}
      </header>

      <main ref={mainRef} className="flex-1 overflow-y-auto pb-20 relative">
        {activeTab === 'list' && (
          <LeadList
            stats={stats}
            filteredLeads={filteredLeads}
            openDetail={openDetail}
            setFilterStatus={setFilterStatus}
            statusOptions={STATUS_OPTIONS}
            paymentStatusOptions={PAYMENT_STATUS}
            onQuickUpdate={handleQuickUpdateByObj}
            onDelete={handleDeleteByObj}
          />
        )}

        {activeTab === 'tracking' && (
          <TrackingDashboard
            leads={leads}
            openDetail={openDetail}
            setActiveTab={handleTabChange}
          />
        )}

        {activeTab === 'settings' && (
          <DataSettings
            showToast={showToast}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            leads={leads}
            onUpdateLead={handleLeadUpdate}
            navigateToLead={(lead) => {
              openDetail(lead);
            }}
          />
        )}

        {activeTab === 'detail' && selectedLead && (
          <LeadDetail
            lead={selectedLead}
            setActiveTab={handleTabChange}
            statusOptions={STATUS_OPTIONS}
            paymentStatusOptions={PAYMENT_STATUS}
            onUpdate={handleQuickUpdate}
            onAddNote={handleAddNote}
            onDelete={handleDelete}
          />
        )}

        {activeTab === 'form' && (
          <LeadForm
            formData={formData}
            setFormData={setFormData}
            onSave={handleSave}
            onCancel={() => selectedLead ? handleTabChange('detail') : handleTabChange('list')}
            onDelete={handleDelete}
            isNew={!selectedLead}
            statusOptions={STATUS_OPTIONS}
          />
        )}
      </main>

      {/* FAB and Modals */}
      {activeTab === 'list' && (
        <>
          {isFabOpen && <div className="absolute inset-0 bg-white/80 z-20 backdrop-blur-sm" onClick={() => setIsFabOpen(false)} />}
          <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 z-30">
            {isFabOpen && (
              <>
                <button onClick={handleClearAll} className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full shadow-lg border border-red-200"><span className="text-xs font-bold">BORRAR TODO</span><div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center"><Trash2 size={16} /></div></button>
                <button onClick={() => setShowImport(true)} className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-full shadow-lg border border-gray-100"><span className="text-xs">Importar CSV</span><div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center"><Database size={16} /></div></button>
                <button onClick={handleNextBestLead} className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-full shadow-lg border border-gray-100"><span className="text-xs">Siguiente Lead (AI)</span><div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><ArrowRight size={16} /></div></button>
                <button onClick={openNew} className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-full shadow-lg border border-gray-100"><span className="text-xs">Manual</span><div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><User size={16} /></div></button>
              </>
            )}
            <button onClick={() => setIsFabOpen(!isFabOpen)} className={`rounded-full p-4 shadow-xl transition-all ${isFabOpen ? 'bg-gray-800 rotate-45' : 'bg-blue-600 hover:bg-blue-700'} text-white`}><Plus size={28} /></button>
          </div>
        </>
      )}

      {activeTab === 'detail' && <button onClick={handleNextBestLead} className="absolute bottom-6 right-6 bg-green-600 text-white rounded-full p-4 shadow-xl z-30"><ArrowRight size={28} /></button>}

      {showImport && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">Importar Leads</h3>
            {importing ? <p>Procesando...</p> : <div className="border-2 border-dashed p-8 text-center cursor-pointer" onClick={() => fileInputRef.current.click()}><Upload className="mx-auto mb-2" /><span className="text-sm">Seleccionar CSV</span><input type="file" accept=".csv,.txt" ref={fileInputRef} className="hidden" onChange={handleFileUpload} /></div>}
            <button onClick={() => setShowImport(false)} className="mt-4 w-full py-2 text-gray-500 text-sm">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}