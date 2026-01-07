
import React, { useState, useEffect } from 'react';
import { MessageSquare, FileText, Sprout, GraduationCap, AudioLines, ChevronDown, ChevronUp, Info, TrendingUp, Settings, Download } from 'lucide-react';
import { AppView } from '../types';
import { Logo } from './Logo';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  isOpen: boolean;
  unreadCounts?: Record<string, number>;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, unreadCounts = {} }) => {
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
    <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-black text-white transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 overflow-hidden`}>
      <div className="absolute inset-0 rwanda-pattern opacity-10 pointer-events-none"></div>
      
      <div className="relative flex flex-col h-full z-10 bg-gradient-to-b from-black/90 to-emerald-950/90">
        <div className="flex items-center px-6 h-20 border-b border-white/10 bg-white/5 backdrop-blur-sm cursor-pointer" onClick={() => onChangeView(AppView.CHAT)}>
          <Logo size="sm" className="mr-3" />
          <h1 className="text-xl font-black text-white tracking-tighter uppercase">
            ai.rw
          </h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 border border-transparent relative group ${
                currentView === item.id 
                  ? 'bg-white text-emerald-900 border-emerald-500 shadow-lg font-bold' 
                  : 'text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20'
              }`}
            >
              <div className={currentView === item.id ? 'text-emerald-600' : 'text-gray-400 group-hover:text-emerald-400'}>
                {item.icon}
              </div>
              <span className="ml-3">{item.label}</span>
              {unreadCounts[item.id] > 0 && (
                <span className="absolute right-3 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full bg-red-500 text-white shadow-sm ring-2 ring-black/20">
                  {unreadCounts[item.id] > 99 ? '99+' : unreadCounts[item.id]}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="mb-3 px-1">
            <button 
              onClick={() => setShowDisclaimer(!showDisclaimer)}
              className="w-full flex items-center justify-between group focus:outline-none"
            >
              <div className="flex items-center text-emerald-500">
                <Info className="w-3 h-3 mr-1.5" />
                <p className="text-[10px] font-bold uppercase tracking-wide group-hover:text-emerald-400">
                  Icyitonderwa
                </p>
              </div>
              {showDisclaimer ? <ChevronUp className="w-3 h-3 text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-500" />}
            </button>
            
            {showDisclaimer && (
              <div className="mt-2 text-[9px] text-gray-400 leading-relaxed text-justify opacity-80 animate-in fade-in slide-in-from-top-1 duration-200">
                <p>Iyi AI ikora ishingiye ku makuru akomoka ahantu hatandukanye. Turasaba imbabazi ku makosa bishobora kuba bituzuye.</p>
              </div>
            )}
          </div>

          <button
            onClick={() => onChangeView(AppView.ADMIN)}
            className={`flex items-center w-full px-4 py-2 mt-2 rounded-lg transition-all duration-200 text-xs ${
               currentView === AppView.ADMIN ? 'bg-emerald-900/50 text-emerald-200' : 'text-gray-500 hover:text-emerald-300'
            }`}
          >
            <Settings className="w-3.5 h-3.5 mr-2" />
            <span>Kuyobora (Admin)</span>
          </button>

          {installPrompt && (
            <button
              onClick={handleInstallClick}
              className="flex items-center w-full px-4 py-2 mt-2 rounded-lg transition-all duration-200 text-xs bg-emerald-600 text-white hover:bg-emerald-700 animate-pulse"
            >
              <Download className="w-3.5 h-3.5 mr-2" />
              <span>Shyira muri Telefoni</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
