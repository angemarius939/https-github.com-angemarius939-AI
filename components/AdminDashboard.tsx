
import React, { useState, useEffect, useRef } from 'react';
import { Lock, Plus, Trash2, Database, Save, LogOut, Image as ImageIcon, FileText, MousePointer2, X, AlertCircle, BarChart } from 'lucide-react';
import { Button } from './Button';
import { useToast } from './ToastProvider';
import { saveKnowledgeItem, getKnowledgeItems, deleteKnowledgeItem } from '../services/knowledgeService';
import { getVisitStats, getCountryAggregate } from '../services/statsService';
import { KnowledgeItem, KnowledgeScope, AnnotationBox, ImageTrainingData, DailyStats, CountryStats } from '../types';

export const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'stats'>('text');
  
  // Stats State
  const [visitStats, setVisitStats] = useState<DailyStats[]>([]);
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);

  // Text Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [scope, setScope] = useState<KnowledgeScope>('ALL');

  // Image Training State
  const [trainingImage, setTrainingImage] = useState<string | null>(null);
  const [imgDescription, setImgDescription] = useState('');
  const [annotations, setAnnotations] = useState<AnnotationBox[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentBox, setCurrentBox] = useState<number[] | null>(null); // [x, y, w, h] px
  const [newLabel, setNewLabel] = useState('');
  
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { showToast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      loadItems();
      loadStats();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab === 'image' && trainingImage) {
      drawCanvas();
    }
  }, [trainingImage, annotations, currentBox, activeTab]);

  const loadItems = () => {
    setItems(getKnowledgeItems());
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

  // --- Image Training Logic ---

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTrainingImage(reader.result as string);
        setAnnotations([]);
        setCurrentBox(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    // Match canvas size to image display size
    canvas.width = image.clientWidth;
    canvas.height = image.clientHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing annotations
    annotations.forEach(ann => {
      // Convert normalized 0-1000 back to pixels
      const [ymin, xmin, ymax, xmax] = ann.box_2d;
      const x = (xmin / 1000) * canvas.width;
      const y = (ymin / 1000) * canvas.height;
      const w = ((xmax - xmin) / 1000) * canvas.width;
      const h = ((ymax - ymin) / 1000) * canvas.height;

      ctx.strokeStyle = '#10b981'; // emerald-500
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.fillRect(x, y, w, h);

      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#064e3b';
      ctx.fillText(ann.label, x, y - 5);
    });

    // Draw current drawing box
    if (currentBox) {
      const [x, y, w, h] = currentBox;
      ctx.strokeStyle = '#ef4444'; // red-500
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }
  };

  const getMousePos = (e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!trainingImage) return;
    setIsDrawing(true);
    const pos = getMousePos(e);
    setStartPos(pos);
    setCurrentBox([pos.x, pos.y, 0, 0]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const pos = getMousePos(e);
    const w = pos.x - startPos.x;
    const h = pos.y - startPos.y;
    setCurrentBox([startPos.x, startPos.y, w, h]);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentBox || !canvasRef.current) return;
    setIsDrawing(false);
    
    // Validate box size (ignore tiny clicks)
    if (Math.abs(currentBox[2]) < 10 || Math.abs(currentBox[3]) < 10) {
      setCurrentBox(null);
      return;
    }
    
    // Note: Don't clear currentBox yet, wait for label input
  };

  const confirmAnnotation = () => {
    if (!newLabel.trim() || !currentBox || !canvasRef.current) {
      showToast('Andika izina ry\'iki kintu', 'error');
      return;
    }

    // Normalize coordinates to 0-1000 used by Gemini
    const canvas = canvasRef.current;
    let [x, y, w, h] = currentBox;
    
    // Handle negative width/height (drawing backwards)
    if (w < 0) { x += w; w = Math.abs(w); }
    if (h < 0) { y += h; h = Math.abs(h); }

    const ymin = Math.round((y / canvas.height) * 1000);
    const xmin = Math.round((x / canvas.width) * 1000);
    const ymax = Math.round(((y + h) / canvas.height) * 1000);
    const xmax = Math.round(((x + w) / canvas.width) * 1000);

    const newAnnotation: AnnotationBox = {
      label: newLabel,
      box_2d: [ymin, xmin, ymax, xmax]
    };

    setAnnotations([...annotations, newAnnotation]);
    setNewLabel('');
    setCurrentBox(null);
  };

  const cancelAnnotation = () => {
    setCurrentBox(null);
    setNewLabel('');
  };

  const removeAnnotation = (index: number) => {
    setAnnotations(annotations.filter((_, i) => i !== index));
  };

  const handleSaveImageTraining = () => {
    if (!imgDescription.trim()) {
      showToast('Sobanura iyi foto muri rusange', 'error');
      return;
    }
    if (annotations.length === 0) {
      showToast('Shushanya byibuze urukiramende rumwe', 'error');
      return;
    }

    const trainingData: ImageTrainingData = {
      imageDescription: imgDescription,
      annotations: annotations
    };

    const contentString = `__IMG_TRAIN__${JSON.stringify(trainingData)}`;

    saveKnowledgeItem({
      title: `Image Training: ${imgDescription.slice(0, 20)}...`,
      content: contentString,
      scope: 'IMAGE_TOOLS'
    });

    setTrainingImage(null);
    setImgDescription('');
    setAnnotations([]);
    loadItems();
    showToast('Imyitozo y\'amashusho yabitswe!', 'success');
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

  return (
    <div className="flex flex-col h-full overflow-hidden bg-stone-50">
      <div className="bg-white border-b border-emerald-100 p-4 flex justify-between items-center shadow-sm z-10">
        <div>
          <h1 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Admin & Training Dashboard
          </h1>
          <p className="text-xs text-stone-500">Genzura amakuru AI ikoresha (Knowledge Base)</p>
        </div>
        <Button variant="ghost" onClick={() => setIsAuthenticated(false)} className="text-red-500 hover:bg-red-50">
          <LogOut className="w-4 h-4 mr-2" />
          Sohoka
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-white p-1 rounded-xl border border-emerald-100 w-full md:w-fit overflow-x-auto shadow-sm">
            <button
              onClick={() => setActiveTab('text')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'text' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-stone-500 hover:text-emerald-600'
              }`}
            >
              <FileText className="w-4 h-4" />
              Inyandiko (Text)
            </button>
            <button
              onClick={() => setActiveTab('image')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'image' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-stone-500 hover:text-emerald-600'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Amafoto (Image)
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'stats' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-stone-500 hover:text-emerald-600'
              }`}
            >
              <BarChart className="w-4 h-4" />
              Imibare (Stats)
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {activeTab === 'stats' ? (
                // --- STATISTICS VIEW ---
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6">
                        <h3 className="text-lg font-bold text-emerald-900 mb-6 flex items-center">
                            <BarChart className="w-5 h-5 mr-2 text-emerald-600" />
                            Imbonerahamwe y'Abasuye (Daily Visits)
                        </h3>
                        <div className="flex items-end space-x-2 h-48 w-full pb-2 border-b border-stone-100">
                            {visitStats.slice(0, 7).reverse().map((day, idx) => {
                                const max = Math.max(...visitStats.map(d => d.count), 10);
                                const height = Math.max((day.count / max) * 100, 5);
                                return (
                                    <div key={idx} className="flex flex-col items-center flex-1 group">
                                        <div className="text-xs font-bold text-emerald-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {day.count}
                                        </div>
                                        <div 
                                            className="w-full bg-emerald-500 rounded-t-sm hover:bg-emerald-400 transition-all"
                                            style={{ height: `${height}%` }}
                                        ></div>
                                        <div className="text-[10px] text-stone-400 mt-2 rotate-0 truncate w-full text-center">
                                            {new Date(day.date).toLocaleDateString(undefined, {weekday: 'short'})}
                                        </div>
                                    </div>
                                )
                            })}
                            {visitStats.length === 0 && <p className="text-sm text-stone-400 m-auto">Nta mibare iraboneka.</p>}
                        </div>
                        <div className="mt-4 text-xs text-stone-500 text-center">
                           Total Visits: <span className="font-bold text-emerald-700">{visitStats.reduce((acc, curr) => acc + curr.count, 0)}</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6">
                        <h3 className="text-lg font-bold text-emerald-900 mb-6 flex items-center">
                            <Database className="w-5 h-5 mr-2 text-blue-600" />
                            Ibihugu Basura (Countries)
                        </h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {countryStats.map((c, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 hover:bg-stone-50 rounded-lg transition-colors border border-transparent hover:border-stone-100">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{c.flag}</span>
                                        <span className="font-medium text-stone-700">{c.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-2 bg-stone-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-blue-500" 
                                                style={{ width: `${(c.count / (countryStats[0]?.count || 1)) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-bold text-stone-600 w-8 text-right">{c.count}</span>
                                    </div>
                                </div>
                            ))}
                            {countryStats.length === 0 && <p className="text-sm text-stone-400">Nta makuru y'ibihugu araboneka.</p>}
                        </div>
                    </div>
                </div>
            ) : (
                // --- EXISTING INPUT & LIST LAYOUT ---
                <>
                    {/* Input Section */}
                    <div className="lg:col-span-1 space-y-6">
                        {activeTab === 'text' ? (
                            <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6 animate-in fade-in">
                                <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center">
                                    <Plus className="w-5 h-5 mr-2" />
                                    Ongeramo Amakuru
                                </h3>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-stone-700">Umutwe (Title)</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Urugero: Ibiciro bya Kawa..."
                                            className="w-full p-2.5 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-stone-700">Aho bizakoreshwa (Scope)</label>
                                        <select
                                            value={scope}
                                            onChange={(e) => setScope(e.target.value as KnowledgeScope)}
                                            className="w-full p-2.5 border border-emerald-200 rounded-lg bg-white"
                                        >
                                            <option value="ALL">Hose (All Pages)</option>
                                            <option value="RURAL">Iterambere (Rural)</option>
                                            <option value="BUSINESS">Umujyanama (Business)</option>
                                            <option value="COURSE">Amasomo (Course)</option>
                                            <option value="CHAT">Ikiganiro (Chat)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-stone-700">Amakuru (Content)</label>
                                        <textarea
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            placeholder="Andika amakuru arambuye..."
                                            className="w-full h-40 p-2.5 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 resize-none"
                                        />
                                    </div>
                                    <Button onClick={handleSaveText} className="w-full">
                                        <Save className="w-4 h-4 mr-2" />
                                        Bika Amakuru
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6 animate-in fade-in">
                                <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center">
                                    <MousePointer2 className="w-5 h-5 mr-2" />
                                    Image Annotation
                                </h3>
                                <div className="space-y-4">
                                    {!trainingImage ? (
                                        <div className="border-2 border-dashed border-emerald-200 rounded-xl p-8 text-center bg-emerald-50/30 hover:bg-emerald-50 transition-colors">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                id="admin-img-upload"
                                            />
                                            <label htmlFor="admin-img-upload" className="cursor-pointer flex flex-col items-center">
                                                <ImageIcon className="w-10 h-10 text-emerald-400 mb-2" />
                                                <span className="text-sm font-medium text-emerald-700">Hitamo ifoto yo kwigisha</span>
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-stone-700">Sobanura Ifoto (Rusange)</label>
                                                <input
                                                    type="text"
                                                    value={imgDescription}
                                                    onChange={(e) => setImgDescription(e.target.value)}
                                                    placeholder="Ex: Isoko rya kijyambere..."
                                                    className="w-full p-2.5 border border-emerald-200 rounded-lg"
                                                />
                                            </div>
                                            {currentBox && (
                                                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 space-y-2 animate-in fade-in">
                                                    <h4 className="text-xs font-bold text-emerald-800 uppercase">Aho Washushanyije</h4>
                                                    <input
                                                        type="text"
                                                        autoFocus
                                                        value={newLabel}
                                                        onChange={(e) => setNewLabel(e.target.value)}
                                                        placeholder="Izina ry'iki kintu (Kinyarwanda)"
                                                        className="w-full p-2 text-sm border border-emerald-200 rounded"
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button size="sm" onClick={confirmAnnotation} className="w-full text-xs h-8">Emeza</Button>
                                                        <Button size="sm" variant="secondary" onClick={cancelAnnotation} className="w-full text-xs h-8">Reka</Button>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="border-t border-emerald-50 pt-3">
                                                <h4 className="text-xs font-bold text-stone-500 mb-2">Ibyo wagaragaje ({annotations.length})</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {annotations.map((ann, idx) => (
                                                        <div key={idx} className="flex items-center bg-stone-100 rounded px-2 py-1 text-xs">
                                                            <span className="font-medium text-stone-700 mr-2">{ann.label}</span>
                                                            <button onClick={() => removeAnnotation(idx)} className="text-stone-400 hover:text-red-500">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {annotations.length === 0 && <span className="text-xs text-stone-400 italic">Nta na kimwe...</span>}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <Button onClick={handleSaveImageTraining} disabled={annotations.length === 0} className="flex-1">
                                                    Bika Ifoto
                                                </Button>
                                                <Button variant="danger" onClick={() => setTrainingImage(null)} className="px-3">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <div className="bg-blue-50 p-2 rounded text-[10px] text-blue-700 flex items-start">
                                                <AlertCircle className="w-3 h-3 mr-1.5 shrink-0 mt-0.5" />
                                                Kanda ku ifoto maze ukurure (Drag) kugira ngo ushushanye urukiramende ku kintu ushaka kwigisha AI.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* List/Preview Section */}
                    <div className="lg:col-span-2 space-y-6">
                        {activeTab === 'image' && trainingImage ? (
                            <div className="bg-stone-800 rounded-xl overflow-hidden shadow-lg border border-stone-700 relative flex items-center justify-center min-h-[400px]">
                                <div className="relative" ref={containerRef}>
                                    <img 
                                        ref={imageRef}
                                        src={trainingImage} 
                                        alt="Training" 
                                        className="max-h-[500px] max-w-full object-contain pointer-events-none select-none" 
                                    />
                                    <canvas
                                        ref={canvasRef}
                                        className="absolute inset-0 cursor-crosshair"
                                        onMouseDown={handleMouseDown}
                                        onMouseMove={handleMouseMove}
                                        onMouseUp={handleMouseUp}
                                        onMouseLeave={handleMouseUp}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6 min-h-[500px]">
                                <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center justify-between">
                                    <span>Amakuru Abitse ({items.length})</span>
                                </h3>
                                {items.length === 0 ? (
                                    <div className="text-center py-12 text-stone-400">
                                        <Database className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                        <p>Nta makuru arahari.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {items.map((item) => (
                                            <div key={item.id} className="p-4 border border-stone-200 rounded-lg hover:border-emerald-300 transition-colors bg-stone-50/50">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-bold text-emerald-800">{item.title}</h4>
                                                        <div className="flex gap-2 mt-1">
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                                                                item.scope === 'IMAGE_TOOLS' ? 'bg-purple-100 text-purple-700' :
                                                                item.scope === 'ALL' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                                            }`}>
                                                                {item.scope}
                                                            </span>
                                                            <span className="text-[10px] text-stone-400">
                                                                {new Date(item.dateAdded).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                        title="Siba"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                {item.content.startsWith('__IMG_TRAIN__') ? (
                                                    <div className="text-xs text-stone-500 italic bg-stone-100 p-2 rounded border border-stone-200">
                                                        [Image Training Data Hidden] - Contains {JSON.parse(item.content.replace('__IMG_TRAIN__', '')).annotations.length} annotations.
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-stone-600 whitespace-pre-wrap leading-relaxed line-clamp-3 hover:line-clamp-none transition-all cursor-pointer">
                                                        {item.content}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
