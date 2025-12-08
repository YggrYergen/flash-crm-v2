import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Search, Phone, MessageCircle, Mail, DollarSign, 
  Calendar, CheckCircle, Clock, XCircle, ChevronRight, 
  MoreHorizontal, Save, Filter, User, FileText, Activity,
  Database, ArrowRight, Upload, MapPin, Globe, ExternalLink,
  Target, AlertTriangle, Check, X, BarChart2, Award, Layout,
  TrendingUp, Users, Wallet, Edit3
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, 
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, onSnapshot, 
  doc, updateDoc, deleteDoc, serverTimestamp, writeBatch 
} from 'firebase/firestore';

// --- CONFIGURACIÓN FIREBASE ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- CONSTANTES ---
const STATUS_OPTIONS = [
  { id: 'lead', label: 'Nuevo Lead', color: 'bg-blue-100 text-blue-700' },
  { id: 'contactado', label: 'Contactado', color: 'bg-purple-100 text-purple-700' },
  { id: 'reunion', label: 'En Reuniones', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'negociacion', label: 'Negociación', color: 'bg-orange-100 text-orange-700' },
  { id: 'cerrado', label: 'Cliente Cerrado', color: 'bg-green-100 text-green-700' },
  { id: 'perdido', label: 'Perdido', color: 'bg-gray-100 text-gray-500' },
];

const PAYMENT_STATUS = [
  { id: 'na', label: 'N/A', color: 'bg-gray-100 text-gray-500' },
  { id: 'pendiente', label: 'Pendiente', color: 'bg-red-100 text-red-700' },
  { id: 'parcial', label: 'Parcial', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'pagado', label: 'Pagado', color: 'bg-green-100 text-green-700' },
];

const QUICK_NOTES = [
  "No contestó", "Me pidió llamar mañana", "Envié propuesta", "Reunión agendada", "Interesado, seguimiento alto"
];

// --- UTILIDADES ---

// Parsea CSV respetando comillas
const parseCSVLine = (text) => {
  const re_value = /(?!\s*$)\s*(?:'([^']*)'|"([^"]*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
  const a = [];
  text.replace(re_value, function(m0, m1, m2, m3) {
      if      (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
      else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
      else if (m3 !== undefined) a.push(m3);
      return '';
  });
  if (/,\s*$/.test(text)) a.push('');
  return a;
};

// Algoritmo de Scoring Compuesto
const calculateCompositeScore = (data) => {
  let webScore = 0;
  const web = (data.website || '').toLowerCase();
  const isSocialMedia = web.includes('instagram.com') || web.includes('facebook.com') || web.includes('tiktok.com') || web.includes('linkedin.com');
  
  if (!web || isSocialMedia) {
    webScore = 100;
  } else {
    webScore = 0; 
  }

  let gbpScore = 0;
  const isClaimed = data.is_claimed === 'true' || data.is_claimed === true;
  const isVerified = data.verified === 'true' || data.verified === true;
  const reviewCount = parseInt(data.review_count || 0);
  const rating = parseFloat(data.rating || 0);

  if (!isClaimed) gbpScore += 40; 
  if (!isVerified) gbpScore += 20; 
  if (reviewCount < 5) gbpScore += 20; 
  if (rating > 0 && rating < 4.0) gbpScore += 20; 
  if (gbpScore > 100) gbpScore = 100;

  let sercotecScore = 0;
  if (isClaimed) sercotecScore += 25;
  if (isVerified) sercotecScore += 25;
  if (reviewCount > 10) sercotecScore += 20; 
  if (rating >= 4.0) sercotecScore += 10; 
  if (data.phone_number && data.phone_number.length > 5) sercotecScore += 10;
  if (data.full_address && data.full_address.length > 10) sercotecScore += 10;
  if (sercotecScore > 100) sercotecScore = 100;

  const generalScore = Math.round((webScore * 0.4) + (gbpScore * 0.4) + (sercotecScore * 0.2));

  return { webScore, gbpScore, sercotecScore, generalScore };
};

// --- COMPONENTES UI ---

