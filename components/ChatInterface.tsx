
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, User, Mic, MicOff, Search, X, AlertTriangle, Copy, Check, RefreshCw, Sparkles, TrendingUp, Sprout, GraduationCap, FileText, AudioLines, Home } from 'lucide-react';
import { Message, MessageRole, Source, AppView } from '../types';
import { streamChatResponse } from '../services/geminiService';
import { Button } from './Button';
import { FormattedText } from './FormattedText';
import { SourcesToggle } from './SourcesToggle';
import { Logo } from './Logo';

interface ChatInterfaceProps {
  onNavigate?: (view: AppView) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: MessageRole.MODEL,
      text: 'Muraho! Nitwa **ai.rw**, umufasha wawe mu Kinyarwanda. \n\nNagufasha iki uyu munsi? Hitamo muri serivisi ziri hasi cyangwa unyandikire hano.',
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const quickFeatures = [
    { view: AppView.RURAL_SUPPORT, icon: Sprout, label: 'Iterambere', color: 'bg-green-100 text-green-700' },
    { view: AppView.DECISION_ASSISTANT, icon: TrendingUp, label: 'Umujyanama', color: 'bg-amber-100 text-amber-700' },
    { view: AppView.COURSE_GENERATOR, icon: GraduationCap, label: 'Amasomo', color: 'bg-indigo-100 text-indigo-700' },
    { view: AppView.TEXT_TOOLS, icon: FileText, label: 'Umwandiko', color: 'bg-teal-100 text-teal-700' },
    { view: AppView.TEXT_TO_SPEECH, icon: AudioLines, label: 'Soma', color: 'bg-pink-100 text-pink-700' },
  ];

  const filteredMessages = useMemo(() => {
    if (!isSearchOpen || !searchQuery.trim()) return messages;
    const query = searchQuery.toLowerCase();
    return messages.filter(msg => msg.text.toLowerCase().includes(query));
  }, [messages, isSearchOpen, searchQuery]);

