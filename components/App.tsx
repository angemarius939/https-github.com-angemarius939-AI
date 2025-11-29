import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { TextAssistant } from './components/TextAssistant';
import { ImageTools } from './components/ImageTools';
import { AppView } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderView = () => {
    switch (currentView) {
      case AppView.CHAT:
        return <ChatInterface />;
      case AppView.TEXT_TOOLS:
        return <TextAssistant />;
      case AppView.IMAGE_TOOLS:
        return <ImageTools />;
      default:
        return <ChatInterface />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
          <h1 className="text-lg font-bold text-slate-800">ai.rw</h1>
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 focus:outline-none"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* View Container */}
        <main className="flex-1 overflow-hidden p-2 md:p-6">
          {renderView()}
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}