
import React, { useState, useEffect } from 'react';
import { Lock, Plus, Trash2, Database, Save, LogOut } from 'lucide-react';
import { Button } from './Button';
import { useToast } from './ToastProvider';
import { saveKnowledgeItem, getKnowledgeItems, deleteKnowledgeItem } from '../services/knowledgeService';
import { KnowledgeItem, KnowledgeScope } from '../types';

export const AdminDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  
  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [scope, setScope] = useState<KnowledgeScope>('ALL');

  const { showToast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      loadItems();
    }
  }, [isAuthenticated]);

  const loadItems = () => {
    setItems(getKnowledgeItems());
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

  const handleSave = () => {
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
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Create Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6">
              <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Ongeramo Amakuru Mashya
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-stone-700">Umutwe (Title)</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Urugero: Ibiciro bya Kawa 2024..."
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
                    placeholder="Andika amakuru arambuye AI igomba kumenya..."
                    className="w-full h-40 p-2.5 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                  <p className="text-[10px] text-stone-400">
                    Aya makuru azongerwa kuri "System Instruction" ya AI bitewe na Scope wahisemo.
                  </p>
                </div>

                <Button onClick={handleSave} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Bika Amakuru
                </Button>
              </div>
            </div>
          </div>

          {/* List Section */}
          <div className="lg:col-span-2 space-y-6">
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
                           <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                             item.scope === 'ALL' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                           }`}>
                             SCOPE: {item.scope}
                           </span>
                           <span className="text-[10px] text-stone-400 ml-2">
                             {new Date(item.dateAdded).toLocaleDateString()}
                           </span>
                         </div>
                         <button 
                           onClick={() => handleDelete(item.id)}
                           className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                           title="Siba"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                       <p className="text-sm text-stone-600 whitespace-pre-wrap leading-relaxed line-clamp-3 hover:line-clamp-none transition-all cursor-pointer">
                         {item.content}
                       </p>
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
