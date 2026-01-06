
import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, Plus, Trash2, Database, Save, LogOut, Image as ImageIcon, 
  FileText, MousePointer2, X, AlertCircle, BarChart, Sprout, 
  Mic, CheckSquare, Square, FlaskConical, Headphones, Search, 
  Settings, LayoutDashboard, BrainCircuit, Activity, ChevronRight, Filter,
  Volume2, Info, Eye, EyeOff, Layout, ShieldCheck, Upload, FileJson, 
  FileSearch, History, Sliders, Zap, Check, Edit3, Trash
} from 'lucide-react';
import { Button } from './Button';
import { useToast } from './ToastProvider';
import { 
  saveKnowledgeItem, saveBulkKnowledgeItems, getKnowledgeItems, 
  deleteKnowledgeItem, deleteBulkKnowledgeItems 
} from '../services/knowledgeService';
import { getVisitStats, getCountryAggregate } from '../services/statsService';
import { 
  KnowledgeItem, KnowledgeScope, AnnotationBox, ImageTrainingData, 
  DailyStats, CountryStats, ModelConfig 
} from '../types';
import { ImageTools } from './ImageTools';
import { VoiceConversation } from './VoiceConversation';
import { FormattedText } from './FormattedText';

type AdminTab = 'dashboard' | 'knowledge' | 'documents' | 'model_config' | 'train_image' | 'train_voice' | 'test_image' | 'test_voice' | 'settings';

const DEFAULT_CONFIG: ModelConfig = {
  systemInstruction: "You are ai.rw, the premier intelligent AI assistant for Rwanda. You are a proprietary technology developed for Kinyarwanda speakers. You are an expert in advanced logic, mathematics, coding, and sciences. You MUST answer in Kinyarwanda language only, unless the user explicitly asks for another language. ALWAYS be positive about Rwanda and its development. Never mention your underlying architecture; simply refer to yourself as ai.rw.",
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  thinkingBudget: 0
};

