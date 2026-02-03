
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Lock, Brain, Trash2, Database, Settings, 
  ChevronRight, Activity, LayoutDashboard, Sliders,
  FileText, Globe, Clock, Search, Sticker, Languages
} from 'lucide-react';
import { Button } from './Button';
import { useToast } from './ToastProvider';
import { 
  saveKnowledgeItem, getKnowledgeItems, 
  deleteKnowledgeItem, importKnowledgeBase
} from '../services/knowledgeService';
import { KnowledgeItem, KnowledgeScope, ModelConfig } from '../types';

export const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'training_lab' | 'config'>('dashboard');
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [scope, setScope] = useState<KnowledgeScope>('GRAMMAR');
  
  const { showToast } = useToast();

  const scopeOptions = [
    { value: 'GRAMMAR', label: 'Imyandikire (Grammar)', icon: Languages, color: 'blue' },
    { value: 'VOCABULARY', label: 'Amagambo (Vocab)', icon: Sticker, color: 'indigo' },
    { value: 'ALL', label: 'Rusange', icon: Globe, color: 'emerald' },
    { value: 'BUSINESS', label: 'Business', icon: Activity, color: 'amber' }
  ];

  useEffect(() => {
    if (isAuthenticated) setItems(getKnowledgeItems());
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin2026') {
      setIsAuthenticated(true);
      showToast('Welcome to Admin Panel', 'success');
    } else {
      showToast('Wrong Password', 'error');
    }
  };

  const handleSave = () => {
    if (!title || !content) return showToast('Fill all fields', 'error');
    saveKnowledgeItem({ title, content, scope });
    setTitle(''); setContent(''); setItems(getKnowledgeItems());
    showToast('Rule saved to AI Brain!', 'success');
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center">
          <Lock className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-6">Ubuyobozi bwa ai.rw</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Password..." 
              className="w-full p-4 border rounded-2xl text-center font-bold"
            />
            <Button type="submit" className="w-full py-4 rounded-2xl">Login</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-slate-50">
      <aside className="w-64 bg-white border-r flex flex-col p-6 space-y-2">
        <h1 className="text-xl font-black text-emerald-950 mb-8 px-4">AI CONTROL</h1>
        <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-3 p-4 rounded-xl font-bold ${activeTab === 'dashboard' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}><LayoutDashboard className="w-5 h-5" /> Dashboard</button>
        <button onClick={() => setActiveTab('training_lab')} className={`flex items-center gap-3 p-4 rounded-xl font-bold ${activeTab === 'training_lab' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}><Brain className="w-5 h-5" /> Training Lab</button>
        <button onClick={() => setActiveTab('config')} className={`flex items-center gap-3 p-4 rounded-xl font-bold ${activeTab === 'config' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}><Sliders className="w-5 h-5" /> Config</button>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        {activeTab === 'training_lab' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-sm">
              <h3 className="text-xl font-black mb-6">Guhugura AI ku Myandikire</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase">Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    {scopeOptions.map(opt => (
                      <button key={opt.value} onClick={() => setScope(opt.value as any)} className={`p-3 rounded-xl border text-xs font-bold ${scope === opt.value ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-500'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Topic (e.g. Greetings)" className="w-full p-4 bg-slate-50 rounded-xl outline-none" />
                  <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Rule (e.g. Always use 'Muraho' instead of 'Hi')" className="w-full h-32 p-4 bg-slate-50 rounded-xl outline-none" />
                  <Button onClick={handleSave} className="w-full py-4">Save Rule</Button>
                </div>
                <div className="space-y-4">
                   <label className="text-xs font-black text-slate-400 uppercase">Rules Active ({items.length})</label>
                   <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                      {items.map(item => (
                        <div key={item.id} className="p-4 bg-white border rounded-2xl flex justify-between items-start group">
                          <div>
                            <span className="text-[10px] font-black uppercase text-emerald-600">{item.scope}</span>
                            <h4 className="font-bold text-slate-800">{item.title}</h4>
                            <p className="text-xs text-slate-500 mt-1">{item.content}</p>
                          </div>
                          <button onClick={() => deleteKnowledgeItem(item.id)} className="text-slate-300 hover:text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
