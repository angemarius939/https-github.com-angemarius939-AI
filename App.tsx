
import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { ToastProvider } from './components/ToastProvider';
import { AppView } from './types';
import { recordVisit } from './services/statsService';
import { LandingPage } from './components/LandingPage';
import { Logo } from './components/Logo';
import { Onboarding } from './components/Onboarding';

// Tool imports
import { TextAssistant } from './components/TextAssistant';
import { ImageTools } from './components/ImageTools';
import { RuralAssistant } from './components/RuralAssistant';
import { CourseGenerator } from './components/CourseGenerator';
import { VoiceConversation } from './components/VoiceConversation';
import { TextToSpeech } from './components/TextToSpeech';
import { DecisionAssistant } from './components/DecisionAssistant';
import { KinyarwandaLearning } from './components/KinyarwandaLearning';
import { AdminDashboard } from './components/AdminDashboard';

const LoadingView = () => (
  <div className="h-full w-full flex flex-col items-center justify-center bg-white p-6 text-center">
    <div className="relative mb-8">
      <div className="w-24 h-24 border-4 border-emerald-50 border-t-emerald-500 rounded-3xl animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Logo size="sm" />
      </div>
    </div>
    <p className="text-emerald-900 font-black text-xs uppercase tracking-[0.3em] animate-pulse">ai.rw Irimo gufungura...</p>
  </div>
);

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [ttsInitialText, setTtsInitialText] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        recordVisit().catch(() => {});
        let hasSeenOnboarding = false;
        try {
          hasSeenOnboarding = localStorage.getItem('ai_rw_onboarding_seen') === 'true';
        } catch (e) {
          console.warn("Storage access issue:", e);
        }
        if (!hasSeenOnboarding) {
          setShowOnboarding(true);
        }
      } finally {
        setTimeout(() => setIsInitializing(false), 500);
      }
    };
    init();
  }, []);

  const completeOnboarding = () => {
    setShowOnboarding(false);
    try {
      localStorage.setItem('ai_rw_onboarding_seen', 'true');
    } catch (e) {}
    setCurrentView(AppView.CHAT);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleNavigateToTTS = (text: string) => {
    setTtsInitialText(text);
    setCurrentView(AppView.TEXT_TO_SPEECH);
  };

  const handleViewChange = (view: AppView) => {
    setCurrentView(view);
    setIsSidebarOpen(false); // Crucial: close sidebar on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageTitle = () => {
    switch (currentView) {
      case AppView.LANDING: return 'Ahabanza';
      case AppView.CHAT: return 'Ikiganiro';
      case AppView.VOICE_CONVERSATION: return 'Kuvuga';
      case AppView.TEXT_TO_SPEECH: return 'Soma Inyandiko';
      case AppView.TEXT_TOOLS: return 'Umwandiko';
      case AppView.IMAGE_TOOLS: return 'Amafoto';
      case AppView.RURAL_SUPPORT: return 'Iterambere';
      case AppView.DECISION_ASSISTANT: return 'Umujyanama';
      case AppView.COURSE_GENERATOR: return 'Amasomo';
      case AppView.TWIGE_IKINYARWANDA: return 'Twige Ikinyarwanda';
      case AppView.ADMIN: return 'Ubuyobozi';
      default: return 'ai.rw';
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.LANDING: return <LandingPage onStart={handleViewChange} />;
      case AppView.CHAT: return <ChatInterface onNavigate={handleViewChange} />;
      case AppView.VOICE_CONVERSATION: return <VoiceConversation />;
      case AppView.TEXT_TO_SPEECH: return <TextToSpeech initialText={ttsInitialText} />;
      case AppView.TEXT_TOOLS: return <TextAssistant onNavigateToTTS={handleNavigateToTTS} />;
      case AppView.IMAGE_TOOLS: return <ImageTools onNavigateToTTS={handleNavigateToTTS} />;
      case AppView.RURAL_SUPPORT: return <RuralAssistant />;
      case AppView.DECISION_ASSISTANT: return <DecisionAssistant />;
      case AppView.COURSE_GENERATOR: return <CourseGenerator />;
      case AppView.TWIGE_IKINYARWANDA: return <KinyarwandaLearning />;
      case AppView.ADMIN: return <AdminDashboard onNavigate={handleViewChange} />;
      default: return <ChatInterface onNavigate={handleViewChange} />;
    }
  };

  if (isInitializing) return <LoadingView />;

  return (
    <ToastProvider>
      <div className="flex h-screen w-full bg-stone-50 overflow-hidden font-sans relative">
        {showOnboarding && <Onboarding onComplete={completeOnboarding} />}
        
        <Sidebar 
          currentView={currentView} 
          onChangeView={handleViewChange} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)}
        />
        
        <div className="flex-1 flex flex-col min-w-0 relative h-full">
          <div className="absolute inset-0 rwanda-pattern-light opacity-30 pointer-events-none z-0"></div>
          
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-emerald-100 relative z-[45] shadow-sm">
            <div className="flex items-center gap-3">
               <button onClick={toggleSidebar} className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus:outline-none transition-all active:scale-95 shadow-sm border border-emerald-100">
                  <Menu className="w-6 h-6" />
               </button>
               <h1 className="text-sm font-black text-emerald-950 uppercase tracking-widest truncate max-w-[150px]">{getPageTitle()}</h1>
            </div>
            <button onClick={() => handleViewChange(AppView.CHAT)} className="active:scale-90 transition-transform">
              <Logo size="sm" className="shadow-emerald-200/50" />
            </button>
          </div>

          {/* Desktop Navigation Header */}
          <header className="hidden md:flex items-center justify-between px-8 py-5 bg-white/60 backdrop-blur-xl border-b border-emerald-100/50 relative z-10">
             <div className="flex items-center gap-3 text-[10px] font-black text-emerald-900/40 uppercase tracking-[0.2em]">
                <button onClick={() => handleViewChange(AppView.CHAT)} className="hover:text-emerald-600 transition-colors flex items-center gap-2 group">
                   <Logo size="sm" className="group-hover:scale-105 transition-transform" />
                   <span className="text-emerald-950 group-hover:text-emerald-600">ai.rw</span>
                </button>
                <span className="text-stone-300">/</span>
                <span className="text-emerald-600">{getPageTitle()}</span>
             </div>
          </header>

          <main className="flex-1 overflow-hidden p-2 md:p-6 lg:p-10 relative z-10">
            <div className="h-full bg-white shadow-2xl shadow-emerald-900/5 rounded-[32px] md:rounded-[48px] border border-white/50 overflow-hidden">
               {renderContent()}
            </div>
          </main>
        </div>

        {/* Improved Backdrop: Lightened for better aesthetics */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-[55] md:hidden animate-in fade-in duration-300" 
            onClick={() => setIsSidebarOpen(false)} 
          />
        )}
      </div>
    </ToastProvider>
  );
}
