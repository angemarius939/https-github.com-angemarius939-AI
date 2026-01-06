
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Menu, X, Loader2 } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { ToastProvider } from './components/ToastProvider';
import { AppView } from './types';
import { recordVisit } from './services/statsService';
import { LandingPage } from './components/LandingPage';
import { Logo } from './components/Logo';

// Lazy load feature components
const TextAssistant = lazy(() => import('./components/TextAssistant').then(m => ({ default: m.TextAssistant })));
const ImageTools = lazy(() => import('./components/ImageTools').then(m => ({ default: m.ImageTools })));
const RuralAssistant = lazy(() => import('./components/RuralAssistant').then(m => ({ default: m.RuralAssistant })));
const CourseGenerator = lazy(() => import('./components/CourseGenerator').then(m => ({ default: m.CourseGenerator })));
const VoiceConversation = lazy(() => import('./components/VoiceConversation').then(m => ({ default: m.VoiceConversation })));
const TextToSpeech = lazy(() => import('./components/TextToSpeech').then(m => ({ default: m.TextToSpeech })));
const DecisionAssistant = lazy(() => import('./components/DecisionAssistant').then(m => ({ default: m.DecisionAssistant })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

const LoadingView = () => (
  <div className="h-full w-full flex flex-col items-center justify-center bg-white/50">
    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
    <p className="text-emerald-900 font-bold text-xs uppercase tracking-widest text-center">Irimo gufungura...</p>
  </div>
);

export default function App() {
  const [currentView, setCurrentView] = useState<AppView | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [ttsInitialText, setTtsInitialText] = useState('');

  useEffect(() => {
    // Explicitly check for landing page enablement, defaulting to true if not set
    const landingPreference = localStorage.getItem('ai_rw_landing_enabled');
    const isLandingEnabled = landingPreference !== 'false'; 
    
    // Ensure we start at LANDING if enabled, otherwise go to CHAT
    setCurrentView(isLandingEnabled ? AppView.LANDING : AppView.CHAT);
    
    // Log the visit for analytics
    recordVisit().catch(console.error);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleNavigateToTTS = (text: string) => {
    setTtsInitialText(text);
    setCurrentView(AppView.TEXT_TO_SPEECH);
  };

  const handleViewChange = (view: AppView) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
    // Smooth scroll to top when changing views
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

  if (currentView === null) return <LoadingView />;

  // If we are in Landing View, we render only the Landing Page without the sidebar layout
  if (currentView === AppView.LANDING) {
    return (
      <ToastProvider>
        <LandingPage onStart={handleViewChange} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="flex h-screen w-full bg-stone-100 overflow-hidden font-sans">
        <Sidebar currentView={currentView} onChangeView={handleViewChange} isOpen={isSidebarOpen} />
        <div className="flex-1 flex flex-col min-w-0 relative h-full">
          {/* Background Pattern Overlay */}
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

          {/* Desktop Breadcrumbs Header */}
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

          {/* Main Content Viewport */}
          <main className="flex-1 overflow-hidden p-2 md:p-6 lg:p-8 relative z-10">
            <div className="h-full bg-white/95 backdrop-blur shadow-2xl rounded-[40px] border border-white/50 overflow-hidden">
               <Suspense fallback={<LoadingView />}>
                 {renderContent()}
               </Suspense>
            </div>
          </main>
        </div>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && <div className="fixed inset-0 bg-emerald-950/90 z-40 md:hidden backdrop-blur-sm animate-in fade-in" onClick={() => setIsSidebarOpen(false)} />}
      </div>
    </ToastProvider>
  );
}