  // Robust auto-scroll logic
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  };

  // Scroll on message list changes or search toggle
  useEffect(() => {
    if (!isSearchOpen || !searchQuery) {
      // Use requestAnimationFrame to ensure DOM is rendered
      const handle = requestAnimationFrame(() => {
        scrollToBottom(isStreaming ? 'auto' : 'smooth');
      });
      return () => cancelAnimationFrame(handle);
    }
  }, [messages.length, isStreaming, isSearchOpen]);

  // Handle updates while streaming content
  useEffect(() => {
    if (isStreaming && streamingMessageId) {
      scrollToBottom('auto');
    }
  }, [messages.find(m => m.id === streamingMessageId)?.text]);

  // Scroll to bottom on initial load
  useEffect(() => {
    scrollToBottom('auto');
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isStreaming) return;
    
    if (isSearchOpen) {
      setIsSearchOpen(false);
      setSearchQuery('');
    }

    const userMsg: Message = { id: Date.now().toString(), role: MessageRole.USER, text: inputValue, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsStreaming(true);

    const history = messages.map(m => ({
      role: m.role === MessageRole.USER ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const modelMsgId = (Date.now() + 1).toString();
    setStreamingMessageId(modelMsgId);
    setMessages(prev => [...prev, { id: modelMsgId, role: MessageRole.MODEL, text: '', timestamp: Date.now(), sources: [] }]);

    try {
      let currentText = '';
      const uniqueSources = new Map<string, Source>();
      await streamChatResponse(history, userMsg.text, (chunk) => {
        currentText += chunk;
        setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: currentText } : m));
      }, (newSources) => {
        newSources.forEach(s => uniqueSources.set(s.uri, s));
        setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, sources: Array.from(uniqueSources.values()) } : m));
      });
    } catch (error: any) {
      let errorMessage = 'Habaye ikibazo mu gushaka igisubizo. Ongera ugerageze mukanya.';
      if (error?.message === "API_KEY_MISSING") errorMessage = 'Habaye ikibazo: API_KEY ntigaragara muri Vercel Settings.';
      else if (error?.message === "INVALID_API_KEY") errorMessage = 'Habaye ikibazo: API_KEY ukoresha ntabwo yemewe cyangwa ntabwo ikora.';
      setMessages(prev => prev.filter(m => m.id !== modelMsgId).concat([{
        id: Date.now().toString(), role: MessageRole.ERROR, text: errorMessage, timestamp: Date.now()
      }]));
    } finally { 
      setIsStreaming(false); 
      setStreamingMessageId(null);
    }
  };

  const confirmClearChat = () => {
    setMessages([{ id: Date.now().toString(), role: MessageRole.MODEL, text: 'Ikiganiro gishya cyatangiye!', timestamp: Date.now() }]);
    setIsClearConfirmOpen(false);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm overflow-hidden border border-emerald-100 relative">
      {isClearConfirmOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500 mx-auto"><AlertTriangle className="w-6 h-6" /></div>
            <h3 className="text-lg font-bold">Siba Ikiganiro?</h3>
            <div className="flex gap-3 w-full"><Button variant="secondary" className="flex-1" onClick={() => setIsClearConfirmOpen(false)}>Oya</Button><Button variant="danger" className="flex-1" onClick={confirmClearChat}>Yego</Button></div>
          </div>
        </div>
      )}

      <div className="p-4 border-b border-emerald-100 flex justify-between items-center bg-emerald-50/50 relative z-10">
        {isSearchOpen ? (
          <div className="flex items-center w-full gap-2 animate-in slide-in-from-top-2 duration-300">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
              <input 
                autoFocus 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="Shakisha mu kiganiro..." 
                className="w-full pl-9 pr-4 py-2 text-sm border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white font-medium" 
              />
              {searchQuery && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                   {filteredMessages.length} results
                </div>
              )}
            </div>
            <Button variant="ghost" onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="text-red-500"><X className="w-5 h-5" /></Button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <button onClick={() => onNavigate?.(AppView.LANDING)} className="transition-transform active:scale-95">
                <Logo size="sm" />
              </button>
              <h2 className="text-lg font-black text-emerald-950 uppercase tracking-tighter">ai.rw</h2>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" onClick={() => setIsSearchOpen(true)}><Search className="w-5 h-5 text-emerald-700" /></Button>
              <Button variant="ghost" onClick={() => setIsClearConfirmOpen(true)}><RefreshCw className="w-5 h-5 text-stone-400" /></Button>
            </div>
          </div>
        )}
      </div>

      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 relative custom-scrollbar scroll-smooth">
        {filteredMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[90%] md:max-w-[85%] ${msg.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center mx-2 shadow-sm ${msg.role === MessageRole.USER ? 'bg-emerald-600' : 'bg-emerald-800'}`}>
                {msg.role === MessageRole.USER ? <User className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-white" />}
              </div>
              <div className={`p-4 md:p-6 rounded-3xl shadow-sm animate-in fade-in slide-in-from-bottom-2 ${msg.role === MessageRole.USER ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white text-stone-800 border border-emerald-100 rounded-tl-none'}`}>
                <FormattedText text={msg.text} searchQuery={searchQuery} />
                {msg.sources && msg.sources.length > 0 && <SourcesToggle sources={msg.sources} className="mt-4" />}
                <div className={`text-[9px] mt-2 font-bold opacity-40 ${msg.role === MessageRole.USER ? 'text-white text-right' : 'text-stone-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isSearchOpen && searchQuery && filteredMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400">
            <Search className="w-12 h-12 mb-4 opacity-10" />
            <p className="font-bold text-sm uppercase tracking-widest">Nta kintu cyabonetse kuri "{searchQuery}"</p>
          </div>
        )}

        {messages.length <= 1 && !searchQuery && !isSearchOpen && (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 animate-in fade-in duration-700 delay-300">
            {quickFeatures.map((feat, idx) => (
              <button key={idx} onClick={() => onNavigate?.(feat.view)} className={`flex flex-col items-center p-6 rounded-[32px] border border-emerald-100 shadow-sm transition-all hover:-translate-y-2 ${feat.color} bg-opacity-5 hover:bg-opacity-10`}>
                <div className={`p-4 rounded-2xl mb-4 ${feat.color} bg-opacity-20`}><feat.icon className="w-8 h-8" /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-center">{feat.label}</span>
              </button>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} className="h-4 clear-both" />
      </div>

      <div className="p-4 md:p-6 bg-white border-t border-emerald-100">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <textarea 
            value={inputValue} 
            onChange={(e) => setInputValue(e.target.value)} 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Baza ai.rw icyo wifuza..." 
            className="w-full p-4 border-2 border-emerald-100 rounded-[24px] focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none h-14 md:h-16 bg-slate-50/50 transition-all font-medium" 
            disabled={isStreaming} 
          />
          <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isStreaming} isLoading={isStreaming} className="h-14 w-14 md:h-16 md:w-16 rounded-full shadow-xl"><Send className="w-6 h-6" /></Button>
        </div>
      </div>
    </div>
  );
};
