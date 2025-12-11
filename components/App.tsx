
import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { TextAssistant } from './components/TextAssistant';
import { ImageTools } from './components/ImageTools';
import { RuralAssistant } from './components/RuralAssistant';
import { CourseGenerator } from './components/CourseGenerator';
import { VoiceConversation } from './components/VoiceConversation';
import { TextToSpeech } from './components/TextToSpeech';
import { DecisionAssistant } from './components/DecisionAssistant';
import { AdminDashboard } from './components/AdminDashboard';
import { ToastProvider } from './components/ToastProvider';
import { AppView } from './types';
import { recordVisit } from './services/statsService';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [ttsInitialText, setTtsInitialText] = useState('');

  // Track visit on mount
  useEffect(() => {
    recordVisit();
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
  };

  return (
    <ToastProvider>
      <div className="flex h-screen bg-stone-100 overflow-hidden font-sans" aria-label="User interface element">
        {/* Sidebar for Desktop & Mobile (controlled) */}
        <Sidebar 
          currentView={currentView} 
          onChangeView={handleViewChange} 
          isOpen={isSidebarOpen} 
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Background Pattern for Main Content */}
          <div className="absolute inset-0 rwanda-pattern-light opacity-60 pointer-events-none z-0"></div>

          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between p-4 bg-black text-white border-b border-white/10 relative z-10 shadow-md">
            <div className="flex items-center gap-2">
               <span className="text-emerald-400 font-bold tracking-wider text-sm">ai.rw</span>
               <span className="text-stone-500">|</span>
               <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
            </div>
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white focus:outline-none transition-colors"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* View Container */}
          <main className="flex-1 overflow-hidden p-2 md:p-6 relative z-10">
            {renderView()}
          </main>
        </div>

        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/80 z-20 md:hidden backdrop-blur-sm animate-in fade-in"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </ToastProvider>
  );
}
