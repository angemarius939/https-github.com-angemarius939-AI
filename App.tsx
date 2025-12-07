
import React, { useState } from 'react';
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

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [ttsInitialText, setTtsInitialText] = useState('');

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleNavigateToTTS = (text: string) => {
    setTtsInitialText(text);
    setCurrentView(AppView.TEXT_TO_SPEECH);
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.CHAT:
        return <ChatInterface />;
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
        return <ChatInterface />;
    }
  };

  return (
    <ToastProvider>
      <div className="flex h-screen bg-stone-100 overflow-hidden font-sans">
        {/* Sidebar for Desktop & Mobile (controlled) */}
        <Sidebar 
          currentView={currentView} 
          onChangeView={(view) => {
            setCurrentView(view);
            setIsSidebarOpen(false); // Close sidebar on mobile after selection
          }} 
          isOpen={isSidebarOpen} 
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Background Pattern for Main Content */}
          <div className="absolute inset-0 rwanda-pattern-light opacity-60 pointer-events-none z-0"></div>

          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between p-4 bg-black text-white border-b border-white/10 relative z-10">
            <h1 className="text-lg font-bold">ai.rw</h1>
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white focus:outline-none"
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
            className="fixed inset-0 bg-black/80 z-20 md:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </ToastProvider>
  );
}
