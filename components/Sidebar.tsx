import React, { useState } from 'react';
import { MessageSquare, FileText, Image as ImageIcon, Sparkles, Sprout, GraduationCap, Mic, AudioLines, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  isOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen }) => {
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const menuItems = [
    { id: AppView.CHAT, label: 'Ikiganiro', icon: <MessageSquare className="w-5 h-5" /> }, 
    { id: AppView.VOICE_CONVERSATION, label: 'Kuvuga', icon: <Mic className="w-5 h-5" /> },
    { id: AppView.TEXT_TO_SPEECH, label: 'Soma Inyandiko', icon: <AudioLines className="w-5 h-5" /> },
    { id: AppView.TEXT_TOOLS, label: 'Umwandiko', icon: <FileText className="w-5 h-5" /> }, 
    { id: AppView.IMAGE_TOOLS, label: 'Amafoto', icon: <ImageIcon className="w-5 h-5" /> },
    { id: AppView.RURAL_SUPPORT, label: 'Iterambere', icon: <Sprout className="w-5 h-5" /> },
    { id: AppView.COURSE_GENERATOR, label: 'Amasomo', icon: <GraduationCap className="w-5 h-5" /> },
  ];

  return (
    <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-black text-white transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 overflow-hidden`}>
      {/* Imigongo Background Layer */}
      <div className="absolute inset-0 imigongo-pattern opacity-10 pointer-events-none"></div>
      
      {/* Content Layer */}
      <div className="relative flex flex-col h-full z-10 bg-gradient-to-b from-black/90 to-emerald-950/90">
        <div className="flex items-center justify-center h-16 border-b border-white/10 bg-white/5 backdrop-blur-sm">
          <Sparkles className="w-6 h-6 text-emerald-400 mr-2" />
          <h1 className="text-xl font-bold text-white tracking-wider">
            ai.rw
          </h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 border border-transparent ${
                currentView === item.id 
                  ? 'bg-white text-emerald-900 border-emerald-500 shadow-lg font-bold' 
                  : 'text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20'
              }`}
            >
              {item.icon}
              <span className="ml-3">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="bg-white/5 rounded-lg p-3 mb-3 border border-white/5">
            <p className="text-xs text-emerald-400 mb-1">Version</p>
            <p className="text-sm font-semibold text-white">ai.rw 2.1</p>
          </div>
          
          <div className="mb-3 px-1">
            <button 
              onClick={() => setShowDisclaimer(!showDisclaimer)}
              className="w-full flex items-center justify-between group focus:outline-none"
            >
              <div className="flex items-center text-emerald-500">
                <Info className="w-3 h-3 mr-1.5" />
                <p className="text-[10px] font-bold uppercase tracking-wide group-hover:text-emerald-400 transition-colors">
                  Icyitonderwa
                </p>
              </div>
              {showDisclaimer ? (
                <ChevronUp className="w-3 h-3 text-gray-500 group-hover:text-white" />
              ) : (
                <ChevronDown className="w-3 h-3 text-gray-500 group-hover:text-white" />
              )}
            </button>
            
            {showDisclaimer && (
              <p className="mt-2 text-[9px] text-gray-400 leading-relaxed text-justify opacity-80 animate-in fade-in slide-in-from-top-1 duration-200">
                Iyi AI ikora ishingiye ku makuru akomoka ahantu hatandukanye. Itsinda ryacu riracyiga kandi rinoza imikorere kugira ngo ritange ibisubizo nyabyo kandi bifite ireme. Turasaba imbabazi ku makosa cyangwa ibisubizo bishobora kuba bituzuye. Ubufasha n’ibitekerezo byanyu bidufasha gukomeza gutera imbere no kubaha serivisi nziza kurushaho.
              </p>
            )}
          </div>
          
          <div className="text-center pt-2 border-t border-white/10">
             <p className="text-[10px] text-gray-400 leading-tight">
               Copyright by:
             </p>
             <p className="text-[10px] text-emerald-300 font-medium leading-tight mt-1">
               Research Analytics and AI Solutions Ltd
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};