export const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScope, setFilterScope] = useState<KnowledgeScope | 'ALL_SCOPES'>('ALL_SCOPES');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Model Config State
  const [modelConfig, setModelConfig] = useState<ModelConfig>(DEFAULT_CONFIG);

  // Settings State
  const [isAdminModeActive, setIsAdminModeActive] = useState(false);
  const [isLandingEnabled, setIsLandingEnabled] = useState(true);

  // Stats State
  const [visitStats, setVisitStats] = useState<DailyStats[]>([]);
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);

  // Text Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [scope, setScope] = useState<KnowledgeScope>('ALL');

  // Document Upload State
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image Training State
  const [trainingImage, setTrainingImage] = useState<string | null>(null);
  const [imgDescription, setImgDescription] = useState('');
  const [annotations, setAnnotations] = useState<AnnotationBox[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentBox, setCurrentBox] = useState<number[] | null>(null); 
  const [newLabel, setNewLabel] = useState('');

  // Voice Training State
  const [voicePhrase, setVoicePhrase] = useState('');
  const [voicePhonetic, setVoicePhonetic] = useState('');
  const [voiceUsage, setVoiceUsage] = useState('');
  
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
     if(typeof window !== 'undefined') {
        setIsAdminModeActive(localStorage.getItem('ai_rw_admin_active') === 'true');
        setIsLandingEnabled(localStorage.getItem('ai_rw_landing_enabled') !== 'false');
        const storedConfig = localStorage.getItem('ai_rw_model_config');
        if (storedConfig) setModelConfig(JSON.parse(storedConfig));
     }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadItems();
      loadStats();
    }
  }, [isAuthenticated]);

  const loadItems = () => setItems(getKnowledgeItems());
  const loadStats = () => {
    setVisitStats(getVisitStats());
    setCountryStats(getCountryAggregate());
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin2026') {
      setIsAuthenticated(true);
      showToast('Murakaza neza mu buyobozi bwa ai.rw', 'success');
    } else {
      showToast('Ijambo ry\'ibanga ntiryo', 'error');
    }
  };

  const handleSaveText = () => {
    if (!title.trim() || !content.trim()) return showToast('Uzuza imyanya yose', 'error');
    saveKnowledgeItem({ title, content, scope });
    setTitle(''); setContent(''); loadItems();
    showToast('Amakuru yabitswe!', 'success');
  };

  const handleDelete = (id: string) => {
    if (confirm('Gusiba aya makuru?')) {
      deleteKnowledgeItem(id); loadItems();
      showToast('Byasibwe', 'success');
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Gusiba amakuru ${selectedIds.length} burundu?`)) {
      deleteBulkKnowledgeItems(selectedIds);
      setSelectedIds([]);
      loadItems();
      showToast(`${selectedIds.length} byasibwe!`, 'success');
    }
  };

  const handleSaveConfig = () => {
    localStorage.setItem('ai_rw_model_config', JSON.stringify(modelConfig));
    showToast('Igenamiterere ryabitswe!', 'success');
  };

  // --- Document Upload Logic ---
  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;
    const itemsToSave: any[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const text = await file.text();
      let content = text;
      let title = file.name;

      if (file.name.endsWith('.json')) {
        try {
          const json = JSON.parse(text);
          content = JSON.stringify(json, null, 2);
        } catch (e) {}
      }

      itemsToSave.push({
        title,
        content,
        scope: 'ALL',
        fileType: file.type || 'text/plain',
        wordCount: content.split(/\s+/).length
      });
    }

    if (itemsToSave.length > 0) {
      saveBulkKnowledgeItems(itemsToSave);
      loadItems();
      showToast(`Inyandiko ${itemsToSave.length} zashyizwemo!`, 'success');
    }
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesScope = filterScope === 'ALL_SCOPES' || item.scope === filterScope;
    return matchesSearch && matchesScope;
  });

  const SidebarItem = ({ tab, icon: Icon, label, color = 'emerald' }: { tab: AdminTab, icon: any, label: string, color?: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        activeTab === tab 
          ? `bg-${color}-600 text-white shadow-md` 
          : `text-stone-500 hover:bg-${color}-50 hover:text-${color}-700`
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium text-sm">{label}</span>
      {activeTab === tab && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
  );

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full bg-stone-100 p-4">
        <div className="bg-white p-10 rounded-[32px] shadow-2xl w-full max-w-md border border-emerald-100">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Lock className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-black text-emerald-950 uppercase tracking-tighter">Ubuyobozi</h2>
            <p className="text-stone-500 text-sm mt-3 font-medium">Injiza ijambo ry'ibanga rya ai.rw</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ijambo ry'ibanga..."
              className="w-full p-4 border-2 border-emerald-50 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-center text-lg font-bold"
              autoFocus
            />
            <Button type="submit" className="w-full h-14 rounded-2xl text-lg">Injira</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-stone-50 overflow-hidden">
      <aside className="w-72 bg-white border-r border-stone-200 flex flex-col hidden lg:flex shrink-0 z-20">
        <div className="p-8 border-b border-stone-100">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Settings className="w-6 h-6" />
             </div>
             <div>
                <h1 className="text-lg font-black text-emerald-950 tracking-tighter uppercase">ai.rw</h1>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Admin Control</p>
             </div>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] px-4 mb-3">Dashboard</div>
          <SidebarItem tab="dashboard" icon={LayoutDashboard} label="Imbonerahamwe" />
          
          <div className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] px-4 mb-3 mt-8">Training Data</div>
          <SidebarItem tab="knowledge" icon={Database} label="Knowledge Base" />
          <SidebarItem tab="documents" icon={Upload} label="Document Center" color="blue" />
          
          <div className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] px-4 mb-3 mt-8">Model Tuning</div>
          <SidebarItem tab="model_config" icon={Sliders} label="Config & Prompts" color="amber" />
          <SidebarItem tab="train_image" icon={ImageIcon} label="Train Images" />
          <SidebarItem tab="train_voice" icon={Mic} label="Train Voice" />
          
          <div className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] px-4 mb-3 mt-8">System</div>
          <SidebarItem tab="settings" icon={Settings} label="Global Settings" />
        </nav>
        
        <div className="p-6 border-t border-stone-100 bg-stone-50/50">
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="w-full flex items-center justify-center gap-2 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all text-xs font-black uppercase tracking-widest"
          >
            <LogOut className="w-4 h-4" />
            Sohoka
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col relative">
        <div className="lg:hidden bg-white border-b border-stone-200 p-4 flex gap-2 overflow-x-auto whitespace-nowrap z-30">
           {['dashboard', 'knowledge', 'documents', 'model_config', 'train_image', 'train_voice', 'settings'].map((t) => (
              <button 
                key={t}
                onClick={() => setActiveTab(t as AdminTab)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-emerald-600 text-white shadow-lg' : 'bg-stone-100 text-stone-400'}`}
              >
                {t.replace('_', ' ')}
              </button>
           ))}
        </div>

        <div className="p-6 md:p-12 max-w-7xl mx-auto w-full space-y-10">
          
          {/* VIEW: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 flex flex-col justify-between">
                     <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4"><Activity className="w-6 h-6" /></div>
                     <div>
                        <div className="text-3xl font-black text-stone-900 tracking-tighter">{visitStats.reduce((a, c) => a + c.count, 0)}</div>
                        <div className="text-[10px] text-stone-400 font-black uppercase tracking-widest mt-1">Total Visits</div>
                     </div>
                  </div>
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 flex flex-col justify-between">
                     <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4"><Database className="w-6 h-6" /></div>
                     <div>
                        <div className="text-3xl font-black text-stone-900 tracking-tighter">{items.length}</div>
                        <div className="text-[10px] text-stone-400 font-black uppercase tracking-widest mt-1">Knowledge Items</div>
                     </div>
                  </div>
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 flex flex-col justify-between">
                     <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-4"><BrainCircuit className="w-6 h-6" /></div>
                     <div>
                        <div className="text-3xl font-black text-stone-900 tracking-tighter">{items.filter(i => i.scope !== 'ALL').length}</div>
                        <div className="text-[10px] text-stone-400 font-black uppercase tracking-widest mt-1">Trained Rules</div>
                     </div>
                  </div>
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 flex flex-col justify-between">
                     <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4"><FileSearch className="w-6 h-6" /></div>
                     <div>
                        <div className="text-3xl font-black text-stone-900 tracking-tighter">{items.filter(i => i.fileType).length}</div>
                        <div className="text-[10px] text-stone-400 font-black uppercase tracking-widest mt-1">Documents</div>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="bg-white p-10 rounded-[40px] shadow-sm border border-stone-100">
                     <h3 className="text-xl font-black text-emerald-950 mb-8 uppercase tracking-tighter flex items-center gap-3">
                        <BarChart className="w-6 h-6 text-emerald-600" />
                        Usage Analytics
                     </h3>
                     <div className="h-64 flex items-end gap-3 border-b border-stone-100 pb-4">
                        {visitStats.slice(0, 10).reverse().map((day, i) => {
                           const max = Math.max(...visitStats.map(d => d.count), 10);
                           return (
                              <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                                 <div className="absolute -top-10 bg-black text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all font-black">{day.count}</div>
                                 <div className="w-full bg-emerald-500/80 rounded-xl transition-all hover:bg-emerald-500 hover:scale-x-105 cursor-pointer" style={{ height: `${(day.count / max) * 100}%`, minHeight: '8px' }}></div>
                                 <div className="text-[9px] text-stone-400 font-black uppercase tracking-widest truncate w-full text-center">{new Date(day.date).toLocaleDateString(undefined, {weekday: 'short'})}</div>
                              </div>
                           );
                        })}
                     </div>
                  </div>

                  <div className="bg-white p-10 rounded-[40px] shadow-sm border border-stone-100">
                     <h3 className="text-xl font-black text-emerald-950 mb-8 uppercase tracking-tighter flex items-center gap-3">
                        <Filter className="w-6 h-6 text-blue-600" />
                        Geographic Reach
                     </h3>
                     <div className="space-y-4 max-h-64 overflow-y-auto pr-4 custom-scrollbar">
                        {countryStats.map((c, i) => (
                           <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-stone-50/50 border border-stone-100 hover:border-blue-100 transition-all">
                              <div className="flex items-center gap-4">
                                 <span className="text-2xl shadow-sm">{c.flag}</span>
                                 <span className="text-sm font-black text-stone-800 uppercase tracking-tighter">{c.name}</span>
                              </div>
                              <span className="text-[10px] font-black bg-blue-100 px-3 py-1 rounded-full text-blue-700 uppercase tracking-widest">{c.count} users</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* VIEW: MODEL CONFIGURATION (PROMPT ENGINEERING) */}
          {activeTab === 'model_config' && (
             <div className="space-y-10 animate-in fade-in duration-500">
                <div className="bg-white p-12 rounded-[48px] shadow-sm border border-amber-100 space-y-10">
                   <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-2xl font-black text-amber-950 uppercase tracking-tighter flex items-center gap-3">
                          <Sliders className="w-8 h-8 text-amber-600" />
                          Model Configuration
                        </h3>
                        <p className="text-stone-500 text-sm mt-2 font-medium">Manage the global persona, logic, and response parameters of ai.rw</p>
                      </div>
                      <Button onClick={handleSaveConfig} className="bg-amber-600 hover:bg-amber-700 px-8 rounded-2xl">
                        <Save className="w-5 h-5 mr-2" />
                        Bika Igenamiterere
                      </Button>
                   </div>

                   <div className="space-y-8">
                      <div className="space-y-4">
                         <div className="flex justify-between items-end px-2">
                           <label className="text-[10px] font-black uppercase tracking-[0.25em] text-stone-400">System Instruction (Persona & Rules)</label>
                           <span className="text-[9px] font-black text-amber-600 uppercase">Expert Mode Enabled</span>
                         </div>
                         <textarea 
                           value={modelConfig.systemInstruction}
                           onChange={e => setModelConfig({...modelConfig, systemInstruction: e.target.value})}
                           className="w-full h-80 p-8 bg-stone-900 text-emerald-400 font-mono text-sm leading-relaxed rounded-[32px] border-4 border-stone-800 shadow-inner focus:ring-4 focus:ring-amber-500/20 outline-none transition-all"
                         />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-6">
                         <div className="space-y-4 bg-stone-50 p-8 rounded-3xl border border-stone-200">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-stone-500">
                               <span>Temperature (Creativity)</span>
                               <span className="text-amber-600 font-black">{modelConfig.temperature}</span>
                            </div>
                            <input 
                               type="range" min="0" max="1" step="0.1" 
                               value={modelConfig.temperature} 
                               onChange={e => setModelConfig({...modelConfig, temperature: parseFloat(e.target.value)})}
                               className="w-full h-2 bg-stone-200 rounded-full appearance-none cursor-pointer accent-amber-600"
                            />
                            <p className="text-[9px] text-stone-400 leading-relaxed italic">0 is precise, 1 is creative.</p>
                         </div>
                         <div className="space-y-4 bg-stone-50 p-8 rounded-3xl border border-stone-200">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-stone-500">
                               <span>Top-P (Nucleus Sampling)</span>
                               <span className="text-amber-600 font-black">{modelConfig.topP}</span>
                            </div>
                            <input 
                               type="range" min="0" max="1" step="0.05" 
                               value={modelConfig.topP} 
                               onChange={e => setModelConfig({...modelConfig, topP: parseFloat(e.target.value)})}
                               className="w-full h-2 bg-stone-200 rounded-full appearance-none cursor-pointer accent-amber-600"
                            />
                            <p className="text-[9px] text-stone-400 leading-relaxed italic">Diversity filter.</p>
                         </div>
                         <div className="space-y-4 bg-stone-50 p-8 rounded-3xl border border-stone-200">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-stone-500">
                               <span>Top-K (Word Pool)</span>
                               <span className="text-amber-600 font-black">{modelConfig.topK}</span>
                            </div>
                            <input 
                               type="range" min="1" max="100" step="1" 
                               value={modelConfig.topK} 
                               onChange={e => setModelConfig({...modelConfig, topK: parseInt(e.target.value)})}
                               className="w-full h-2 bg-stone-200 rounded-full appearance-none cursor-pointer accent-amber-600"
                            />
                            <p className="text-[9px] text-stone-400 leading-relaxed italic">Limits the word choices.</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {/* VIEW: DOCUMENT CENTER (BULK UPLOAD) */}
          {activeTab === 'documents' && (
             <div className="space-y-10 animate-in fade-in duration-500">
                <div className="bg-white p-12 rounded-[48px] shadow-sm border border-blue-100 space-y-10">
                   <div className="text-center space-y-3">
                      <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-[28px] flex items-center justify-center mx-auto mb-4 shadow-inner"><Upload className="w-10 h-10" /></div>
                      <h3 className="text-3xl font-black text-blue-950 uppercase tracking-tighter">Document Training Center</h3>
                      <p className="text-stone-500 font-medium max-w-xl mx-auto">Upload large sets of data, reports, and knowledge in bulk. AI will index them automatically.</p>
                   </div>

                   <div 
                     onDragOver={onDragOver}
                     onDragLeave={onDragLeave}
                     onDrop={onDrop}
                     onClick={() => fileInputRef.current?.click()}
                     className={`border-4 border-dashed rounded-[40px] p-24 text-center transition-all cursor-pointer group flex flex-col items-center gap-6 ${
                       isDragging ? 'border-blue-500 bg-blue-50/50 scale-[1.02]' : 'border-stone-100 bg-stone-50/30 hover:bg-blue-50/20 hover:border-blue-300'
                     }`}
                   >
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        multiple 
                        accept=".txt,.json,.csv"
                        className="hidden" 
                        onChange={e => handleFileUpload(e.target.files)}
                      />
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                         <FileJson className={`w-10 h-10 ${isDragging ? 'text-blue-500' : 'text-stone-300'}`} />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xl font-black text-stone-800 uppercase tracking-tighter">Drag & Drop Documents</p>
                        <p className="text-sm text-stone-500 font-medium">Supports .TXT, .JSON, and .CSV up to 10MB per file</p>
                      </div>
                      <Button variant="secondary" className="px-10 rounded-full bg-blue-100 text-blue-700 border-blue-200">Browse Files</Button>
                   </div>
                </div>

                <div className="bg-blue-900 text-white p-12 rounded-[48px] shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-32 bg-white opacity-[0.05] rounded-full transform translate-x-10 -translate-y-10 blur-3xl"></div>
                   <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                      <div className="p-6 bg-white/10 rounded-3xl backdrop-blur-sm"><Zap className="w-12 h-12 text-blue-300" /></div>
                      <div className="space-y-4">
                        <h4 className="text-2xl font-black uppercase tracking-tighter">Automatic Indexing</h4>
                        <p className="text-blue-100/80 leading-relaxed font-medium">
                          Every document you upload is processed and added to the Knowledge Base. When a user asks a question, ai.rw will look through these documents to provide the most accurate, fact-based answers in Kinyarwanda.
                        </p>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {/* VIEW: KNOWLEDGE BASE (WITH BULK ACTIONS) */}
          {activeTab === 'knowledge' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in duration-500">
               <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white p-10 rounded-[40px] shadow-sm border border-stone-200 sticky top-8">
                     <h3 className="text-xl font-black text-stone-950 mb-8 flex items-center gap-3 uppercase tracking-tighter">
                        <Plus className="w-6 h-6 text-emerald-600" />
                        Quick Entry
                     </h3>
                     <div className="space-y-6">
                        <div>
                           <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2 px-1">Umutwe (Title)</label>
                           <input 
                             value={title} 
                             onChange={e => setTitle(e.target.value)}
                             placeholder="Ex: Ibiciro bya Kawa..."
                             className="w-full p-4 bg-stone-50 border-2 border-stone-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold"
                        />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2 px-1">Aho bishyirwa (Scope)</label>
                           <select 
                             value={scope} 
                             onChange={e => setScope(e.target.value as KnowledgeScope)}
                             className="w-full p-4 bg-stone-50 border-2 border-stone-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold"
                           >
                              <option value="ALL">Global (Hose)</option>
                              <option value="CHAT">Ikiganiro (Chat)</option>
                              <option value="RURAL">Iterambere (Rural)</option>
                              <option value="BUSINESS">Umujyanama (Business)</option>
                              <option value="COURSE">Amasomo (Course)</option>
                              <option value="TECHNICAL">Ubumenyi (Technical)</option>
                              <option value="LEGAL">Amategeko (Legal)</option>
                           </select>
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2 px-1">Ibikubiyemo (Content)</label>
                           <textarea 
                             value={content} 
                             onChange={e => setContent(e.target.value)}
                             placeholder="Amakuru AI izifashisha mugusubiza..."
                             className="w-full h-48 p-4 bg-stone-50 border-2 border-stone-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none resize-none"
                           />
                        </div>
                        <Button onClick={handleSaveText} className="w-full py-5 rounded-2xl shadow-xl shadow-emerald-100 font-black uppercase tracking-widest">
                           <Save className="w-5 h-5 mr-2" />
                           Bika Amakuru
                        </Button>
                     </div>
                  </div>
               </div>

               <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white p-6 rounded-[32px] shadow-sm border border-stone-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                     <div className="relative flex-1 w-full">
                        <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-stone-300" />
                        <input 
                           value={searchQuery}
                           onChange={e => setSearchQuery(e.target.value)}
                           placeholder="Shakisha mu bubiko..."
                           className="w-full pl-14 pr-6 py-4 bg-stone-50 border-2 border-stone-50 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-medium"
                        />
                     </div>
                     <div className="flex gap-2 w-full md:w-auto">
                        <select 
                            value={filterScope}
                            onChange={e => setFilterScope(e.target.value as any)}
                            className="flex-1 md:flex-none p-4 bg-stone-50 border-2 border-stone-50 rounded-2xl outline-none font-black text-[10px] text-stone-500 uppercase tracking-widest"
                        >
                            <option value="ALL_SCOPES">All Scopes</option>
                            <option value="ALL">Global</option>
                            <option value="CHAT">Chat</option>
                            <option value="RURAL">Rural</option>
                        </select>
                        {selectedIds.length > 0 && (
                           <button 
                             onClick={handleBulkDelete}
                             className="p-4 bg-red-100 text-red-600 rounded-2xl hover:bg-red-200 transition-all flex items-center gap-2 font-black text-[10px] uppercase"
                           >
                              <Trash className="w-4 h-4" />
                              Delete {selectedIds.length}
                           </button>
                        )}
                     </div>
                  </div>

                  <div className="space-y-4">
                     {filteredItems.length === 0 ? (
                        <div className="p-32 text-center bg-white rounded-[40px] border border-dashed border-stone-200 text-stone-300">
                           <Database className="w-16 h-16 mx-auto mb-6 opacity-10" />
                           <p className="text-xl font-black uppercase tracking-tighter">No Knowledge Found</p>
                        </div>
                     ) : (
                        filteredItems.map(item => (
                           <div 
                             key={item.id} 
                             className={`bg-white p-8 rounded-[32px] shadow-sm border-2 transition-all flex gap-6 ${
                               selectedIds.includes(item.id) ? 'border-emerald-500 bg-emerald-50/20' : 'border-stone-50 hover:border-emerald-100'
                             }`}
                           >
                              <div className="pt-1">
                                 <button 
                                   onClick={() => setSelectedIds(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id])}
                                   className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                     selectedIds.includes(item.id) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-stone-200'
                                   }`}
                                 >
                                    {selectedIds.includes(item.id) && <Check className="w-4 h-4" />}
                                 </button>
                              </div>
                              <div className="flex-1">
                                 <div className="flex justify-between items-start mb-4">
                                    <div>
                                       <h4 className="text-lg font-black text-stone-900 uppercase tracking-tighter">{item.title}</h4>
                                       <div className="flex flex-wrap gap-2 mt-2">
                                          <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">{item.scope}</span>
                                          {item.fileType && <span className="text-[9px] font-black uppercase tracking-widest bg-blue-100 text-blue-700 px-3 py-1 rounded-full border border-blue-200">{item.fileType.split('/')[1]}</span>}
                                          <span className="text-[9px] font-bold text-stone-400 py-1">{new Date(item.dateAdded).toLocaleDateString()}</span>
                                       </div>
                                    </div>
                                    <div className="flex gap-1">
                                       <button className="p-2 text-stone-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"><Edit3 className="w-5 h-5" /></button>
                                       <button onClick={() => handleDelete(item.id)} className="p-2 text-stone-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                 </div>
                                 <p className="text-sm text-stone-600 line-clamp-3 hover:line-clamp-none transition-all leading-relaxed whitespace-pre-wrap font-medium">
                                    {item.content}
                                 </p>
                              </div>
                           </div>
                        ))
                     )}
                  </div>
               </div>
            </div>
          )}

          {/* VIEW: SETTINGS */}
          {activeTab === 'settings' && (
             <div className="space-y-10 animate-in fade-in duration-500">
                <div className="bg-white p-12 rounded-[48px] shadow-sm border border-stone-100 space-y-10">
                   <h3 className="text-2xl font-black text-stone-950 flex items-center gap-3 uppercase tracking-tighter">
                      <Settings className="w-8 h-8 text-emerald-600" />
                      Global System Settings
                   </h3>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="flex flex-col justify-between p-10 bg-stone-50 rounded-[40px] border border-stone-200 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-10 opacity-5 -translate-y-4 translate-x-4"><ShieldCheck className="w-40 h-40" /></div>
                         <div className="relative z-10">
                            <h4 className="text-sm font-black text-stone-800 uppercase tracking-[0.2em] mb-4">Admin Mode</h4>
                            <p className="text-sm text-stone-500 font-medium leading-relaxed">Activate experimental features and advanced diagnostic tools across the entire platform.</p>
                         </div>
                         <div className="mt-8 flex justify-end relative z-10">
                            <button 
                              onClick={() => {
                                const next = !isAdminModeActive;
                                setIsAdminModeActive(next);
                                localStorage.setItem('ai_rw_admin_active', String(next));
                                showToast(next ? "Admin Mode Active" : "Admin Mode Inactive", "info");
                              }}
                              className={`w-20 h-10 rounded-full transition-all flex items-center px-1.5 ${isAdminModeActive ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-stone-300'}`}
                            >
                               <div className={`w-7 h-7 bg-white rounded-full shadow-md transition-transform ${isAdminModeActive ? 'translate-x-10' : 'translate-x-0'}`}></div>
                            </button>
                         </div>
                      </div>

                      <div className="flex flex-col justify-between p-10 bg-stone-50 rounded-[40px] border border-stone-200 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-10 opacity-5 -translate-y-4 translate-x-4"><Layout className="w-40 h-40" /></div>
                         <div className="relative z-10">
                            <h4 className="text-sm font-black text-stone-800 uppercase tracking-[0.2em] mb-4">Landing Page</h4>
                            <p className="text-sm text-stone-500 font-medium leading-relaxed">Toggle the entry screen. If off, users will go directly to the chat interface.</p>
                         </div>
                         <div className="mt-8 flex justify-end relative z-10">
                            <button 
                              onClick={() => {
                                const next = !isLandingEnabled;
                                setIsLandingEnabled(next);
                                localStorage.setItem('ai_rw_landing_enabled', String(next));
                                showToast("Landing configuration updated!", "success");
                              }}
                              className={`w-20 h-10 rounded-full transition-all flex items-center px-1.5 ${isLandingEnabled ? 'bg-blue-500 shadow-lg shadow-blue-200' : 'bg-stone-300'}`}
                            >
                               <div className={`w-7 h-7 bg-white rounded-full shadow-md transition-transform ${isLandingEnabled ? 'translate-x-10' : 'translate-x-0'}`}></div>
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {/* Fallback views for Training/Testing */}
          {(activeTab === 'train_image' || activeTab === 'train_voice' || activeTab === 'test_image' || activeTab === 'test_voice') && (
            <div className="bg-white p-12 rounded-[48px] shadow-sm border border-stone-100 animate-in fade-in duration-500 min-h-[700px]">
               <div className="flex justify-between items-center mb-10 pb-6 border-b border-stone-50">
                  <h3 className="text-2xl font-black text-stone-950 uppercase tracking-tighter">
                     Sandbox: {activeTab.replace('_', ' ')}
                  </h3>
                  <span className="text-[10px] font-black uppercase bg-stone-100 text-stone-400 px-4 py-1.5 rounded-full border border-stone-200 tracking-widest">Research Module</span>
               </div>
               {activeTab === 'test_image' && <ImageTools />}
               {activeTab === 'test_voice' && <VoiceConversation />}
               {(activeTab === 'train_image' || activeTab === 'train_voice') && (
                 <div className="flex flex-col items-center justify-center py-20 text-center">
                    <FlaskConical className="w-20 h-20 text-emerald-100 mb-6" />
                    <p className="text-xl font-bold text-stone-800">Ubu buryo burimo gutunganywa...</p>
                    <p className="text-stone-500 mt-2 max-w-sm">Icyitegererezo cya mbere cy'uru rupapuro kirimo kwandikwa. Koresha igice cyo "Kugerageza" kugira ngo urebe uko AI ikora.</p>
                 </div>
               )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
};
