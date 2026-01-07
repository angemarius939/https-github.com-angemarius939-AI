
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
import { AdminDashboard } from './components/AdminDashboard';

const LoadingView = () => (
  <div className="h-full w-full flex flex-col items-center justify-center bg-white">
    <div className="relative">
      <div className="w-20 h-20 border-4 border-emerald-50 border-t-emerald-500 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Logo size="sm" />
      </div>
    </div>
    <p className="text-emerald-900 font-black text-[10px] uppercase tracking-[0.3em] mt-8 animate-pulse">ai.rw Irimo gufungura...</p>
  </div>
);

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LANDING);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [ttsInitialText, setTtsInitialText] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // Record visit asynchronously
        recordVisit().catch(e => console.warn("Tracking failed", e));
        
        // Use Landing Page by default
        const landingPref = localStorage.getItem('ai_rw_landing_enabled');
        const isLandingEnabled = landingPref !== 'false';
        setCurrentView(isLandingEnabled ? AppView.LANDING : AppView.CHAT);
      } catch (e) {
        console.error("Initialization error:", e);
        setCurrentView(AppView.LANDING);
      } finally {
        // Remove loader
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  const handleStartApp = (view: AppView = AppView.CHAT) => {
    setCurrentView(view);
    const hasSeenOnboarding = localStorage.getItem('ai_rw_onboarding_seen') === 'true';
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('ai_rw_onboarding_seen', 'true');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleNavigateToTTS = (text: string) => {
    setTtsInitialText(text);
    setCurrentView(AppView.TEXT_TO_SPEECH);
  };

  const handleViewChange = (view: AppView) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
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
      case AppView.ADMIN: return 'Ubuyobozi';
      default: return 'ai.rw';
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.CHAT: return <ChatInterface onNavigate={handleViewChange} />;
      case AppView.VOICE_CONVERSATION: return <VoiceConversation />;
      case AppView.TEXT_TO_SPEECH: return <TextToSpeech initialText={ttsInitialText} />;
      case AppView.TEXT_TOOLS: return <TextAssistant onNavigateToTTS={handleNavigateToTTS} />;
      case AppView.IMAGE_TOOLS: return <ImageTools onNavigateToTTS={handleNavigateToTTS} />;
      case AppView.RURAL_SUPPORT: return <RuralAssistant />;
      case AppView.DECISION_ASSISTANT: return <DecisionAssistant />;
      case AppView.COURSE_GENERATOR: return <CourseGenerator />;
      case AppView.ADMIN: return <AdminDashboard />;
      default: return <ChatInterface onNavigate={handleViewChange} />;
    }
  };

  if (isInitializing) return <LoadingView />;

  return (
    <ToastProvider>
      {currentView === AppView.LANDING ? (
        <LandingPage onStart={handleStartApp} />
      ) : (
        <div className="flex h-screen w-full bg-stone-100 overflow-hidden font-sans relative">
          {showOnboarding && <Onboarding onComplete={completeOnboarding} />}
          
          <Sidebar 
            currentView={currentView} 
            onChangeView={handleViewChange} 
            isOpen={isSidebarOpen} 
          />
          
          <div className="flex-1 flex flex-col min-w-0 relative h-full">
            <div className="absolute inset-0 rwanda-pattern-light opacity-40 pointer-events-none z-0"></div>
            
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-emerald-950 text-white relative z-20 shadow-xl">
              <div className="flex items-center gap-3">
                 <button onClick={() => handleViewChange(AppView.LANDING)}>
                   <Logo size="sm" variant="light" className="shadow-inner" />
                 </button>
                 <h1 className="text-sm font-black uppercase tracking-widest truncate max-w-[150px]">{getPageTitle()}</h1>
              </div>
              <button onClick={toggleSidebar} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white focus:outline-none transition-all">
                {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Desktop Navigation Header */}
            <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white/40 backdrop-blur-sm border-b border-emerald-100/30 relative z-10">
               <div className="flex items-center gap-2 text-[10px] font-black text-emerald-900/40 uppercase tracking-[0.2em]">
                  <button onClick={() => handleViewChange(AppView.LANDING)} className="hover:text-emerald-600 transition-colors flex items-center gap-2">
                     <Logo size="sm" />
                     Ahabanza
                  </button>
                  <span>/</span>
                  <span className="text-emerald-600">{getPageTitle()}</span>
               </div>
            </header>

            <main className="flex-1 overflow-hidden p-2 md:p-6 lg:p-8 relative z-10">
              <div className="h-full bg-white/95 backdrop-blur shadow-2xl rounded-[40px] border border-white/50 overflow-hidden">
                 {renderContent()}
              </div>
            </main>
          </div>

          {isSidebarOpen && <div className="fixed inset-0 bg-emerald-950/90 z-40 md:hidden backdrop-blur-sm animate-in fade-in" onClick={() => setIsSidebarOpen(false)} />}
        </div>
      )}
    </ToastProvider>
  );
}
