
import React, { useState, useEffect } from 'react';
import { MessageSquare, FileText, Sprout, GraduationCap, AudioLines, ChevronDown, ChevronUp, Info, TrendingUp, Settings, Download, X } from 'lucide-react';
import { AppView } from '../types';
import { Logo } from './Logo';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  isOpen: boolean;
  onClose?: () => void;
  unreadCounts?: Record<string, number>;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, onClose, unreadCounts = {} }) => {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const choiceResult = await installPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const menuItems = [
    { id: AppView.CHAT, label: 'Ikiganiro', icon: <MessageSquare className="w-5 h-5" /> }, 
    { id: AppView.TEXT_TO_SPEECH, label: 'Soma Inyandiko', icon: <AudioLines className="w-5 h-5" /> },
    { id: AppView.TEXT_TOOLS, label: 'Umwandiko', icon: <FileText className="w-5 h-5" /> }, 
    { id: AppView.RURAL_SUPPORT, label: 'Iterambere', icon: <Sprout className="w-5 h-5" /> },
    { id: AppView.DECISION_ASSISTANT, label: 'Umujyanama', icon: <TrendingUp className="w-5 h-5" /> },
    { id: AppView.COURSE_GENERATOR, label: 'Amasomo', icon: <GraduationCap className="w-5 h-5" /> },
  ];

  return (
    <div className={`fixed inset-y-0 left-0 z-[60] w-72 bg-emerald-950 text-white transform transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 overflow-hidden shadow-2xl md:shadow-none`}>
      <div className="absolute inset-0 rwanda-pattern opacity-10 pointer-events-none"></div>
      
      <div className="relative flex flex-col h-full z-10 bg-gradient-to-b from-emerald-900 to-emerald-950">
        <div className="flex items-center justify-between px-6 h-20 border-b border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="flex items-center cursor-pointer" onClick={() => onChangeView(AppView.CHAT)}>
            <Logo size="sm" className="mr-3" />
            <h1 className="text-xl font-black text-white tracking-tighter uppercase">
              ai.rw
            </h1>
          </div>
          <button onClick={onClose} className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-6 h-6 text-white/70" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`flex items-center w-full px-4 py-3.5 rounded-xl transition-all duration-200 border border-transparent relative group ${
                currentView === item.id 
                  ? 'bg-white text-emerald-900 border-emerald-500 shadow-lg font-bold scale-[1.02]' 
                  : 'text-emerald-100/70 hover:bg-white/10 hover:text-white hover:border-white/10'
              }`}
            >
              <div className={currentView === item.id ? 'text-emerald-600' : 'text-emerald-400 group-hover:text-emerald-300'}>
                {item.icon}
              </div>
              <span className="ml-3 text-sm tracking-tight">{item.label}</span>
              {unreadCounts[item.id] > 0 && (
                <span className="absolute right-3 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full bg-red-500 text-white shadow-sm ring-2 ring-emerald-950">
                  {unreadCounts[item.id] > 99 ? '99+' : unreadCounts[item.id]}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 bg-emerald-950/50 backdrop-blur-md">
          <div className="mb-3 px-1">
            <button 
              onClick={() => setShowDisclaimer(!showDisclaimer)}
              className="w-full flex items-center justify-between group focus:outline-none py-1"
            >
              <div className="flex items-center text-emerald-400">
                <Info className="w-3 h-3 mr-1.5" />
                <p className="text-[10px] font-black uppercase tracking-widest group-hover:text-emerald-300 transition-colors">
                  Icyitonderwa
                </p>
              </div>
              {showDisclaimer ? <ChevronUp className="w-3 h-3 text-white/30" /> : <ChevronDown className="w-3 h-3 text-white/30" />}
            </button>
            
            {showDisclaimer && (
              <div className="mt-2 text-[10px] text-emerald-100/60 leading-relaxed text-justify animate-in fade-in slide-in-from-top-1 duration-200 bg-black/20 p-3 rounded-lg border border-white/5">
                <p>Iyi AI ikora ishingiye ku makuru akomoka ahantu hatandukanye. Turacyubaka uru rubuga, Tubiseguyeho ku makosa ashobora kuza mu gihe ibisubizo bishobora kuba bituzuye neza.</p>
              </div>
            )}
          </div>

          <button
            onClick={() => onChangeView(AppView.ADMIN)}
            className={`flex items-center w-full px-4 py-2.5 mt-2 rounded-xl transition-all duration-200 text-[10px] font-black uppercase tracking-widest ${
               currentView === AppView.ADMIN ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'
            }`}
          >
            <Settings className="w-3.5 h-3.5 mr-2" />
            <span>Kuyobora (Admin)</span>
          </button>

          {installPrompt && (
            <button
              onClick={handleInstallClick}
              className="flex items-center justify-center w-full px-4 py-3 mt-4 rounded-xl transition-all duration-200 text-xs font-black uppercase tracking-widest bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Download className="w-4 h-4 mr-2" />
              <span>Shyira muri Telefoni</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
