
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Lock, Plus, Trash2, Database, LogOut, ImageIcon, 
  ChevronRight, Activity, LayoutDashboard, Settings, 
  Mic, TestTube, BarChart, Sliders, Layout, Eye, BookOpen, Share2,
  Calendar, Users, Upload, FileText, Globe, CheckCircle2, Clock, Search,
  Sparkles, GraduationCap, Sprout, TrendingUp, AudioLines, MessageCircle,
  Filter, Info, ShieldCheck, Zap, AlertCircle, Download, RefreshCw, HardDrive, Save,
  Brain, ZapOff, RotateCcw, Hash, Target, ToggleLeft, ToggleRight,
  Sticker, Languages, MessageSquare
} from 'lucide-react';
import { Button } from './Button';
import { useToast } from './ToastProvider';
import { 
  saveKnowledgeItem, getKnowledgeItems, 
  deleteKnowledgeItem, clearAllKnowledge,
  exportKnowledgeBase, importKnowledgeBase
} from '../services/knowledgeService';
import { getVisitStats, getCountryAggregate, getAggregatedStats } from '../services/statsService';
import { 
  KnowledgeItem, KnowledgeScope, DailyStats, CountryStats, ModelConfig, AppView 
} from '../types';
import { ImageTools } from './ImageTools';
import { VoiceConversation } from './VoiceConversation';
import { KinyarwandaLearning } from './KinyarwandaLearning';
import { LandingPage } from './LandingPage';

type AdminTab = 'dashboard' | 'training_lab' | 'model_config' | 'kinyarwanda_mgmt' | 'test_bench';

