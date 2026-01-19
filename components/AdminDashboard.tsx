
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Lock, Plus, Trash2, Database, LogOut, ImageIcon, 
  ChevronRight, Activity, LayoutDashboard, Settings, 
  Mic, TestTube, BarChart, Sliders, Layout, Eye
} from 'lucide-react';
import { Button } from './Button';
import { useToast } from './ToastProvider';
import { 
  saveKnowledgeItem, getKnowledgeItems, 
  deleteKnowledgeItem 
} from '../services/knowledgeService';
import { getVisitStats, getCountryAggregate } from '../services/statsService';
import { 
  KnowledgeItem, KnowledgeScope, DailyStats, CountryStats, ModelConfig, AppView 
} from '../types';
import { ImageTools } from './ImageTools';
import { VoiceConversation } from './VoiceConversation';

type AdminTab = 'dashboard' | 'knowledge' | 'model_config' | 'test_image' | 'test_voice' | 'landing_preview' | 'settings';

const DEFAULT_CONFIG: ModelConfig = {
  systemInstruction: "Wowe uri ai.rw, umufasha w'ubwenge mu Rwanda. Uri impuguke mu bumenyi n'ikoranabuhanga. Ugomba gusubiza mu Kinyarwanda gusa. Komeza ube umunyakuri kandi ushyigikire iterambere ry'u Rwanda. Iyo uvuze izina ryawe, vuga ai.rw.",
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  thinkingBudget: 0
};

interface AdminDashboardProps {
  onNavigate?: (view: AppView) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScope, setFilterScope] = useState<KnowledgeScope | 'ALL_SCOPES'>('ALL_SCOPES');
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
          <div className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] px-4 mb-3">Incamake</div>
          <SidebarItem tab="dashboard" icon={LayoutDashboard} label="Imbonerahamwe" />
          
          <div className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] px-4 mb-3 mt-8">Amakuru yo Kwigisha</div>
          <SidebarItem tab="knowledge" icon={Database} label="Ububiko bw'Amakuru" />
          
          <div className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] px-4 mb-3 mt-8">Gucunga Ahabanza</div>
          <SidebarItem tab="landing_preview" icon={Layout} label="Ahabanza (Preview)" color="amber" />

          <div className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] px-4 mb-3 mt-8">Ibirimo Gutegurwa</div>
          <SidebarItem tab="test_image" icon={ImageIcon} label="Gupima Amafoto" color="indigo" />
          <SidebarItem tab="test_voice" icon={Mic} label="Gupima Ijwi" color="rose" />

          <div className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] px-4 mb-3 mt-8">Sisitemu</div>
          <SidebarItem tab="model_config" icon={Sliders} label="Config & Prompts" color="amber" />
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
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in duration-500">
               <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white p-10 rounded-[40px] shadow-sm border border-stone-200 sticky top-8">
                     <h3 className="text-xl font-black text-stone-950 mb-8 flex items-center gap-3 uppercase tracking-tighter"><Plus className="w-6 h-6 text-emerald-600" />Ongeramo Amakuru</h3>
                     <div className="space-y-6">
                        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Umutwe (Ex: Ubuhinzi)..." className="w-full p-4 bg-stone-50 border-2 border-stone-100 rounded-2xl outline-none font-bold" />
                        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Amakuru rero..." className="w-full h-48 p-4 bg-stone-50 border-2 border-stone-100 rounded-2xl outline-none resize-none" />
                        <Button onClick={handleSaveText} className="w-full py-5 rounded-2xl shadow-xl font-black uppercase tracking-widest">Bika Amakuru</Button>
                     </div>
                  </div>
               </div>
               <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white p-6 rounded-[32px] shadow-sm border border-stone-100 flex gap-4 items-center">
                     <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Shakisha mu kiganiro..." className="flex-1 pl-6 py-4 bg-stone-50 border-2 border-stone-50 rounded-2xl outline-none" />
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

          {activeTab === 'landing_preview' && (
             <div className="animate-in fade-in duration-500 space-y-6">
                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-200 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center"><Eye className="w-6 h-6" /></div>
                      <div>
                         <h3 className="font-black text-amber-950 uppercase tracking-tighter">Ibonekeza rya Ahabanza</h3>
                         <p className="text-sm text-amber-700">Iyi ni porojeti yo hanze abantu babonaga mbere. Kanda buto yo iburyo niba ushaka kuyerekana abantu bose.</p>
                      </div>
                   </div>
                   <Button onClick={() => onNavigate?.(AppView.LANDING)} className="bg-amber-600 hover:bg-amber-700">Fungura Preview</Button>
                </div>
                <div className="rounded-[40px] overflow-hidden border border-stone-200 shadow-2xl h-[600px] bg-white relative">
                   <div className="absolute inset-0 flex items-center justify-center bg-stone-100/50 backdrop-blur-sm z-10">
                      <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-stone-200 max-w-sm">
                         <Layout className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                         <p className="text-stone-600 font-bold">Kanda "Fungura Preview" hejuru kugira ngo ubone imiterere yose ya Ahabanza.</p>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'test_image' && (
             <div className="animate-in fade-in duration-500 bg-white rounded-[40px] p-8 border border-stone-100 shadow-sm">
                <ImageTools />
             </div>
          )}

          {activeTab === 'test_voice' && (
             <div className="animate-in fade-in duration-500 bg-white rounded-[40px] p-8 border border-stone-100 shadow-sm min-h-[600px]">
                <VoiceConversation />
             </div>
          )}
        </div>
      </main>
    </div>
  );
};
