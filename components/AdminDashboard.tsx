
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Lock, Plus, Trash2, Database, Save, LogOut, ImageIcon, 
  FileText, X, AlertCircle, BarChart, Sprout, 
  Mic, Activity, ChevronRight, Filter,
  Volume2, Info, Eye, EyeOff, Layout, ShieldCheck, Upload, FileJson, 
  FileSearch, History, Sliders, Zap, Check, Edit3, Trash, Music, Settings, LayoutDashboard, BrainCircuit, FlaskConical, Headphones, TestTube, Microscope
} from 'lucide-react';
import { Button } from './Button';
import { useToast } from './ToastProvider';
import { 
  saveKnowledgeItem, saveBulkKnowledgeItems, getKnowledgeItems, 
  deleteKnowledgeItem, deleteBulkKnowledgeItems 
} from '../services/knowledgeService';
import { getVisitStats, getCountryAggregate } from '../services/statsService';
import { 
  KnowledgeItem, KnowledgeScope, DailyStats, CountryStats, ModelConfig 
} from '../types';
import { ImageTools } from './ImageTools';
import { VoiceConversation } from './VoiceConversation';
import { FormattedText } from './FormattedText';

type AdminTab = 'dashboard' | 'knowledge' | 'documents' | 'model_config' | 'test_image' | 'test_voice' | 'settings';

