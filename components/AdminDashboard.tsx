
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Lock, Plus, Trash2, Database, LogOut, ImageIcon, 
  ChevronRight, Activity, LayoutDashboard, Settings, 
  Mic, TestTube, BarChart, Sliders, Layout, Eye, BookOpen, Share2,
  Calendar, Users, Upload, FileText, Globe, CheckCircle2, Clock
} from 'lucide-react';
import { Button } from './Button';
import { useToast } from './ToastProvider';
import { 
  saveKnowledgeItem, getKnowledgeItems, 
  deleteKnowledgeItem 
} from '../services/knowledgeService';
import { getVisitStats, getCountryAggregate, getAggregatedStats } from '../services/statsService';
import { 
  KnowledgeItem, KnowledgeScope, DailyStats, CountryStats, ModelConfig, AppView 
} from '../types';
import { ImageTools } from './ImageTools';
import { VoiceConversation } from './VoiceConversation';
import { KinyarwandaLearning } from './KinyarwandaLearning';

type AdminTab = 'dashboard' | 'knowledge' | 'model_config' | 'kinyarwanda_mgmt' | 'test_image' | 'test_voice' | 'landing_preview';

const DEFAULT_CONFIG: ModelConfig = {
  systemInstruction: "Wowe uri ai.rw, umufasha w'ubwenge mu Rwanda. Uri impuguke mu bumenyi n'ikoranabuhanga. Ugomba gusubiza mu Kinyarwanda gusa. Komeza ube umunyakuri kandi ushyigikire iterambere ry'u Rwanda.",
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  thinkingBudget: 0,
  isTwigePublic: false
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
  const [aggregatedStats, setAggregatedStats] = useState<any>(null);
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);
  
  // Knowledge Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [scope, setScope] = useState<KnowledgeScope>('ALL');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    setAggregatedStats(getAggregatedStats());
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
    setTitle(''); setContent(''); setScope('ALL'); loadItems();
    showToast('Amakuru yabitswe kandi azakoreshwa mu gusubiza!', 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate reading file content
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setTitle(file.name);
          setContent(text);
          showToast(`Inyandiko "${file.name}" yafashwe. Kanda Bika kugira ngo ushyiremo.`, 'info');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Gusiba aya makuru?')) {
      deleteKnowledgeItem(id); loadItems();
      showToast('Byasibwe', 'success');
    }
  };

  const handleToggleTwigePublic = () => {
    const newConfig = { ...modelConfig, isTwigePublic: !modelConfig.isTwigePublic };
    setModelConfig(newConfig);
    localStorage.setItem('ai_rw_model_config', JSON.stringify(newConfig));
    showToast(newConfig.isTwigePublic ? 'Twige Ikinyarwanda yagiye hanze!' : 'Twige Ikinyarwanda yakuweho.', 'success');
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

  const scopeOptions: { value: KnowledgeScope; label: string }[] = [
    { value: 'ALL', label: 'Ahantu hose (Global)' },
    { value: 'CHAT', label: 'Ikiganiro (Chat)' },
    { value: 'LEARN_KINYARWANDA', label: 'Twige Ikinyarwanda' },
    { value: 'RURAL', label: 'Iterambere (Rural)' },
    { value: 'BUSINESS', label: 'Umujyanama (Business)' },
    { value: 'COURSE', label: 'Amasomo (Courses)' }
  ];

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
        <nav className="flex-1 p-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] px-4 mb-3">Incamake</div>
          <SidebarItem tab="dashboard" icon={LayoutDashboard} label="Imbonerahamwe" />
          
          <div className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] px-4 mb-3 mt-8">Guhugura AI (Training)</div>
          <SidebarItem tab="knowledge" icon={Database} label="Ububiko & Hugura" />
          
          <div className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] px-4 mb-3 mt-8">Ibirimo & Ururimi</div>
          <SidebarItem tab="kinyarwanda_mgmt" icon={BookOpen} label="Twige Ikinyarwanda" color="emerald" />
          <SidebarItem tab="landing_preview" icon={Layout} label="Ahabanza" color="amber" />

          <div className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] px-4 mb-3 mt-8">Ibigeragezwa</div>
          <SidebarItem tab="test_image" icon={ImageIcon} label="Gupima Amafoto" color="indigo" />
          <SidebarItem tab="test_voice" icon={Mic} label="Gupima Ijwi" color="rose" />

          <div className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] px-4 mb-3 mt-8">Config</div>
          <SidebarItem tab="model_config" icon={Sliders} label="Igenamiterere rya AI" color="amber" />
        </nav>
        <div className="p-6 border-t border-stone-100 bg-stone-50/50">
          <button onClick={() => setIsAuthenticated(false)} className="w-full flex items-center justify-center gap-2 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all text-xs font-black uppercase tracking-widest"><LogOut className="w-4 h-4" />Sohoka</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col relative custom-scrollbar">
        <div className="p-6 md:p-12 max-w-7xl mx-auto w-full space-y-10">
          
          {activeTab === 'dashboard' && aggregatedStats && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black text-emerald-950 uppercase tracking-tighter">Imbonerahamwe y'Abasura</h2>
                  <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Amakuru yaherutse kuvugururwa ubu
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  {[
                    { label: 'Uyu munsi', val: aggregatedStats.today, icon: Calendar, color: 'blue' },
                    { label: 'Iki Cyumweru', val: aggregatedStats.week, icon: Users, color: 'emerald' },
                    { label: 'Uku Kwezi', val: aggregatedStats.month, icon: BarChart, color: 'amber' },
                    { label: 'Uyu Mwaka', val: aggregatedStats.year, icon: Globe, color: 'indigo' },
                    { label: 'Abasuye Bose', val: aggregatedStats.total, icon: Activity, color: 'rose' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[32px] shadow-sm border border-stone-200 group hover:border-emerald-200 transition-all">
                       <div className={`w-12 h-12 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}><stat.icon className="w-6 h-6" /></div>
                       <div className="text-4xl font-black text-stone-900 tracking-tighter">{stat.val.toLocaleString()}</div>
                       <div className="text-[10px] text-stone-400 font-black uppercase tracking-widest mt-1">{stat.label}</div>
                    </div>
                  ))}
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white rounded-[40px] border border-stone-200 p-10 shadow-sm">
                    <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest mb-8 flex items-center gap-2"><BarChart className="w-5 h-5 text-emerald-600" /> Imiterere y'Abasura (Last 30 Days)</h3>
                    <div className="h-64 flex items-end gap-1.5 w-full pb-4 border-b border-stone-50">
                       {visitStats.slice(0, 30).reverse().map((day, i) => {
                         const max = Math.max(...visitStats.map(s => s.count), 1);
                         const h = (day.count / max) * 100;
                         return (
                           <div key={i} className="flex-1 bg-emerald-100 hover:bg-emerald-500 rounded-t-sm transition-all group relative cursor-help" style={{ height: `${Math.max(h, 5)}%` }}>
                              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-emerald-950 text-white text-[8px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                {day.count} visits ({day.date})
                              </div>
                           </div>
                         );
                       })}
                    </div>
                  </div>

                  <div className="bg-white rounded-[40px] border border-stone-200 p-10 shadow-sm overflow-hidden">
                    <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest mb-8 flex items-center gap-2"><Globe className="w-5 h-5 text-emerald-600" /> Abasura ku bihugu</h3>
                    <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar">
                       {countryStats.map(c => (
                         <div key={c.code} className="flex items-center justify-between p-3 rounded-2xl hover:bg-stone-50 transition-colors">
                            <div className="flex items-center gap-3">
                               <span className="text-2xl">{c.flag}</span>
                               <span className="text-sm font-bold text-stone-700">{c.name}</span>
                            </div>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black">{c.count}</span>
                         </div>
                       ))}
                    </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in duration-500">
               <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white p-10 rounded-[40px] shadow-sm border border-stone-200 sticky top-8">
                     <h3 className="text-xl font-black text-stone-950 mb-8 flex items-center gap-3 uppercase tracking-tighter">
                        <Plus className="w-6 h-6 text-emerald-600" /> Hugura AI (Train)
                     </h3>
                     
                     <div className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">1. Hitamo aho amakuru akoreshwa</label>
                           <div className="grid grid-cols-1 gap-1.5">
                              {scopeOptions.map(opt => (
                                <button 
                                  key={opt.value} 
                                  onClick={() => setScope(opt.value)}
                                  className={`p-3 rounded-xl text-xs font-bold text-left border-2 transition-all ${
                                    scope === opt.value ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-stone-50 border-stone-50 text-stone-500 hover:border-emerald-200'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2">2. Injiza amakuru (Inyandiko cyangwa File)</label>
                           <div className="flex flex-col gap-3">
                              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Umutwe w'inyandiko..." className="w-full p-4 bg-stone-50 border-2 border-stone-100 rounded-2xl outline-none font-bold" />
                              <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Andika amakuru aha, cyangwa uhitemo inyandiko hepfo..." className="w-full h-48 p-4 bg-stone-50 border-2 border-stone-100 rounded-2xl outline-none resize-none custom-scrollbar" />
                              
                              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt,.md,.json" className="hidden" />
                              <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-stone-200 rounded-2xl text-stone-400 hover:bg-stone-50 hover:border-emerald-200 hover:text-emerald-600 transition-all text-xs font-bold"
                              >
                                 <Upload className="w-4 h-4" /> Hitamo Inyandiko (.txt, .md)
                              </button>
                           </div>
                        </div>

                        <Button onClick={handleSaveText} className="w-full py-5 rounded-2xl shadow-xl font-black uppercase tracking-widest">
                           Hugura AI ubu
                        </Button>

                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                           <Activity className="w-5 h-5 text-blue-500 shrink-0" />
                           <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                              Aya makuru ashyirwa mu rurimi rwa AI kugira ngo ajye yifashishwa mu gusubiza abantu mu buryo bwimbitse kandi nyabo.
                           </p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white p-6 rounded-[32px] shadow-sm border border-stone-100 flex flex-wrap gap-4 items-center">
                     <div className="flex-1 min-w-[200px] relative">
                        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Shakisha mu bubiko..." className="w-full pl-12 pr-6 py-4 bg-stone-50 border-2 border-stone-50 rounded-2xl outline-none" />
                        <Database className="w-5 h-5 text-stone-300 absolute left-4 top-1/2 -translate-y-1/2" />
                     </div>
                     <select 
                       value={filterScope} 
                       onChange={e => setFilterScope(e.target.value as any)} 
                       className="p-4 bg-stone-50 border-2 border-stone-50 rounded-2xl outline-none text-xs font-bold text-stone-600"
                     >
                        <option value="ALL_SCOPES">Ahantu Hose</option>
                        {scopeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                     </select>
                  </div>

                  <div className="space-y-4">
                     {filteredItems.length === 0 ? (
                        <div className="bg-white p-20 rounded-[40px] text-center border border-dashed border-stone-200">
                           <Database className="w-16 h-16 text-stone-200 mx-auto mb-4" />
                           <p className="text-stone-400 font-bold">Nta makuru yabonetse hano.</p>
                        </div>
                     ) : (
                        filteredItems.map(item => (
                           <div key={item.id} className="bg-white p-8 rounded-[32px] shadow-sm border-2 border-stone-50 flex flex-col gap-6 group hover:border-emerald-200 transition-all">
                              <div className="flex justify-between items-start">
                                 <div className="space-y-1">
                                    <h4 className="text-lg font-black text-stone-900 uppercase tracking-tighter flex items-center gap-2">
                                       <FileText className="w-5 h-5 text-emerald-600" />
                                       {item.title}
                                    </h4>
                                    <div className="flex items-center gap-3">
                                       <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                                          {scopeOptions.find(o => o.value === item.scope)?.label || item.scope}
                                       </span>
                                       <span className="text-[10px] text-stone-400 font-medium flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Huguwe ku wa: {new Date(item.dateAdded).toLocaleDateString()}
                                       </span>
                                    </div>
                                 </div>
                                 <button onClick={() => handleDelete(item.id)} className="p-3 text-stone-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                              </div>
                              <p className="text-sm text-stone-600 leading-relaxed line-clamp-4 bg-stone-50 p-4 rounded-2xl border border-stone-100 italic">
                                 {item.content}
                              </p>
                           </div>
                        ))
                     )}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'kinyarwanda_mgmt' && (
             <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-emerald-50 p-8 rounded-[40px] border border-emerald-100 flex items-center justify-between shadow-sm">
                   <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 ${modelConfig.isTwigePublic ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-600'} rounded-3xl flex items-center justify-center transition-all shadow-lg`}>
                         <Share2 className="w-8 h-8" />
                      </div>
                      <div>
                         <h3 className="text-2xl font-black text-emerald-950 uppercase tracking-tighter">Ibonekera rya Twige Ikinyarwanda</h3>
                         <p className="text-emerald-700 font-medium max-w-md">Kanda kuri buto yo iburyo niba ushaka ko iri tabu rugaragara kuri buri muntu wese ukoresha ai.rw.</p>
                      </div>
                   </div>
                   <button 
                     onClick={handleToggleTwigePublic}
                     className={`px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-xl ${
                       modelConfig.isTwigePublic 
                         ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20' 
                         : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                     }`}
                   >
                      {modelConfig.isTwigePublic ? 'Kuramo (Public OFF)' : 'Shyira Hanze (Public ON)'}
                   </button>
                </div>

                <div className="bg-white rounded-[40px] border border-stone-100 shadow-sm p-8">
                   <div className="mb-8 border-b border-stone-100 pb-6 flex items-center justify-between">
                      <h4 className="text-lg font-black text-stone-400 uppercase tracking-widest flex items-center gap-2">
                         <Eye className="w-5 h-5" /> Ibonekeza (Preview)
                      </h4>
                      <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                         Admin View Only
                      </div>
                   </div>
                   <div className="max-h-[800px] overflow-y-auto rounded-3xl border border-stone-50 bg-slate-50/30 custom-scrollbar">
                      <KinyarwandaLearning />
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
                         <h3 className="font-black text-amber-950 uppercase tracking-tighter">Ahabanza (Preview)</h3>
                         <p className="text-sm text-amber-700">Iyi ni porojeti yo hanze abantu babonaga mbere. Reba imiterere yayo ubu.</p>
                      </div>
                   </div>
                   <Button onClick={() => onNavigate?.(AppView.LANDING)} className="bg-amber-600 hover:bg-amber-700 px-8">Fungura Ahabanza</Button>
                </div>
                <div className="rounded-[40px] overflow-hidden border border-stone-200 shadow-2xl h-[600px] bg-white relative">
                   <div className="absolute inset-0 flex items-center justify-center bg-stone-100/50 backdrop-blur-sm z-10 text-center p-8">
                      <div className="max-w-sm space-y-4">
                        <Layout className="w-16 h-16 text-stone-200 mx-auto" />
                        <p className="text-stone-400 font-bold">Kanda "Fungura Ahabanza" hejuru kugira ngo ubone imiterere yose ya Ahabanza mu ruhame.</p>
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

          {activeTab === 'model_config' && (
             <div className="max-w-3xl space-y-8 animate-in fade-in duration-500">
                <div className="bg-white p-10 rounded-[40px] shadow-sm border border-stone-200">
                   <h3 className="text-xl font-black text-stone-950 mb-8 uppercase tracking-tighter flex items-center gap-3">
                      <Sliders className="w-6 h-6 text-emerald-600" /> Igenamiterere rya AI
                   </h3>
                   <div className="space-y-8">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Amabwiriza y'ibanze (System Instruction)</label>
                         <textarea 
                           value={modelConfig.systemInstruction} 
                           onChange={e => setModelConfig({...modelConfig, systemInstruction: e.target.value})}
                           className="w-full h-48 p-5 bg-stone-50 border-2 border-stone-100 rounded-2xl outline-none text-sm font-medium focus:border-emerald-500 transition-colors resize-none"
                         />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Temperature ({modelConfig.temperature})</label>
                           <input type="range" min="0" max="2" step="0.1" value={modelConfig.temperature} onChange={e => setModelConfig({...modelConfig, temperature: parseFloat(e.target.value)})} className="w-full h-2 bg-emerald-100 rounded-full appearance-none cursor-pointer accent-emerald-600" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Top P ({modelConfig.topP})</label>
                           <input type="range" min="0" max="1" step="0.05" value={modelConfig.topP} onChange={e => setModelConfig({...modelConfig, topP: parseFloat(e.target.value)})} className="w-full h-2 bg-emerald-100 rounded-full appearance-none cursor-pointer accent-emerald-600" />
                        </div>
                      </div>
                      <Button 
                        onClick={() => {
                          localStorage.setItem('ai_rw_model_config', JSON.stringify(modelConfig));
                          showToast('Config yabitswe!', 'success');
                        }}
                        className="w-full py-5 rounded-2xl shadow-xl font-black uppercase tracking-widest"
                      >
                         Bika Igenamiterere
                      </Button>
                   </div>
                </div>
             </div>
          )}
        </div>
      </main>
    </div>
  );
};