const DEFAULT_CONFIG: ModelConfig = {
  systemInstruction: "Wowe uri ai.rw, umufasha w'ubwenge mu Rwanda. Uri impuguke mu bumenyi n'ikoranabuhanga. Ugomba gusubiza mu Kinyarwanda gusa. Komeza ube umunyakuri kandi ushyigikire iterambere ry'u Rwanda.",
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  thinkingBudget: 0,
  maxOutputTokens: 2048,
  seed: 42,
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
  const [aggregatedStats, setAggregatedStats] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Knowledge Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [scope, setScope] = useState<KnowledgeScope>('ALL');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  
  const { showToast } = useToast();

  const scopeOptions: { value: KnowledgeScope; label: string, desc: string, icon: any, color: string, category: string }[] = [
    { value: 'GRAMMAR', label: 'Imyandikire (Grammar)', desc: 'Amategeko y\'imyandikire n\'ikibonezamvugo', icon: FileText, color: 'blue', category: 'Linguistic' },
    { value: 'VOCABULARY', label: 'Amagambo (Vocab)', desc: 'Inyito n\'ubusobanuro bw\'amagambo mashya', icon: Sticker, color: 'indigo', category: 'Linguistic' },
    { value: 'ALL', label: 'Ahantu hose (Global)', desc: 'Amabwiriza rusange areba serivisi zose', icon: Globe, color: 'emerald', category: 'General' },
    { value: 'CHAT', label: 'Ikiganiro (Chat)', desc: 'Guhugura uburyo AI iganira n\'abantu', icon: MessageCircle, color: 'blue', category: 'Interface' },
    { value: 'LEARN_KINYARWANDA', label: 'Twige Kinyarwanda', desc: 'Content y\'isomero n\'amateka', icon: BookOpen, color: 'emerald', category: 'Interface' },
    { value: 'RURAL', label: 'Iterambere (Rural)', desc: 'Inama z\'ubuhinzi n\'ubworozi', icon: Sprout, color: 'green', category: 'Sector' },
    { value: 'BUSINESS', label: 'Umujyanama (Business)', desc: 'Isesengurwa ry\'imishinga n\'ishoramari', icon: TrendingUp, color: 'amber', category: 'Sector' },
    { value: 'VOICE_TRAINING', label: 'Amajwi (Voice)', desc: 'Imivugire nyayo n\'uburyo AI yumva', icon: Mic, color: 'rose', category: 'Engine' },
    { value: 'IMAGE_TOOLS', label: 'Amafoto (Vision)', desc: 'Guhugura AI kusesengura amafoto', icon: ImageIcon, color: 'purple', category: 'Engine' }
  ];

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
      if (storedConfig) {
        try {
          const parsed = JSON.parse(storedConfig);
          setModelConfig({ ...DEFAULT_CONFIG, ...parsed });
        } catch (e) {
          setModelConfig(DEFAULT_CONFIG);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadItems();
      setAggregatedStats(getAggregatedStats());
    }
  }, [isAuthenticated]);

  const loadItems = () => setItems(getKnowledgeItems());

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin2026') {
      setIsAuthenticated(true);
      showToast('Murakaza neza mu buyobozi bwa ai.rw', 'success');
    } else {
      showToast('Ijambo ry\'ibanga ntiryo', 'error');
    }
  };

  const handleSaveTraining = () => {
    if (!title.trim() || !content.trim()) return showToast('Uzuza imyanya yose mbere yo guhugura AI', 'error');
    setIsSaving(true);
    setTimeout(() => {
      saveKnowledgeItem({ title, content, scope });
      setTitle(''); setContent(''); setScope('ALL'); loadItems();
      setIsSaving(false);
      showToast(`Amahugurwa yabitswe neza mu rwego rwa: ${scopeOptions.find(o => o.value === scope)?.label}!`, 'success');
    }, 600);
  };

  const handleDelete = (id: string) => {
    if (confirm('Gusiba aya makuru y\'amahugurwa? AI ntabwo izongera kuyakoresha.')) {
      deleteKnowledgeItem(id); loadItems();
      showToast('Byasibwe mu bubiko bw\'ubumenyi.', 'success');
    }
  };

  const saveConfig = () => {
    localStorage.setItem('ai_rw_model_config', JSON.stringify(modelConfig));
    showToast('Configuration Saved!', 'success');
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
             <div><h1 className="text-lg font-black text-emerald-950 tracking-tighter uppercase">ai.rw</h1><p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Buyobozi</p></div>
          </div>
        </div>
        <nav className="flex-1 p-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] font-black text-stone-300 uppercase tracking-widest px-4 mb-2">Imbonerahamwe</div>
          <SidebarItem tab="dashboard" icon={LayoutDashboard} label="Dashboard" />
          
          <div className="text-[10px] font-black text-stone-300 uppercase tracking-widest px-4 mb-2 mt-8">Training Center</div>
          <SidebarItem tab="training_lab" icon={Brain} label="Training Lab" color="emerald" />
          <SidebarItem tab="kinyarwanda_mgmt" icon={BookOpen} label="Learning Portal" color="emerald" />
          
          <div className="text-[10px] font-black text-stone-300 uppercase tracking-widest px-4 mb-2 mt-8">Test & Config</div>
          <SidebarItem tab="test_bench" icon={TestTube} label="Test Bench" color="indigo" />
          <SidebarItem tab="model_config" icon={Sliders} label="Engine Config" color="amber" />
        </nav>
        <div className="p-6 border-t border-stone-100 bg-stone-50/50">
          <button onClick={() => setIsAuthenticated(false)} className="w-full flex items-center justify-center gap-2 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all text-xs font-black uppercase tracking-widest"><LogOut className="w-4 h-4" />Sohoka</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col relative custom-scrollbar bg-slate-50/30">
        <div className="p-6 md:p-12 max-w-7xl mx-auto w-full space-y-10">
          
          {activeTab === 'dashboard' && aggregatedStats && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black text-emerald-950 uppercase tracking-tighter">Incamake y'Imibare</h2>
                  <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black border border-emerald-100 uppercase tracking-widest">Live Stats</div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Uyu munsi', val: aggregatedStats.today, icon: Calendar, color: 'blue' },
                    { label: 'Iki Cyumweru', val: aggregatedStats.week, icon: Users, color: 'emerald' },
                    { label: 'Uku Kwezi', val: aggregatedStats.month, icon: BarChart, color: 'amber' },
                    { label: 'Abasuye Bose', val: aggregatedStats.total, icon: Activity, color: 'rose' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[32px] shadow-sm border border-stone-200 group hover:border-emerald-200 transition-all">
                       <div className={`w-12 h-12 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}><stat.icon className="w-6 h-6" /></div>
                       <div className="text-4xl font-black text-stone-900 tracking-tighter">{stat.val.toLocaleString()}</div>
                       <div className="text-[10px] text-stone-400 font-black uppercase tracking-widest mt-1">{stat.label}</div>
                    </div>
                  ))}
               </div>

               <div className="bg-emerald-950 rounded-[48px] p-12 text-white relative overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 rwanda-pattern opacity-10"></div>
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4">
                      <h3 className="text-2xl font-black uppercase tracking-tighter">System Health</h3>
                      <p className="text-emerald-100/70 max-w-md">ai.rw engine is operating normally. Linguistic models are being updated in real-time based on Training Lab rules.</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="px-6 py-4 bg-white/10 rounded-3xl border border-white/10 text-center">
                        <div className="text-2xl font-black text-emerald-400">100%</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Uptime</div>
                      </div>
                      <div className="px-6 py-4 bg-white/10 rounded-3xl border border-white/10 text-center">
                        <div className="text-2xl font-black text-emerald-400">{items.length}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Rules Active</div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'training_lab' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="flex items-center justify-between border-b border-stone-200 pb-6">
                  <div>
                    <h2 className="text-3xl font-black text-emerald-950 uppercase tracking-tighter">Training Lab</h2>
                    <p className="text-stone-500 font-medium mt-1">Guhugura AI ku myandikire, amategeko y'ururimi, n'ubumenyi bw'ingenzi.</p>
                  </div>
                  <div className="flex gap-3">
                     <button onClick={() => importKnowledgeBase([])} className="px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-stone-600 hover:border-red-300 hover:bg-red-50 transition-all flex items-center gap-2"><Trash2 className="w-4 h-4" /> Reset</button>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-1 space-y-6">
                     <div className="bg-white p-10 rounded-[40px] shadow-sm border border-stone-200 sticky top-8">
                        <div className="flex items-center gap-3 mb-8">
                           <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Brain className="w-6 h-6" /></div>
                           <div><h3 className="text-xl font-black text-stone-950 uppercase tracking-tighter leading-none">Train AI</h3><p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Inject Rules & Logic</p></div>
                        </div>
                        
                        <div className="space-y-6">
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2 flex items-center gap-2"><Languages className="w-3 h-3" /> Category</label>
                              <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                 {scopeOptions.map(opt => (
                                   <button key={opt.value} onClick={() => setScope(opt.value)} className={`group p-4 rounded-2xl text-left border-2 transition-all relative overflow-hidden ${scope === opt.value ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-stone-50 border-stone-50 text-stone-500 hover:border-emerald-200 hover:bg-white'}`}>
                                      <div className="flex items-center gap-4 relative z-10">
                                         <opt.icon className={`w-5 h-5 ${scope === opt.value ? 'text-white' : `text-${opt.color}-500 group-hover:scale-110 transition-transform`}`} />
                                         <div>
                                            <div className="text-[10px] font-black uppercase tracking-tighter leading-none mb-1 opacity-60">{opt.category}</div>
                                            <div className="text-xs font-black uppercase tracking-tighter leading-none mb-1">{opt.label}</div>
                                            <div className={`text-[9px] font-medium leading-tight ${scope === opt.value ? 'text-emerald-100' : 'text-stone-400'}`}>{opt.desc}</div>
                                         </div>
                                      </div>
                                   </button>
                                 ))}
                              </div>
                           </div>

                           <div className="space-y-4 pt-4 border-t border-stone-100">
                              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-2 flex items-center gap-2"><FileText className="w-3 h-3" /> Rule Details</label>
                              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Umutwe w'itegeko (e.g. Imyandikire y'Inyandiko)" className="w-full p-4 bg-stone-50 border-2 border-stone-100 rounded-2xl outline-none font-bold focus:border-emerald-500 transition-colors text-sm" />
                              <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Soma itegeko rigomba gukurikizwa... (e.g. Ntugasubize muri make, koresha amagambo arambuye)" className="w-full h-40 p-5 bg-stone-50 border-2 border-stone-100 rounded-2xl outline-none resize-none focus:border-emerald-500 transition-colors text-sm leading-relaxed" />
                              <Button onClick={handleSaveTraining} isLoading={isSaving} className="w-full py-5 rounded-3xl shadow-2xl shadow-emerald-600/20 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3">Kubika Itandukaniro</Button>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="lg:col-span-2 space-y-8">
                     <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-6 rounded-[32px] shadow-sm border border-stone-100">
                        <div className="flex-1 relative w-full"><Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Shakisha amategeko..." className="w-full pl-14 pr-6 py-4 bg-stone-50 border-2 border-stone-50 rounded-2xl outline-none focus:border-emerald-500 transition-colors text-sm font-medium" /></div>
                        <div className="flex items-center gap-4">
                           <div className="flex items-center gap-2 bg-stone-100/50 px-4 py-2 rounded-2xl border border-stone-100">
                              <Filter className="w-4 h-4 text-stone-400" />
                              <select value={filterScope} onChange={(e) => setFilterScope(e.target.value as any)} className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-stone-600 cursor-pointer">
                                 <option value="ALL_SCOPES">Zose</option>
                                 {scopeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 gap-6">
                        {filteredItems.length === 0 ? (
                           <div className="p-24 bg-white rounded-[48px] border-2 border-dashed border-stone-100 flex flex-col items-center justify-center text-stone-300 text-center">
                              <Database className="w-20 h-20 mb-6 opacity-10" />
                              <p className="font-black uppercase tracking-[0.2em] text-sm text-stone-400">Nta mategeko y'amahugurwa arahari</p>
                           </div>
                        ) : (
                           filteredItems.map(item => (
                              <div key={item.id} className="bg-white p-8 rounded-[40px] shadow-sm border border-stone-100 group hover:border-emerald-200 transition-all relative overflow-hidden">
                                 <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="space-y-2">
                                       <div className="flex items-center gap-3">
                                          <div className={`p-2 rounded-xl border ${item.scope === 'GRAMMAR' ? 'bg-blue-50 text-blue-600 border-blue-100' : item.scope === 'VOCABULARY' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                             {React.createElement(scopeOptions.find(o => o.value === item.scope)?.icon || Database, { className: "w-4 h-4" })}
                                          </div>
                                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${item.scope === 'GRAMMAR' ? 'bg-blue-50 text-blue-600 border-blue-100' : item.scope === 'VOCABULARY' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                             {scopeOptions.find(o => o.value === item.scope)?.label || item.scope}
                                          </span>
                                       </div>
                                       <h4 className="text-2xl font-black text-stone-900 uppercase tracking-tighter">{item.title}</h4>
                                    </div>
                                    <button onClick={() => handleDelete(item.id)} className="p-4 text-stone-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all" title="Siba"><Trash2 className="w-5 h-5" /></button>
                                 </div>
                                 <div className="bg-stone-50/50 p-6 rounded-[28px] border border-stone-100 relative group-hover:bg-white transition-colors">
                                    <p className="text-sm text-stone-600 leading-relaxed font-medium italic">"{item.content}"</p>
                                 </div>
                                 <div className="mt-6 flex items-center justify-between text-[10px] text-stone-400 font-black uppercase tracking-widest">
                                    <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {new Date(item.dateAdded).toLocaleDateString()}</span>
                                    <span className="text-emerald-500 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">AI Rule ID: {item.id.substring(0, 8)}</span>
                                 </div>
                              </div>
                           ))
                        )}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'test_bench' && (
             <div className="space-y-10 animate-in fade-in duration-500">
                <div className="bg-white p-12 rounded-[48px] shadow-sm border border-stone-200">
                   <div className="flex items-center gap-4 mb-10">
                      <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm"><TestTube className="w-8 h-8" /></div>
                      <div>
                        <h3 className="text-3xl font-black text-stone-900 uppercase tracking-tighter leading-none">Test Bench</h3>
                        <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-2">Test prompts against current linguistic rules</p>
                      </div>
                   </div>
                   <div className="rounded-[40px] border-4 border-indigo-50 overflow-hidden h-[700px]">
                      <div className="bg-white p-4 h-full">
                         <VoiceConversation />
                      </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'kinyarwanda_mgmt' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="bg-white p-10 rounded-[48px] shadow-sm border border-stone-200">
                  <div className="flex items-center justify-between mb-10">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm"><BookOpen className="w-8 h-8" /></div>
                        <div>
                           <h3 className="text-3xl font-black text-stone-900 uppercase tracking-tighter leading-none">Learning Portal Mgmt</h3>
                           <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-2">Manage visibility and content for learning portal</p>
                        </div>
                     </div>
                     <button 
                        onClick={() => { setModelConfig({...modelConfig, isTwigePublic: !modelConfig.isTwigePublic}); saveConfig(); }}
                        className={`flex items-center gap-3 px-8 py-4 rounded-[24px] font-black uppercase tracking-widest text-xs transition-all ${modelConfig.isTwigePublic ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/20' : 'bg-stone-100 text-stone-400'}`}
                     >
                        {modelConfig.isTwigePublic ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                        {modelConfig.isTwigePublic ? 'Portal: Public' : 'Portal: Hidden'}
                     </button>
                  </div>
                  <div className="border-t border-stone-100 pt-10">
                     <p className="text-stone-500 mb-8 font-medium italic">Previewing the learning interface below:</p>
                     <div className="bg-slate-50 rounded-[40px] p-6 border-4 border-emerald-50">
                        <KinyarwandaLearning />
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'model_config' && (
             <div className="max-w-5xl animate-in fade-in duration-500 mx-auto space-y-10">
                <div className="bg-white p-12 rounded-[48px] shadow-sm border border-stone-100 space-y-12">
                   <div className="flex items-center justify-between border-b border-stone-50 pb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm"><Sliders className="w-8 h-8" /></div>
                        <div>
                          <h3 className="text-3xl font-black text-stone-900 uppercase tracking-tighter leading-none">Engine Config</h3>
                          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-2">Advanced model performance parameters</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <Button onClick={saveConfig} className="px-10 h-14 rounded-2xl shadow-xl shadow-amber-600/20 font-black uppercase tracking-widest text-xs bg-amber-600 hover:bg-amber-700">Save Config</Button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div className="space-y-8 lg:col-span-2">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] px-1 flex items-center justify-between">
                              <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Core System Prompt</span>
                              <span className="text-emerald-600">ai.rw Persona</span>
                           </label>
                           <textarea 
                             value={modelConfig.systemInstruction} 
                             onChange={e => setModelConfig({...modelConfig, systemInstruction: e.target.value})}
                             placeholder="Wowe uri ai.rw..."
                             className="w-full h-48 p-8 bg-stone-50 border-2 border-stone-100 rounded-[32px] outline-none text-base font-medium focus:border-amber-500 transition-colors resize-none shadow-inner leading-relaxed"
                           />
                           <p className="text-[10px] text-stone-400 font-medium px-4">This instruction is concatenated with all injected Training Lab rules.</p>
                        </div>
                      </div>

                      <div className="space-y-10 bg-slate-50/50 p-8 rounded-[40px] border border-stone-100">
                        <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest flex items-center gap-2 border-b border-stone-100 pb-4"><Zap className="w-4 h-4 text-amber-500" /> Response Controls</h4>
                        
                        <div className="space-y-6">
                           <div className="space-y-4">
                              <div className="flex justify-between items-center px-1">
                                 <span className="text-[10px] font-black text-stone-600 uppercase tracking-widest">Temperature (Creativity)</span>
                                 <span className="text-xs font-black text-amber-600 bg-white px-3 py-1 rounded-full shadow-sm">{modelConfig.temperature}</span>
                              </div>
                              <input type="range" min="0" max="2" step="0.1" value={modelConfig.temperature} onChange={e => setModelConfig({...modelConfig, temperature: parseFloat(e.target.value)})} className="w-full h-2 bg-amber-100 rounded-full appearance-none cursor-pointer accent-amber-600" />
                           </div>

                           <div className="space-y-4">
                              <div className="flex justify-between items-center px-1">
                                 <span className="text-[10px] font-black text-stone-600 uppercase tracking-widest">Thinking Budget (Reasoning)</span>
                                 <span className={`text-[10px] font-black px-3 py-1 rounded-full ${modelConfig.thinkingBudget > 0 ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-500'}`}>
                                    {modelConfig.thinkingBudget > 0 ? `${modelConfig.thinkingBudget} Tokens` : 'Disabled'}
                                 </span>
                              </div>
                              <div className="flex items-center gap-4">
                                 <ZapOff className={`w-4 h-4 ${modelConfig.thinkingBudget === 0 ? 'text-stone-400' : 'text-stone-200'}`} />
                                 <input type="range" min="0" max="32768" step="1024" value={modelConfig.thinkingBudget} onChange={e => setModelConfig({...modelConfig, thinkingBudget: parseInt(e.target.value)})} className="flex-1 h-2 bg-emerald-100 rounded-full appearance-none cursor-pointer accent-emerald-600" />
                                 <Brain className={`w-4 h-4 ${modelConfig.thinkingBudget > 16000 ? 'text-emerald-500' : 'text-stone-200'}`} />
                              </div>
                           </div>
                        </div>
                      </div>

                      <div className="space-y-10 bg-slate-50/50 p-8 rounded-[40px] border border-stone-100">
                        <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest flex items-center gap-2 border-b border-stone-100 pb-4"><Hash className="w-4 h-4 text-emerald-500" /> Limits</h4>
                        <div className="grid grid-cols-1 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">Max Output Tokens</label>
                              <input 
                                type="number" 
                                value={modelConfig.maxOutputTokens} 
                                onChange={e => setModelConfig({...modelConfig, maxOutputTokens: parseInt(e.target.value)})} 
                                className="w-full p-4 bg-white border border-stone-200 rounded-2xl text-sm font-bold outline-none focus:border-amber-500" 
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest px-1">System Seed</label>
                              <input 
                                type="number" 
                                value={modelConfig.seed} 
                                onChange={e => setModelConfig({...modelConfig, seed: parseInt(e.target.value)})} 
                                className="w-full p-4 bg-white border border-stone-200 rounded-2xl text-sm font-bold outline-none focus:border-amber-500" 
                              />
                           </div>
                        </div>
                      </div>
                   </div>
                </div>
             </div>
          )}
        </div>
      </main>
    </div>
  );
};