const StatusBadge = ({ statusId, options }) => {
  const opt = options.find(o => o.id === statusId) || options[0];
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${opt.color}`}>
      {opt.label}
    </span>
  );
};

const NoteItem = ({ note }) => (
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

const ProgressBar = ({ label, score, colorClass, icon: Icon }) => (
  <div className="mb-3">
    <div className="flex justify-between items-center mb-1">
      <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
        {Icon && <Icon size={12} className="text-gray-400"/>} {label}
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

const Notification = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
      <CheckCircle size={18} className="text-green-400" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

// --- APP PRINCIPAL ---
export default function App() {
  const [user, setUser] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  
  // UI State
  const [activeTab, setActiveTab] = useState('list'); 
  const [selectedLead, setSelectedLead] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [isStatusEditing, setIsStatusEditing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '', company: '', phone: '', email: '', 
    status: 'lead', paymentStatus: 'na', serviceDetails: '',
    value: '', website: '', full_address: '', place_link: '',
    fitnessScore: 50, webScore: 0, gbpScore: 0, sercotecScore: 0
  });
  const [currentNote, setCurrentNote] = useState('');
  const fileInputRef = useRef(null);
  const pressTimer = useRef(null);

  // --- AUTENTICACIÓN ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- DATOS FIRESTORE ---
  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', appId, 'users', user.uid, 'leads');
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
      setLeads(data);
      setLoading(false);
    }, (error) => {
        console.error("Error Firestore:", error);
        setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // --- MANEJO DE GESTOS (LONG PRESS) ---
  const handlePressStart = () => {
    if (isStatusEditing) return; // Si ya edita, no reinicies
    pressTimer.current = setTimeout(() => {
      setIsStatusEditing(true);
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50); // Haptic feedback
      }
    }, 3000); // 3 segundos
  };

  const handlePressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  };

  const handleQuickUpdate = async (field, value) => {
    if (!selectedLead || !user) return;
    
    // Update local optimistic
    const updatedLead = { ...selectedLead, [field]: value };
    setSelectedLead(updatedLead);
    
    try {
      const leadRef = doc(db, 'artifacts', appId, 'users', user.uid, 'leads', selectedLead.id);
      await updateDoc(leadRef, { [field]: value, updatedAt: serverTimestamp() });
      showToast("Estado actualizado");
    } catch (error) {
      console.error(error);
      showToast("Error al actualizar");
    }
  };

  // --- IMPORTACIÓN CSV ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    setImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split('\n');
      
      const batch = writeBatch(db);
      let count = 0;
      const maxImport = 100;
      
      for (let i = 1; i < Math.min(lines.length, maxImport); i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = parseCSVLine(line);
        if (cols.length < 3) continue;

        const rawData = {
          business_id: cols[0], phone_number: cols[1], name: cols[2], full_address: cols[3],
          review_count: cols[6], rating: cols[7], website: cols[9], place_link: cols[11],
          is_claimed: cols[14], verified: cols[15],
        };

        const scores = calculateCompositeScore(rawData);
        const newDocRef = doc(collection(db, 'artifacts', appId, 'users', user.uid, 'leads'));
        
        batch.set(newDocRef, {
          name: rawData.name || 'Sin Nombre',
          phone: rawData.phone_number || '',
          company: rawData.name,
          email: '',
          full_address: rawData.full_address || '',
          website: rawData.website || '',
          place_link: rawData.place_link || '',
          status: 'lead',
          paymentStatus: 'na',
          fitnessScore: scores.generalScore,
          webScore: scores.webScore,
          gbpScore: scores.gbpScore,
          sercotecScore: scores.sercotecScore,
          source: 'import_csv',
          notes: [],
          searchStr: (rawData.name + ' ' + rawData.full_address).toLowerCase(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        count++;
      }

      try {
        await batch.commit();
        showToast(`¡${count} leads importados!`);
      } catch (err) {
        showToast("Error al importar");
      }
      setImporting(false);
      setShowImport(false);
      setIsFabOpen(false);
    };

    reader.readAsText(file);
  };

  // --- LÓGICA DE NEGOCIO ---
  const showToast = (msg) => setNotification(msg);

  const handleNextBestLead = () => {
    const isDetailView = activeTab === 'detail';
    const currentId = isDetailView ? selectedLead?.id : null;

    const pendingLeads = leads
      .filter(l => l.status === 'lead' && l.id !== currentId)
      .sort((a, b) => (b.fitnessScore || 0) - (a.fitnessScore || 0));

    if (pendingLeads.length > 0) {
      openDetail(pendingLeads[0]);
      setIsFabOpen(false);
    } else {
      showToast("¡Buen trabajo! No hay más leads pendientes.");
      setIsFabOpen(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name) return showToast("Falta el nombre");
    if (!user) return;

    try {
      const payload = {
        ...formData,
        updatedAt: serverTimestamp(),
        searchStr: (formData.name + ' ' + formData.company).toLowerCase()
      };

      if (selectedLead) {
        const leadRef = doc(db, 'artifacts', appId, 'users', user.uid, 'leads', selectedLead.id);
        await updateDoc(leadRef, payload);
        setSelectedLead({ ...selectedLead, ...payload }); 
        showToast("Guardado");
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'leads'), {
          ...payload,
          fitnessScore: 50, webScore: 50, gbpScore: 50, sercotecScore: 50,
          createdAt: serverTimestamp(),
          notes: [] 
        });
        showToast("Creado");
      }
      setActiveTab('list');
      resetForm();
    } catch (e) {
      showToast("Error al guardar");
    }
  };

  const handleAddNote = async () => {
    if (!currentNote.trim() || !selectedLead) return;
    const newNote = { content: currentNote, timestamp: Date.now(), id: Math.random().toString(36).substr(2, 9) };
    const updatedNotes = [newNote, ...(selectedLead.notes || [])];
    
    setSelectedLead(prev => ({ ...prev, notes: updatedNotes }));
    setCurrentNote('');

    try {
      const leadRef = doc(db, 'artifacts', appId, 'users', user.uid, 'leads', selectedLead.id);
      await updateDoc(leadRef, { notes: updatedNotes, updatedAt: serverTimestamp() });
    } catch (e) { console.error(e); }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', company: '', phone: '', email: '', status: 'lead', paymentStatus: 'na', 
      serviceDetails: '', value: '', website: '', full_address: '', place_link: '',
      fitnessScore: 50, webScore: 0, gbpScore: 0, sercotecScore: 0
    });
    setSelectedLead(null);
  };

  const openNew = () => { resetForm(); setActiveTab('form'); setIsFabOpen(false); };
  
  const openDetail = (lead) => { 
    setSelectedLead(lead); 
    setFormData(lead); 
    setActiveTab('detail'); 
    setIsStatusEditing(false); // Reset status edit mode
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchesSearch = (l.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (l.company || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'todos' || l.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [leads, searchTerm, filterStatus]);

  // --- ESTADÍSTICAS DETALLADAS (DASHBOARD) ---
  const stats = useMemo(() => {
    const total = leads.length;
    const newLeads = leads.filter(l => l.status === 'lead').length;
    const following = leads.filter(l => ['contactado', 'reunion'].includes(l.status)).length;
    const negotiating = leads.filter(l => l.status === 'negociacion').length;
    const closed = leads.filter(l => l.status === 'cerrado').length;
    const pendingPayment = leads.filter(l => ['pendiente', 'parcial'].includes(l.paymentStatus)).length;
    const highFit = leads.filter(l => l.status === 'lead' && (l.fitnessScore || 0) > 75).length;

    return { total, newLeads, following, negotiating, closed, pendingPayment, highFit };
  }, [leads]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500">Cargando...</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative select-none">
      
      {notification && <Notification message={notification} onClose={() => setNotification(null)} />}

      {/* HEADER */}
      <header className="bg-white px-4 py-3 shadow-sm z-10 flex-none">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            Flash CRM <span className="text-xs bg-gray-100 text-gray-500 px-1 rounded">v3.3</span>
          </h1>
          <div className="flex items-center gap-2">
            <button className="bg-gray-100 p-2 rounded-full text-gray-600" onClick={() => setActiveTab('list')}>
                <Layout size={18} />
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
               <button 
                onClick={() => setFilterStatus('todos')}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border ${filterStatus === 'todos' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-200 text-gray-600'}`}
              >
                Todos
              </button>
              {STATUS_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => setFilterStatus(opt.id)} className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border ${filterStatus === opt.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-600'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto pb-20 relative">
        
        {/* LIST VIEW */}
        {activeTab === 'list' && (
          <div className="p-4 space-y-3">
            
            {/* --- DASHBOARD OVERVIEW --- */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4 text-white shadow-lg mb-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp size={14} className="text-blue-400"/> Resumen Ejecutivo
                </h2>
                <div className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-300">
                    Total Leads: {stats.total}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div 
                    className="bg-white/10 rounded-lg p-3 relative overflow-hidden cursor-pointer hover:bg-white/20 transition-colors"
                    onClick={() => setFilterStatus('lead')}
                >
                  <div className="absolute top-0 right-0 p-1 opacity-20"><Users size={40}/></div>
                  <div className="text-2xl font-bold text-blue-400">{stats.newLeads}</div>
                  <div className="text-xs text-gray-300 font-medium">Por Contactar</div>
                  <div className="text-[10px] text-orange-400 mt-1 flex items-center gap-1">
                     <Target size={10}/> {stats.highFit} Prioridad Alta
                  </div>
                </div>

                <div 
                    className="bg-white/10 rounded-lg p-3 relative overflow-hidden cursor-pointer hover:bg-white/20 transition-colors"
                    onClick={() => setFilterStatus('cerrado')}
                >
                   <div className="absolute top-0 right-0 p-1 opacity-20"><Award size={40}/></div>
                   <div className="text-2xl font-bold text-green-400">{stats.closed}</div>
                   <div className="text-xs text-gray-300 font-medium">Clientes Activos</div>
                   <div className="text-[10px] text-gray-400 mt-1">Cierre exitoso</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/5 rounded p-2 cursor-pointer hover:bg-white/10" onClick={() => setFilterStatus('negociacion')}>
                   <div className="text-lg font-bold text-yellow-400">{stats.negotiating}</div>
                   <div className="text-[10px] text-gray-400 leading-tight">En Cierre</div>
                </div>
                <div className="bg-white/5 rounded p-2 cursor-pointer hover:bg-white/10" onClick={() => setFilterStatus('contactado')}>
                   <div className="text-lg font-bold text-purple-400">{stats.following}</div>
                   <div className="text-[10px] text-gray-400 leading-tight">Seguimiento</div>
                </div>
                <div className="bg-white/5 rounded p-2 cursor-pointer hover:bg-white/10">
                   <div className="text-lg font-bold text-red-400">{stats.pendingPayment}</div>
                   <div className="text-[10px] text-gray-400 leading-tight">Por Cobrar</div>
                </div>
              </div>
            </div>

            {filteredLeads.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Database size={48} className="mx-auto mb-2 opacity-20"/>
                <p>No se encontraron clientes.</p>
              </div>
            ) : (
              filteredLeads.map(lead => (
                <div 
                  key={lead.id} 
                  onClick={() => openDetail(lead)}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer relative overflow-hidden"
                >
                  {(lead.webScore > 80 || lead.gbpScore > 80 || lead.sercotecScore > 80) && lead.status === 'lead' && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">
                       Oportunidad Alta
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg leading-tight truncate max-w-[200px]">{lead.name}</h3>
                      {lead.company && <p className="text-gray-500 text-sm font-medium truncate max-w-[200px]">{lead.company}</p>}
                    </div>
                    <StatusBadge statusId={lead.status} options={STATUS_OPTIONS} />
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <div className="flex gap-2">
                      <StatusBadge statusId={lead.paymentStatus} options={PAYMENT_STATUS} />
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      {lead.fitnessScore > 50 ? <BarChart2 size={12} className="text-indigo-400"/> : <Clock size={12}/>}
                      {lead.fitnessScore ? `Score: ${lead.fitnessScore}` : 'Nuevo'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* DETAIL VIEW */}
        {activeTab === 'detail' && selectedLead && (
          <div className="bg-white min-h-full pb-10">
            {/* Detail Nav */}
            <div className="sticky top-0 bg-white z-10 border-b border-gray-100 p-4 flex justify-between items-center shadow-sm">
              <button onClick={() => setActiveTab('list')} className="p-2 -ml-2 text-gray-600"><ChevronRight className="rotate-180" /></button>
              <span className="font-bold text-gray-800 truncate px-2 flex-1">{selectedLead.name}</span>
              <button onClick={() => setActiveTab('form')} className="text-blue-600 text-sm font-medium">Editar</button>
            </div>

            {/* Research Toolbar */}
            <div className="bg-gray-800 text-white p-3">
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Investigación Rápida</p>
              <div className="flex gap-3 justify-around">
                <a 
                  href={`https://www.google.com/search?q=${encodeURIComponent(selectedLead.name + ' ' + (selectedLead.full_address || 'Chile'))}`} 
                  target="_blank" rel="noreferrer"
                  className="flex flex-col items-center gap-1 hover:text-blue-300 transition-colors"
                >
                  <Search size={18} /> <span className="text-[10px]">Google</span>
                </a>
                <a 
                  href={selectedLead.place_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLead.full_address || selectedLead.name)}`} 
                  target="_blank" rel="noreferrer"
                  className="flex flex-col items-center gap-1 hover:text-green-300 transition-colors"
                >
                  <MapPin size={18} /> <span className="text-[10px]">Maps</span>
                </a>
                <a 
                  href={selectedLead.website || `https://www.instagram.com/explore/tags/${encodeURIComponent(selectedLead.name.replace(/\s+/g, ''))}/`} 
                  target="_blank" rel="noreferrer"
                  className="flex flex-col items-center gap-1 hover:text-pink-300 transition-colors"
                >
                  <Globe size={18} /> <span className="text-[10px]">Web/IG</span>
                </a>
              </div>
            </div>

            {/* Contact Actions */}
            <div className="grid grid-cols-3 gap-2 p-4 border-b border-gray-100 bg-gray-50">
              <a href={`tel:${selectedLead.phone}`} className={`flex flex-col items-center gap-1 p-2 rounded-lg ${selectedLead.phone ? 'text-green-600 bg-green-50 border border-green-100' : 'text-gray-300 bg-gray-100 pointer-events-none'}`}>
                <Phone size={20} /> <span className="text-[10px] font-bold">Llamar</span>
              </a>
              <a 
                href={`https://wa.me/${selectedLead.phone?.replace(/[^0-9]/g, '')}`} 
                target="_blank" rel="noreferrer"
                className={`flex flex-col items-center gap-1 p-2 rounded-lg ${selectedLead.phone ? 'text-green-600 bg-green-50 border border-green-100' : 'text-gray-300 bg-gray-100 pointer-events-none'}`}>
                <MessageCircle size={20} /> <span className="text-[10px] font-bold">WhatsApp</span>
              </a>
              <a href={`mailto:${selectedLead.email}`} className={`flex flex-col items-center gap-1 p-2 rounded-lg ${selectedLead.email ? 'text-blue-600 bg-blue-50 border border-blue-100' : 'text-gray-300 bg-gray-100 pointer-events-none'}`}>
                <Mail size={20} /> <span className="text-[10px] font-bold">Email</span>
              </a>
            </div>

            <div className="p-4 space-y-6">
              
              {/* FITNESS CARD */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Target size={14} className="text-blue-600"/> Análisis de Oportunidad
                </h4>
                
                <ProgressBar label="Venta Sitio Web" score={selectedLead.webScore || 0} colorClass="bg-blue-500" icon={Layout} />
                <p className="text-[10px] text-gray-400 mb-3 leading-tight">
                  {selectedLead.webScore > 80 ? '⚠️ No tiene web o usa redes sociales. ¡Alta necesidad!' : '✔️ Tiene sitio web propio.'}
                </p>

                <ProgressBar label="Gestión Maps (GBP)" score={selectedLead.gbpScore || 0} colorClass="bg-green-500" icon={MapPin} />
                <p className="text-[10px] text-gray-400 mb-3 leading-tight">
                  {selectedLead.gbpScore > 80 ? '⚠️ Perfil no reclamado, sin verificar o malas reviews.' : '✔️ Perfil gestionado correctamente.'}
                </p>

                <ProgressBar label="Potencial SERCOTEC" score={selectedLead.sercotecScore || 0} colorClass="bg-purple-500" icon={Award} />
                 <p className="text-[10px] text-gray-400 leading-tight">
                  {selectedLead.sercotecScore > 80 ? '🚀 Empresa formal y sólida. Alta probabilidad de ganar.' : '⚠️ Faltan datos clave para postular.'}
                </p>
              </div>

              {/* Status Section (Editable) */}
              <div 
                className={`bg-white rounded-lg border border-gray-100 p-4 shadow-sm transition-all relative overflow-hidden ${isStatusEditing ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                onMouseDown={handlePressStart}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onTouchStart={handlePressStart}
                onTouchEnd={handlePressEnd}
              >
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      Estado {isStatusEditing ? <span className="text-blue-600 bg-blue-100 px-1 rounded text-[10px] animate-pulse">EDICIÓN RÁPIDA</span> : ''}
                    </h4>
                    {isStatusEditing && (
                        <button onClick={(e) => { e.stopPropagation(); setIsStatusEditing(false); }} className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded font-bold">
                            <X size={12}/> Cerrar
                        </button>
                    )}
                </div>

                {isStatusEditing ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                         <div>
                            <p className="text-[10px] font-bold text-gray-500 mb-2 uppercase">Etapa del Pipeline</p>
                            <div className="flex flex-wrap gap-2">
                                {STATUS_OPTIONS.map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleQuickUpdate('status', opt.id)}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${selectedLead.status === opt.id ? opt.color + ' ring-2 ring-offset-1 ring-blue-400 border-transparent shadow-md transform scale-105' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                         </div>
                         <div>
                            <p className="text-[10px] font-bold text-gray-500 mb-2 uppercase">Estado de Pago</p>
                            <div className="flex flex-wrap gap-2">
                                {PAYMENT_STATUS.map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleQuickUpdate('paymentStatus', opt.id)}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${selectedLead.paymentStatus === opt.id ? opt.color + ' ring-2 ring-offset-1 ring-blue-400 border-transparent shadow-md transform scale-105' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                         </div>
                    </div>
                ) : (
                    <>
                      <div className="flex flex-wrap gap-2 select-none pointer-events-none">
                          <StatusBadge statusId={selectedLead.status} options={STATUS_OPTIONS} />
                          <StatusBadge statusId={selectedLead.paymentStatus} options={PAYMENT_STATUS} />
                      </div>
                      <div className="w-full text-[10px] text-gray-300 italic mt-2 text-right flex justify-end items-center gap-1">
                        <Edit3 size={10} /> Mantén presionado 3s para editar
                      </div>
                    </>
                )}

                {selectedLead.serviceDetails && !isStatusEditing && (
                   <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{selectedLead.serviceDetails}</p>
                   </div>
                )}
              </div>

              {/* Bitácora */}
              <div className="pb-20">
                 <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider flex items-center gap-2">
                    <Calendar size={14}/> Bitácora
                 </h4>
                 
                 <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 mb-6 sticky top-16 z-0">
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mb-2">
                      {QUICK_NOTES.map((note, i) => (
                        <button key={i} onClick={() => setCurrentNote(note)} className="whitespace-nowrap px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600 shadow-sm active:bg-gray-100">
                          {note}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        value={currentNote}
                        onChange={(e) => setCurrentNote(e.target.value)}
                        placeholder="Nota rápida..."
                        className="flex-1 bg-white border border-gray-300 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <button onClick={handleAddNote} disabled={!currentNote.trim()} className="bg-blue-600 text-white p-2 rounded-lg disabled:opacity-50">
                        <Save size={18} />
                      </button>
                    </div>
                 </div>

                 <div className="space-y-1">
                   {(selectedLead.notes && selectedLead.notes.length > 0) ? (
                     selectedLead.notes.map((note, idx) => (
                       <NoteItem key={idx} note={note} />
                     ))
                   ) : (
                     <div className="text-center py-6 text-gray-400 text-sm italic">
                       Sin actividad registrada.
                     </div>
                   )}
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* FORM VIEW */}
        {activeTab === 'form' && (
          <div className="p-4 bg-white min-h-full">
            <div className="flex justify-between items-center mb-6">
               <button onClick={() => selectedLead ? setActiveTab('detail') : setActiveTab('list')} className="text-gray-500">Cancelar</button>
               <h2 className="font-bold text-lg">{selectedLead ? 'Editar' : 'Nuevo Lead'}</h2>
               <button onClick={handleSave} className="text-blue-600 font-bold">Guardar</button>
            </div>
            <div className="space-y-4">
              <div className="space-y-3">
                <input className="w-full p-3 bg-gray-50 rounded-lg border-none" placeholder="Nombre / Negocio *" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <input className="w-full p-3 bg-gray-50 rounded-lg border-none" placeholder="Dirección" value={formData.full_address} onChange={e => setFormData({...formData, full_address: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <input className="w-full p-3 bg-gray-50 rounded-lg border-none" placeholder="Teléfono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                 <input className="w-full p-3 bg-gray-50 rounded-lg border-none" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="pt-4 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-700 mb-2">Pipeline</label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map(opt => (
                    <button key={opt.id} onClick={() => setFormData({...formData, status: opt.id})} className={`p-2 rounded-lg text-sm text-left ${formData.status === opt.id ? 'ring-2 ring-blue-500 ' + opt.color : 'bg-gray-50 text-gray-600'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* FABs */}
      {/* 1. LIST VIEW FABs */}
      {activeTab === 'list' && (
        <>
          {isFabOpen && <div className="absolute inset-0 bg-white/80 z-20 backdrop-blur-sm" onClick={() => setIsFabOpen(false)} />}
          <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 z-30">
            {isFabOpen && (
              <>
                <button onClick={() => setShowImport(true)} className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-full shadow-lg border border-gray-100 animate-in slide-in-from-bottom-4">
                  <span className="text-xs">Importar BD</span>
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center"><Database size={16}/></div>
                </button>
                <button onClick={handleNextBestLead} className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-full shadow-lg border border-gray-100 animate-in slide-in-from-bottom-2">
                  <span className="text-xs">Siguiente Lead (AI)</span>
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><ArrowRight size={16}/></div>
                </button>
                <button onClick={openNew} className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-full shadow-lg border border-gray-100 animate-in slide-in-from-bottom-1">
                  <span className="text-xs">Manual</span>
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><User size={16}/></div>
                </button>
              </>
            )}
            <button onClick={() => setIsFabOpen(!isFabOpen)} className={`rounded-full p-4 shadow-xl transition-all ${isFabOpen ? 'bg-gray-800 rotate-45' : 'bg-blue-600 hover:bg-blue-700'} text-white`}>
              <Plus size={28} />
            </button>
          </div>
        </>
      )}

      {/* 2. DETAIL VIEW FAB */}
      {activeTab === 'detail' && (
        <button 
          onClick={handleNextBestLead}
          className="absolute bottom-6 right-6 bg-green-600 text-white rounded-full p-4 shadow-xl hover:bg-green-700 active:scale-90 transition-all z-30 animate-in zoom-in"
        >
          <ArrowRight size={28} />
        </button>
      )}

      {/* MODAL IMPORT */}
      {showImport && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2"><Database className="text-blue-600"/> Importar Leads</h3>
            <p className="text-sm text-gray-500 mb-6">Sube tu archivo .csv (business_id, phone, name...).</p>
            {importing ? (
               <div className="text-center py-4">
                 <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                 <p className="text-xs font-bold text-gray-400">Procesando IA...</p>
               </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50 cursor-pointer" onClick={() => fileInputRef.current.click()}>
                <Upload className="mx-auto text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">Seleccionar CSV</span>
                <input type="file" accept=".csv,.txt" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
              </div>
            )}
            <button onClick={() => setShowImport(false)} className="mt-4 w-full py-2 text-gray-500 text-sm">Cancelar</button>
          </div>
        </div>
      )}

    </div>
  );
}