const DEFAULT_CONFIG: ModelConfig = {
  systemInstruction: "Wowe uri ai.rw, umufasha w'ubwenge mu Rwanda. Uri impuguke mu bumenyi n'ikoranabuhanga. Ugomba gusubiza mu Kinyarwanda gusa. Komeza ube umunyakuri kandi ushyigikire iterambere ry'u Rwanda. Iyo uvuze izina ryawe, vuga ai.rw.",
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
  const [modelConfig, setModelConfig] = useState<ModelConfig>(DEFAULT_CONFIG);
  const [visitStats, setVisitStats] = useState<DailyStats[]>([]);
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [scope, setScope] = useState<KnowledgeScope>('ALL');
  const { showToast } = useToast();

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesScope = filterScope === 'ALL_SCOPES' || item.scope === filterScope;
      return matchesSearch && matchesScope;
    });
  }, [items, searchQuery, filterScope]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
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

  const SidebarItem = ({ tab, icon: Icon, label, color = 'emerald' }: { tab: AdminTab, icon: any, label: string, color?: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        activeTab === tab ? `bg-${color}-600 text-white shadow-md` : `text-stone-500 hover:bg-${color}-50 hover:text-${color}-700`
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
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ijambo ry'ibanga..." className="w-full p-4 border-2 border-emerald-50 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-center text-lg font-bold" autoFocus />
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
             <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Settings className="w-6 h-6" /></div>
             <div><h1 className="text-lg font-black text-emerald-950 tracking-tighter uppercase">ai.rw</h1><p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Igenamiterere</p></div>
          </div>
        </div>
        <nav className="flex-1 p-6 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] px-4 mb-3">Dashboard</div>
          <SidebarItem tab="dashboard" icon={LayoutDashboard} label="Imbonerahamwe" />
          <div className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] px-4 mb-3 mt-8">Amakuru yo Kwigisha</div>
          <SidebarItem tab="knowledge" icon={Database} label="Ububiko bw'Amakuru" />
          <SidebarItem tab="documents" icon={Upload} label="Inyandiko (Bulk)" color="blue" />
          
          <div className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] px-4 mb-3 mt-8">Ibirimo Gutegurwa</div>
          <SidebarItem tab="test_image" icon={ImageIcon} label="Gupima Amafoto" color="indigo" />
          <SidebarItem tab="test_voice" icon={Mic} label="Gupima Ijwi" color="rose" />

          <div className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] px-4 mb-3 mt-8">Sisitemu</div>
          <SidebarItem tab="model_config" icon={Sliders} label="Config & Prompts" color="amber" />
          <SidebarItem tab="settings" icon={Settings} label="Igenamiterere" />
        </nav>
        <div className="p-6 border-t border-stone-100 bg-stone-50/50">
          <button onClick={() => setIsAuthenticated(false)} className="w-full flex items-center justify-center gap-2 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all text-xs font-black uppercase tracking-widest"><LogOut className="w-4 h-4" />Sohoka</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col relative">
        <div className="p-6 md:p-12 max-w-7xl mx-auto w-full space-y-10">
          {activeTab === 'dashboard' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200">
                     <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4"><Activity className="w-6 h-6" /></div>
                     <div className="text-3xl font-black text-stone-900 tracking-tighter">{visitStats.reduce((a, c) => a + c.count, 0)}</div>
                     <div className="text-[10px] text-stone-400 font-black uppercase tracking-widest mt-1">Abasuye bose</div>
                  </div>
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200">
                     <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4"><Database className="w-6 h-6" /></div>
                     <div className="text-3xl font-black text-stone-900 tracking-tighter">{items.length}</div>
                     <div className="text-[10px] text-stone-400 font-black uppercase tracking-widest mt-1">Amakuru ahari</div>
                  </div>
               </div>
               <div className="bg-white p-10 rounded-[40px] shadow-sm border border-stone-100">
                  <h3 className="text-xl font-black text-emerald-950 mb-8 uppercase tracking-tighter flex items-center gap-3"><BarChart className="w-6 h-6 text-emerald-600" />Analytics y'Ikoreshwa</h3>
                  <div className="h-64 flex items-end gap-3 border-b border-stone-100 pb-4">
                     {visitStats.slice(0, 10).reverse().map((day, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                           <div className="w-full bg-emerald-500/80 rounded-xl transition-all hover:bg-emerald-500" style={{ height: `${(day.count / Math.max(...visitStats.map(d => d.count), 1)) * 100}%`, minHeight: '8px' }}></div>
                           <div className="text-[9px] text-stone-400 font-black uppercase tracking-widest truncate w-full text-center">{new Date(day.date).toLocaleDateString(undefined, {weekday: 'short'})}</div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in duration-500">
               <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white p-10 rounded-[40px] shadow-sm border border-stone-200 sticky top-8">
                     <h3 className="text-xl font-black text-stone-950 mb-8 flex items-center gap-3 uppercase tracking-tighter"><Plus className="w-6 h-6 text-emerald-600" />Ongeramo Amakuru</h3>
                     <div className="space-y-6">
                        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Umutwe (Ex: Ubuhinzi)..." className="w-full p-4 bg-stone-50 border-2 border-stone-100 rounded-2xl outline-none font-bold" />
                        <select value={scope} onChange={e => setScope(e.target.value as KnowledgeScope)} className="w-full p-4 bg-stone-50 border-2 border-stone-100 rounded-2xl outline-none font-bold">
                           <option value="ALL">Global (Hose)</option>
                           <option value="CHAT">Chat</option>
                           <option value="RURAL">Rural</option>
                           <option value="BUSINESS">Business</option>
                        </select>
                        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Amakuru rero..." className="w-full h-48 p-4 bg-stone-50 border-2 border-stone-100 rounded-2xl outline-none resize-none" />
                        <Button onClick={handleSaveText} className="w-full py-5 rounded-2xl shadow-xl font-black uppercase tracking-widest">Bika Amakuru</Button>
                     </div>
                  </div>
               </div>
               <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white p-6 rounded-[32px] shadow-sm border border-stone-100 flex gap-4 items-center">
                     <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Shakisha mu bubiko..." className="flex-1 pl-6 py-4 bg-stone-50 border-2 border-stone-50 rounded-2xl outline-none" />
                  </div>
                  <div className="space-y-4">
                     {filteredItems.map(item => (
                        <div key={item.id} className="bg-white p-8 rounded-[32px] shadow-sm border-2 border-stone-50 flex gap-6">
                           <div className="flex-1">
                              <h4 className="text-lg font-black text-stone-900 uppercase tracking-tighter">{item.title}</h4>
                              <p className="text-sm text-stone-600 mt-2">{item.content}</p>
                              <div className="mt-4 flex gap-2"><button onClick={() => handleDelete(item.id)} className="p-2 text-stone-300 hover:text-red-600"><Trash2 className="w-5 h-5" /></button></div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'test_image' && (
             <div className="animate-in fade-in duration-500 bg-white rounded-[40px] p-8 border border-stone-100 shadow-sm">
                <div className="mb-6 flex items-center gap-3 border-b border-stone-100 pb-4">
                   <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center"><TestTube className="w-6 h-6" /></div>
                   <div>
                      <h3 className="text-xl font-black text-stone-900 uppercase tracking-tighter">Sandbox: Amafoto</h3>
                      <p className="text-sm text-stone-500 font-medium">Irebere uko gusesengura no guhanga amafoto bikora mbere yo kubishyira hanze.</p>
                   </div>
                </div>
                <ImageTools />
             </div>
          )}

          {activeTab === 'test_voice' && (
             <div className="animate-in fade-in duration-500 bg-white rounded-[40px] p-8 border border-stone-100 shadow-sm min-h-[600px]">
                <div className="mb-6 flex items-center gap-3 border-b border-stone-100 pb-4">
                   <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center"><Mic className="w-6 h-6" /></div>
                   <div>
                      <h3 className="text-xl font-black text-stone-900 uppercase tracking-tighter">Sandbox: Ijwi (Voice)</h3>
                      <p className="text-sm text-stone-500 font-medium">Pima ikiganiro cy'ijwi mu Kinyarwanda hano.</p>
                   </div>
                </div>
                <VoiceConversation />
             </div>
          )}
        </div>
      </main>
    </div>
  );
};
