
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Menu, X, Loader2 } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { ToastProvider } from './components/ToastProvider';
import { AppView } from './types';
import { recordVisit } from './services/statsService';

// Lazy load non-landing components for faster initial boot
const TextAssistant = lazy(() => import('./components/TextAssistant').then(m => ({ default: m.TextAssistant })));
const ImageTools = lazy(() => import('./components/ImageTools').then(m => ({ default: m.ImageTools })));
const RuralAssistant = lazy(() => import('./components/RuralAssistant').then(m => ({ default: m.RuralAssistant })));
const CourseGenerator = lazy(() => import('./components/CourseGenerator').then(m => ({ default: m.CourseGenerator })));
const VoiceConversation = lazy(() => import('./components/VoiceConversation').then(m => ({ default: m.VoiceConversation })));
const TextToSpeech = lazy(() => import('./components/TextToSpeech').then(m => ({ default: m.TextToSpeech })));
const DecisionAssistant = lazy(() => import('./components/DecisionAssistant').then(m => ({ default: m.DecisionAssistant })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

const LoadingView = () => (
  <div className="h-full w-full flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm">
    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
    <p className="text-emerald-900 font-bold text-xs uppercase tracking-widest">Irimo gufungura...</p>
  </div>
);

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [ttsInitialText, setTtsInitialText] = useState('');

  useEffect(() => {
    // Non-blocking visit recording
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
  };

  const getPageTitle = () => {
    switch (currentView) {
      case AppView.CHAT: return 'Ikiganiro';
      case AppView.VOICE_CONVERSATION: return 'Kuvuga';
      case AppView.TEXT_TO_SPEECH: return 'Soma Inyandiko';
      case AppView.TEXT_TOOLS: return 'Umwandiko';
      case AppView.IMAGE_TOOLS: return 'Amafoto';
      case AppView.RURAL_SUPPORT: return 'Iterambere';
      case AppView.DECISION_ASSISTANT: return 'Umujyanama';
      case AppView.COURSE_GENERATOR: return 'Amasomo';
      case AppView.ADMIN: return 'Admin';
      default: return 'ai.rw';
    }
  };

  const renderView = () => {
    return (
      <Suspense fallback={<LoadingView />}>
        {(() => {
          switch (currentView) {
            case AppView.CHAT:
              return <ChatInterface onNavigate={handleViewChange} />;
            case AppView.VOICE_CONVERSATION:
              return <VoiceConversation />;
            case AppView.TEXT_TO_SPEECH:
              return <TextToSpeech initialText={ttsInitialText} />;
            case AppView.TEXT_TOOLS:
              return <TextAssistant onNavigateToTTS={handleNavigateToTTS} />;
            case AppView.IMAGE_TOOLS:
              return <ImageTools onNavigateToTTS={handleNavigateToTTS} />;
            case AppView.RURAL_SUPPORT:
              return <RuralAssistant />;
            case AppView.DECISION_ASSISTANT:
              return <DecisionAssistant />;
            case AppView.COURSE_GENERATOR:
              return <CourseGenerator />;
            case AppView.ADMIN:
              return <AdminDashboard />;
            default:
              return <ChatInterface onNavigate={handleViewChange} />;
          }
        })()}
      </Suspense>
    );
  };

  return (
    <ToastProvider>
      <div className="flex h-screen bg-stone-100 overflow-hidden font-sans">
        <Sidebar 
          currentView={currentView} 
          onChangeView={handleViewChange} 
          isOpen={isSidebarOpen} 
        />

        <div className="flex-1 flex flex-col min-w-0 relative">
          <div className="absolute inset-0 rwanda-pattern-light opacity-60 pointer-events-none z-0"></div>

          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between p-4 bg-black text-white border-b border-white/10 relative z-10 shadow-lg">
            <div className="flex items-center gap-3">
               <div className="bg-emerald-500 p-1.5 rounded-lg shadow-sm">
                 <span className="text-black font-black text-xs">AI.RW</span>
               </div>
               <h1 className="text-sm font-black uppercase tracking-widest">{getPageTitle()}</h1>
            </div>
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white focus:outline-none transition-all active:scale-95"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          <main className="flex-1 overflow-hidden p-3 md:p-8 relative z-10">
            <div className="h-full bg-white/40 backdrop-blur-sm rounded-[32px] border border-white/40 shadow-2xl overflow-hidden transition-all duration-700 ease-in-out">
               {renderView()}
            </div>
          </main>
        </div>

        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/90 z-20 md:hidden backdrop-blur-md animate-in fade-in"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </ToastProvider>
  );
}
