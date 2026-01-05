
import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, Plus, Trash2, Database, Save, LogOut, Image as ImageIcon, 
  FileText, MousePointer2, X, AlertCircle, BarChart, Sprout, 
  Mic, CheckSquare, Square, FlaskConical, Headphones, Search, 
  Settings, LayoutDashboard, BrainCircuit, Activity, ChevronRight, Filter,
  Volume2, Info
} from 'lucide-react';
import { Button } from './Button';
import { useToast } from './ToastProvider';
import { saveKnowledgeItem, getKnowledgeItems, deleteKnowledgeItem } from '../services/knowledgeService';
import { getVisitStats, getCountryAggregate } from '../services/statsService';
import { KnowledgeItem, KnowledgeScope, AnnotationBox, ImageTrainingData, DailyStats, CountryStats } from '../types';
import { ImageTools } from './ImageTools';
import { VoiceConversation } from './VoiceConversation';
import { FormattedText } from './FormattedText';

type AdminTab = 'dashboard' | 'knowledge' | 'train_image' | 'train_voice' | 'test_image' | 'test_voice';

export const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScope, setFilterScope] = useState<KnowledgeScope | 'ALL_SCOPES'>('ALL_SCOPES');
  
  // Stats State
  const [visitStats, setVisitStats] = useState<DailyStats[]>([]);
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);

  // Text Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [scope, setScope] = useState<KnowledgeScope>('ALL');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Voice Training State
  const [voicePhrase, setVoicePhrase] = useState('');
  const [voicePhonetic, setVoicePhonetic] = useState('');
  const [voiceUsage, setVoiceUsage] = useState('');

  // Image Training State
  const [trainingImage, setTrainingImage] = useState<string | null>(null);
  const [imgDescription, setImgDescription] = useState('');
  const [annotations, setAnnotations] = useState<AnnotationBox[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentBox, setCurrentBox] = useState<number[] | null>(null); 
  const [newLabel, setNewLabel] = useState('');
  
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { showToast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      loadItems();
      loadStats();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'train_image' && trainingImage) {
      drawCanvas();
    }
  }, [trainingImage, annotations, currentBox, activeTab]);

  const loadItems = () => {
    setItems(getKnowledgeItems());
    setSelectedItems(new Set());
  };

  const loadStats = () => {
    setVisitStats(getVisitStats());
    setCountryStats(getCountryAggregate());
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin2025') {
      setIsAuthenticated(true);
      showToast('Murakaza neza Admin', 'success');
    } else {
      showToast('Ijambo ry\'ibanga atari ryo', 'error');
    }
  };

  const handleSaveText = () => {
    if (!title.trim() || !content.trim()) {
      showToast('Uzuza imyanya yose', 'error');
      return;
    }
    saveKnowledgeItem({ title, content, scope });
    setTitle('');
    setContent('');
    loadItems();
    showToast('Amakuru yabitswe!', 'success');
  };

  const handleDelete = (id: string) => {
    if (confirm('Ese urashaka gusiba aya makuru?')) {
      deleteKnowledgeItem(id);
      loadItems();
      showToast('Byasibwe', 'success');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesScope = filterScope === 'ALL_SCOPES' || item.scope === filterScope;
    return matchesSearch && matchesScope;
  });

  // --- Image Canvas Logic ---
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;
    canvas.width = image.clientWidth;
    canvas.height = image.clientHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    annotations.forEach(ann => {
      const [ymin, xmin, ymax, xmax] = ann.box_2d;
      const x = (xmin / 1000) * canvas.width;
      const y = (ymin / 1000) * canvas.height;
      const w = ((xmax - xmin) / 1000) * canvas.width;
      const h = ((ymax - ymin) / 1000) * canvas.height;
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.fillRect(x, y, w, h);
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#064e3b';
      ctx.fillText(ann.label, x, y - 5);
    });
    if (currentBox) {
      const [x, y, w, h] = currentBox;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!trainingImage || !canvasRef.current) return;
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setStartPos(pos);
    setCurrentBox([pos.x, pos.y, 0, 0]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const w = pos.x - startPos.x;
    const h = pos.y - startPos.y;
    setCurrentBox([startPos.x, startPos.y, w, h]);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentBox) return;
    setIsDrawing(false);
    if (Math.abs(currentBox[2]) < 10 || Math.abs(currentBox[3]) < 10) {
      setCurrentBox(null);
    }
  };

  const confirmAnnotation = () => {
    if (!newLabel.trim() || !currentBox || !canvasRef.current) return;
    const canvas = canvasRef.current;
    let [x, y, w, h] = currentBox;
    if (w < 0) { x += w; w = Math.abs(w); }
    if (h < 0) { y += h; h = Math.abs(h); }
    const ymin = Math.round((y / canvas.height) * 1000);
    const xmin = Math.round((x / canvas.width) * 1000);
    const ymax = Math.round(((y + h) / canvas.height) * 1000);
    const xmax = Math.round(((x + w) / canvas.width) * 1000);
    setAnnotations([...annotations, { label: newLabel, box_2d: [ymin, xmin, ymax, xmax] }]);
    setNewLabel('');
    setCurrentBox(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full bg-stone-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-emerald-100">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-emerald-900">Admin Login</h2>
            <p className="text-stone-500 text-sm mt-2">Injiza ijambo ry'ibanga kugira ngo winjire.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ijambo ry'ibanga..."
              className="w-full p-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              autoFocus
            />
            <Button type="submit" className="w-full h-12">Injira</Button>
          </form>
        </div>
      </div>
    );
  }

  const SidebarItem = ({ tab, icon: Icon, label }: { tab: AdminTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        activeTab === tab 
          ? 'bg-emerald-600 text-white shadow-md' 
          : 'text-stone-500 hover:bg-emerald-50 hover:text-emerald-700'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium text-sm">{label}</span>
      {activeTab === tab && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
  );

  const voiceRules = items.filter(i => i.scope === 'VOICE_TRAINING');

  return (
    <div className="flex h-full bg-stone-50 overflow-hidden">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-200 flex flex-col hidden md:flex shrink-0">
        <div className="p-6 border-b border-stone-100">
          <h1 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Genzura (Admin)
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-4 mb-2">Overview</div>
          <SidebarItem tab="dashboard" icon={LayoutDashboard} label="Imbonerahamwe" />
          
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-4 mb-2 mt-6">Management</div>
          <SidebarItem tab="knowledge" icon={Database} label="Knowledge Base" />
          
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-4 mb-2 mt-6">AI Training</div>
          <SidebarItem tab="train_image" icon={ImageIcon} label="Gutoza Amafoto" />
          <SidebarItem tab="train_voice" icon={Mic} label="Gutoza Ijwi" />
          
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-4 mb-2 mt-6">Testing</div>
          <SidebarItem tab="test_image" icon={FlaskConical} label="Kugerageza Amafoto" />
          <SidebarItem tab="test_voice" icon={Headphones} label="Kugerageza Ijwi" />
        </nav>
        
        <div className="p-4 border-t border-stone-100">
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="w-full flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sohoka
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Sub-header for Mobile Navigation (Simplified) */}
        <div className="md:hidden bg-white border-b border-stone-200 p-4 flex gap-2 overflow-x-auto whitespace-nowrap">
           {['dashboard', 'knowledge', 'train_image', 'train_voice', 'test_image', 'test_voice'].map((t) => (
              <button 
                key={t}
                onClick={() => setActiveTab(t as AdminTab)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${activeTab === t ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-500'}`}
              >
                {t.replace('_', ' ').toUpperCase()}
              </button>
           ))}
        </div>

        <div className="p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8">
          
          {/* VIEW: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex items-center gap-4">
                     <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Activity className="w-6 h-6" /></div>
                     <div>
                        <div className="text-2xl font-extrabold text-stone-900">{visitStats.reduce((a, c) => a + c.count, 0)}</div>
                        <div className="text-xs text-stone-500 font-medium">Abasuye bose</div>
                     </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex items-center gap-4">
                     <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><Database className="w-6 h-6" /></div>
                     <div>
                        <div className="text-2xl font-extrabold text-stone-900">{items.length}</div>
                        <div className="text-xs text-stone-500 font-medium">Knowledge Items</div>
                     </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex items-center gap-4">
                     <div className="p-3 bg-amber-100 text-amber-600 rounded-xl"><BrainCircuit className="w-6 h-6" /></div>
                     <div>
                        <div className="text-2xl font-extrabold text-stone-900">{items.filter(i => i.scope === 'IMAGE_TOOLS').length}</div>
                        <div className="text-xs text-stone-500 font-medium">Training Modules</div>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
                     <h3 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
                        <BarChart className="w-5 h-5 text-emerald-600" />
                        Abasuye buri munsi
                     </h3>
                     <div className="h-48 flex items-end gap-2 border-b border-stone-100 pb-2">
                        {visitStats.slice(0, 7).reverse().map((day, i) => {
                           const max = Math.max(...visitStats.map(d => d.count), 10);
                           return (
                              <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                                 <div className="absolute -top-8 bg-stone-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">{day.count}</div>
                                 <div className="w-full bg-emerald-500 rounded-t-lg transition-all hover:bg-emerald-400" style={{ height: `${(day.count / max) * 100}%`, minHeight: '4px' }}></div>
                                 <div className="text-[10px] text-stone-400 font-bold truncate w-full text-center">{new Date(day.date).toLocaleDateString(undefined, {weekday: 'short'})}</div>
                              </div>
                           );
                        })}
                     </div>
                  </div>

                  <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
                     <h3 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
                        <Filter className="w-5 h-5 text-blue-600" />
                        Ibihugu basuramo
                     </h3>
                     <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {countryStats.map((c, i) => (
                           <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50 transition-colors">
                              <div className="flex items-center gap-3">
                                 <span className="text-xl">{c.flag}</span>
                                 <span className="text-sm font-bold text-stone-700">{c.name}</span>
                              </div>
                              <span className="text-xs font-black bg-stone-100 px-2 py-1 rounded-lg text-stone-600">{c.count}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* VIEW: KNOWLEDGE BASE */}
          {activeTab === 'knowledge' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
               <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 sticky top-6">
                     <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-emerald-600" />
                        Injiza Amakuru
                     </h3>
                     <div className="space-y-4">
                        <div>
                           <label className="text-xs font-bold text-stone-400 uppercase block mb-1.5">Umutwe (Title)</label>
                           <input 
                             value={title} 
                             onChange={e => setTitle(e.target.value)}
                             placeholder="Ex: Ibiciro bya Kawa..."
                             className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                           />
                        </div>
                        <div>
                           <label className="text-xs font-bold text-stone-400 uppercase block mb-1.5">Scope</label>
                           <select 
                             value={scope} 
                             onChange={e => setScope(e.target.value as KnowledgeScope)}
                             className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                           >
                              <option value="ALL">Hose (Global)</option>
                              <option value="CHAT">Ikiganiro (Chat)</option>
                              <option value="RURAL">Iterambere (Rural)</option>
                              <option value="BUSINESS">Umujyanama (Business)</option>
                              <option value="COURSE">Amasomo (Course)</option>
                           </select>
                        </div>
                        <div>
                           <label className="text-xs font-bold text-stone-400 uppercase block mb-1.5">Content</label>
                           <textarea 
                             value={content} 
                             onChange={e => setContent(e.target.value)}
                             placeholder="Amakuru AI izifashisha..."
                             className="w-full h-40 p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                           />
                        </div>
                        <Button onClick={handleSaveText} className="w-full py-4 shadow-lg shadow-emerald-100">
                           <Save className="w-4 h-4 mr-2" />
                           Bika Amakuru
                        </Button>
                     </div>
                  </div>
               </div>

               <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                     <div className="relative flex-1 w-full">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input 
                           value={searchQuery}
                           onChange={e => setSearchQuery(e.target.value)}
                           placeholder="Shakisha mu makuru abitse..."
                           className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                     </div>
                     <select 
                        value={filterScope}
                        onChange={e => setFilterScope(e.target.value as any)}
                        className="p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none font-bold text-xs text-stone-600"
                     >
                        <option value="ALL_SCOPES">Zose</option>
                        <option value="ALL">Global</option>
                        <option value="CHAT">Chat</option>
                        <option value="RURAL">Rural</option>
                        <option value="BUSINESS">Business</option>
                        <option value="COURSE">Course</option>
                     </select>
                  </div>

                  <div className="space-y-4">
                     {filteredItems.length === 0 ? (
                        <div className="p-20 text-center bg-white rounded-2xl border border-dashed border-stone-200 text-stone-400 font-medium">
                           Nta makuru yabonetse.
                        </div>
                     ) : (
                        filteredItems.map(item => (
                           <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 group hover:border-emerald-300 transition-all">
                              <div className="flex justify-between items-start mb-3">
                                 <div>
                                    <h4 className="font-bold text-stone-900">{item.title}</h4>
                                    <div className="flex gap-2 mt-1">
                                       <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-100">{item.scope}</span>
                                       <span className="text-[10px] font-bold text-stone-400">{new Date(item.dateAdded).toLocaleDateString()}</span>
                                    </div>
                                 </div>
                                 <button 
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                 >
                                    <Trash2 className="w-5 h-5" />
                                 </button>
                              </div>
                              <p className="text-sm text-stone-600 line-clamp-3 hover:line-clamp-none transition-all leading-relaxed whitespace-pre-wrap">
                                 {item.content}
                              </p>
                           </div>
                        ))
                     )}
                  </div>
               </div>
            </div>
          )}

          {/* VIEW: IMAGE TRAINING */}
          {activeTab === 'train_image' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200 space-y-6">
                   <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-purple-600" />
                      Gutoza AI kumenya amashusho
                   </h3>
                   {!trainingImage ? (
                      <div className="border-4 border-dashed border-stone-100 rounded-3xl p-20 text-center hover:bg-stone-50 transition-colors cursor-pointer" onClick={() => (document.getElementById('img-train') as any).click()}>
                         <input id="img-train" type="file" className="hidden" accept="image/*" onChange={e => {
                            const file = e.target.files?.[0];
                            if(file) {
                               const reader = new FileReader();
                               reader.onload = () => setTrainingImage(reader.result as string);
                               reader.readAsDataURL(file);
                            }
                         }} />
                         <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400"><Plus className="w-8 h-8" /></div>
                         <p className="text-sm text-stone-500 font-bold">Kanda hano ushyiremo ifoto</p>
                      </div>
                   ) : (
                      <div className="space-y-4">
                         <div className="aspect-video relative rounded-2xl overflow-hidden border-2 border-stone-200 bg-black">
                            <img ref={imageRef} src={trainingImage} className="w-full h-full object-contain pointer-events-none" />
                            <canvas 
                              ref={canvasRef} 
                              onMouseDown={handleMouseDown} 
                              onMouseMove={handleMouseMove} 
                              onMouseUp={handleMouseUp} 
                              className="absolute inset-0 cursor-crosshair" 
                            />
                         </div>
                         {currentBox && !isDrawing && (
                            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex gap-2">
                               <input 
                                 autoFocus 
                                 value={newLabel} 
                                 onChange={e => setNewLabel(e.target.value)} 
                                 placeholder="Izina ry'iki kintu..." 
                                 className="flex-1 p-2 border border-emerald-200 rounded-lg outline-none text-sm" 
                               />
                               <Button size="sm" onClick={confirmAnnotation}>Emeza</Button>
                               <Button variant="secondary" size="sm" onClick={() => setCurrentBox(null)}><X className="w-4 h-4"/></Button>
                            </div>
                         )}
                         <div className="flex flex-wrap gap-2">
                            {annotations.map((ann, i) => (
                               <span key={i} className="bg-white border border-stone-200 px-3 py-1 rounded-full text-xs font-bold text-stone-700 flex items-center gap-2">
                                  {ann.label}
                                  <button onClick={() => setAnnotations(annotations.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><X className="w-3 h-3"/></button>
                               </span>
                            ))}
                         </div>
                         <div className="flex gap-2 pt-4">
                            <Button className="flex-1" disabled={annotations.length === 0} onClick={() => {
                               saveKnowledgeItem({
                                  title: `Training: ${imgDescription || 'Image'}`,
                                  scope: 'IMAGE_TOOLS',
                                  content: `__IMG_TRAIN__${JSON.stringify({ imageDescription: imgDescription, annotations })}`
                               });
                               setTrainingImage(null);
                               setAnnotations([]);
                               setImgDescription('');
                               loadItems();
                               showToast("Imyitozo yabitswe!", "success");
                            }}>Bika Imyitozo</Button>
                            <Button variant="secondary" onClick={() => setTrainingImage(null)}>Siba</Button>
                         </div>
                      </div>
                   )}
                </div>
                <div className="bg-blue-900 text-white p-8 rounded-2xl shadow-xl space-y-4">
                   <h4 className="font-bold flex items-center gap-2"><BrainCircuit className="w-5 h-5" /> Uko bikora</h4>
                   <div className="text-sm text-blue-100 space-y-3 leading-relaxed">
                      <p>1. Hitamo ifoto irimo ibintu AI ikwiye kumenya (urugero: Ibikoresho by'ubuhinzi by'umwihariko mu Rwanda).</p>
                      <p>2. Shushanya urukiramende (box) ku kintu ushaka gutoza.</p>
                      <p>3. Icyo kintu ugihe izina ry'Ikinyarwanda cyangwa irindi jambo ushaka ko AI izakoresha.</p>
                      <p>4. Bika amakuru. Ibi bizafasha AI gusesengura amashusho neza kurushaho mu gice cya "Amafoto".</p>
                   </div>
                </div>
             </div>
          )}

          {/* VIEW: VOICE TRAINING */}
          {activeTab === 'train_voice' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
                {/* Form Section */}
                <div className="lg:col-span-1 bg-white p-8 rounded-3xl shadow-sm border border-stone-200 space-y-6">
                   <div className="text-center">
                      <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4"><Mic className="w-8 h-8" /></div>
                      <h3 className="text-2xl font-bold text-stone-900">Gutoza Imvugo</h3>
                      <p className="text-stone-500 text-sm mt-1">Fasha AI kuvuga neza amagambo y'Ikinyarwanda.</p>
                   </div>

                   <div className="space-y-4">
                      <div>
                         <label className="text-xs font-bold text-stone-400 uppercase block mb-1.5">Ijambo / Interuro</label>
                         <input value={voicePhrase} onChange={e => setVoicePhrase(e.target.value)} placeholder="Urugero: Mwaramutse" className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500" />
                      </div>
                      <div>
                         <label className="text-xs font-bold text-stone-400 uppercase block mb-1.5">Imvugirwe (Phonetic)</label>
                         <input value={voicePhonetic} onChange={e => setVoicePhonetic(e.target.value)} placeholder="Urugero: Mwa-ra-mu-tse" className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500" />
                      </div>
                      <div>
                         <label className="text-xs font-bold text-stone-400 uppercase block mb-1.5">Ibisobanuro (Context)</label>
                         <textarea value={voiceUsage} onChange={e => setVoiceUsage(e.target.value)} placeholder="Urugero: Rikoreshwa mu kuramukanya mu gitondo..." className="w-full h-32 p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
                      </div>
                      <Button className="w-full py-4 bg-amber-600 hover:bg-amber-700" onClick={() => {
                         if(!voicePhrase) return;
                         saveKnowledgeItem({
                            title: `Voice Rule: ${voicePhrase}`,
                            scope: 'VOICE_TRAINING',
                            content: `Phrase: "${voicePhrase}"\nPhonetic: [${voicePhonetic}]\nContext: ${voiceUsage}`
                         });
                         setVoicePhrase(''); setVoicePhonetic(''); setVoiceUsage('');
                         loadItems();
                         showToast("Amabwiriza y'ijwi yabitswe!", "success");
                      }}>Bika Amabwiriza</Button>
                   </div>
                </div>

                {/* Listing Section */}
                <div className="lg:col-span-2 space-y-6">
                   <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                        <Volume2 className="w-5 h-5 text-amber-600" />
                        Amabwiriza Abitse ({voiceRules.length})
                      </h4>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {voiceRules.length === 0 ? (
                        <div className="col-span-full p-20 text-center bg-white rounded-3xl border border-dashed border-stone-200 text-stone-400 italic font-medium">
                          Nta mabwiriza y'ijwi arahari.
                        </div>
                      ) : (
                        voiceRules.map(rule => (
                          <div key={rule.id} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 hover:border-amber-300 transition-all flex flex-col justify-between group">
                            <div>
                               <div className="flex justify-between items-start mb-2">
                                  <h5 className="font-black text-stone-900">{rule.title.replace('Voice Rule: ', '')}</h5>
                                  <button onClick={() => handleDelete(rule.id)} className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                     <Trash2 className="w-4 h-4" />
                                  </button>
                               </div>
                               <div className="text-xs text-stone-600 bg-amber-50 p-3 rounded-xl border border-amber-100 font-mono mb-4">
                                  {rule.content.split('\n')[1]}
                               </div>
                               <p className="text-xs text-stone-500 leading-relaxed italic flex items-start gap-1.5">
                                  <Info className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                                  {rule.content.split('\n')[2]?.replace('Context: ', '')}
                               </p>
                            </div>
                          </div>
                        ))
                      )}
                   </div>
                </div>
             </div>
          )}

          {/* VIEW: TEST IMAGE */}
          {activeTab === 'test_image' && (
             <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 animate-in fade-in">
                <div className="mb-6 flex justify-between items-center">
                   <h3 className="text-lg font-bold text-stone-900">Sandbox: Kugerageza Amafoto</h3>
                   <span className="text-[10px] font-black uppercase bg-stone-100 text-stone-500 px-3 py-1 rounded-full border border-stone-200">Admin Preview</span>
                </div>
                <ImageTools />
             </div>
          )}

          {/* VIEW: TEST VOICE */}
          {activeTab === 'test_voice' && (
             <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 animate-in fade-in min-h-[600px]">
                <div className="mb-6 flex justify-between items-center">
                   <h3 className="text-lg font-bold text-stone-900">Sandbox: Kugerageza Kuvuga</h3>
                   <span className="text-[10px] font-black uppercase bg-stone-100 text-stone-500 px-3 py-1 rounded-full border border-stone-200">Admin Preview</span>
                </div>
                <VoiceConversation />
             </div>
          )}

        </div>
      </main>
    </div>
  );
};
