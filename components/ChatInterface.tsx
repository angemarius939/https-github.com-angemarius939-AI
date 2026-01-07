
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, User, Mic, MicOff, Search, X, AlertTriangle, Copy, Check, RefreshCw, Sparkles, TrendingUp, Sprout, GraduationCap, FileText, AudioLines, ImageIcon, MessageSquare, ArrowDown, Lightbulb } from 'lucide-react';
import { Message, MessageRole, Source, AppView } from '../types';
import { streamChatResponse } from '../services/geminiService';
import { Button } from './Button';
import { FormattedText } from './FormattedText';
import { SourcesToggle } from './SourcesToggle';
import { Logo } from './Logo';
import { useToast } from './ToastProvider';

interface ChatInterfaceProps {
  onNavigate?: (view: AppView) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: MessageRole.MODEL,
      text: 'Muraho! Nitwa **ai.rw**, umufasha wawe mu Kinyarwanda. \n\nUbu turi mu **Kiganiro**. Nagufasha iki uyu munsi? Hitamo muri serivisi zihariye ziri hasi cyangwa unyandikire hano maze tuganire.',
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const quickFeatures = [
    { view: AppView.RURAL_SUPPORT, icon: Sprout, label: "Iterambere", color: 'bg-emerald-100 text-emerald-700' },
    { view: AppView.DECISION_ASSISTANT, icon: TrendingUp, label: 'Umujyanama', color: 'bg-blue-100 text-blue-700' },
    { view: AppView.COURSE_GENERATOR, icon: GraduationCap, label: 'Amasomo', color: 'bg-indigo-100 text-indigo-700' },
    { view: AppView.TEXT_TOOLS, icon: FileText, label: 'Umwandiko', color: 'bg-amber-100 text-amber-700' },
    { view: AppView.TEXT_TO_SPEECH, icon: AudioLines, label: 'Soma', color: 'bg-rose-100 text-rose-700' },
    { view: AppView.IMAGE_TOOLS, icon: ImageIcon, label: 'Amafoto', color: 'bg-purple-100 text-purple-700' },
  ];

  const filteredMessages = useMemo(() => {
    if (!isSearchOpen || !searchQuery.trim()) return messages;
    const query = searchQuery.toLowerCase();
    return messages.filter(msg => msg.text.toLowerCase().includes(query));
  }, [messages, isSearchOpen, searchQuery]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  };

  const handleScroll = () => {
    if (!scrollAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 150;
    setShouldAutoScroll(isAtBottom);
  };

  // Improved scroll effect: listens to changes in message count and content during streaming
  useEffect(() => {
    if (shouldAutoScroll || isStreaming) {
      scrollToBottom(isStreaming ? 'auto' : 'smooth');
    }
  }, [messages.length, isStreaming, messages[messages.length - 1]?.text]);

  // Handle Resize for mobile keyboards etc.
  useEffect(() => {
    if (!scrollAreaRef.current) return;
    const observer = new ResizeObserver(() => {
      if (shouldAutoScroll) scrollToBottom('auto');
    });
    observer.observe(scrollAreaRef.current);
    return () => observer.disconnect();
  }, [shouldAutoScroll]);

  // Initial focus
  useEffect(() => {
    inputRef.current?.focus();
    scrollToBottom('auto');
  }, []);

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || inputValue;
    if (!textToSend.trim() || isStreaming) return;
    
    if (isSearchOpen) {
      setIsSearchOpen(false);
      setSearchQuery('');
    }

    const userMsg: Message = { id: Date.now().toString(), role: MessageRole.USER, text: textToSend, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsStreaming(true);
    setShouldAutoScroll(true);

    const history = messages
      .filter(m => m.role !== MessageRole.ERROR)
      .map(m => ({
        role: m.role === MessageRole.USER ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

    const modelMsgId = (Date.now() + 1).toString();
    setStreamingMessageId(modelMsgId);
    setMessages(prev => [...prev, { id: modelMsgId, role: MessageRole.MODEL, text: '', timestamp: Date.now(), sources: [] }]);

    try {
      let currentText = '';
      const uniqueSources = new Map<string, Source>();
      await streamChatResponse(history, textToSend, (chunk) => {
        currentText += chunk;
        setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: currentText } : m));
      }, (newSources) => {
        newSources.forEach(s => uniqueSources.set(s.uri, s));
        setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, sources: Array.from(uniqueSources.values()) } : m));
      });
    } catch (error: any) {
      const errorMessage = 'Habaye ikibazo mu gushaka igisubizo. Ongera ugerageze mukanya.';
      setMessages(prev => prev.filter(m => m.id !== modelMsgId).concat([{
        id: Date.now().toString(), role: MessageRole.ERROR, text: errorMessage, timestamp: Date.now()
      }]));
      showToast(errorMessage, 'error');
    } finally { 
      setIsStreaming(false); 
      setStreamingMessageId(null);
      inputRef.current?.focus();
    }
  };

  const confirmClearChat = () => {
    setMessages([{ id: Date.now().toString(), role: MessageRole.MODEL, text: 'Ikiganiro gishya cyatangiye!', timestamp: Date.now() }]);
    setIsClearConfirmOpen(false);
    setSearchQuery('');
    setIsSearchOpen(false);
    inputRef.current?.focus();
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    showToast('Byakoporowe!', 'info');
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm overflow-hidden border border-emerald-100 relative">
      {isClearConfirmOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 border border-emerald-50">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500 mx-auto"><AlertTriangle className="w-6 h-6" /></div>
            <h3 className="text-lg font-black text-stone-900">Gusiba Ikiganiro?</h3>
            <p className="text-sm text-stone-500">Ibi bintu ntibishobora kugarurwa.</p>
            <div className="flex gap-3 w-full">
              <Button variant="secondary" className="flex-1" onClick={() => setIsClearConfirmOpen(false)}>Oya</Button>
              <Button variant="danger" className="flex-1" onClick={confirmClearChat}>Yego, Siba</Button>
            </div>
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
                className="w-full pl-9 pr-12 py-2 text-sm border border-emerald-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-emerald-500/10 bg-white font-medium" 
              />
              {searchQuery && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded shadow-sm border border-emerald-200">
                   {filteredMessages.length} ibisubizo
                </div>
              )}
            </div>
            <Button variant="ghost" onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="text-red-500"><X className="w-5 h-5" /></Button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
              <h2 className="text-lg font-black text-emerald-950 uppercase tracking-tighter">ai.rw <span className="text-emerald-500 ml-1 opacity-50">• Ikiganiro</span></h2>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" onClick={() => setIsSearchOpen(true)} title="Shakisha"><Search className="w-5 h-5 text-emerald-700" /></Button>
              <Button variant="ghost" onClick={() => setIsClearConfirmOpen(true)} title="Siba byose"><RefreshCw className="w-5 h-5 text-stone-400" /></Button>
            </div>
          </div>
        )}
      </div>

      <div 
        ref={scrollAreaRef} 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 relative custom-scrollbar scroll-smooth"
      >
        <div className="space-y-6 min-h-full flex flex-col justify-end">
          {filteredMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[90%] md:max-w-[85%] ${msg.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center mx-2 shadow-sm ${msg.role === MessageRole.USER ? 'bg-emerald-600' : 'bg-emerald-800'}`}>
                  {msg.role === MessageRole.USER ? <User className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-white" />}
                </div>
                <div className={`group relative p-4 md:p-6 rounded-3xl shadow-sm animate-in fade-in slide-in-from-bottom-2 ${
                  msg.role === MessageRole.USER ? 'bg-emerald-600 text-white rounded-tr-none' : 
                  msg.role === MessageRole.ERROR ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-none' :
                  'bg-white text-stone-800 border border-emerald-100 rounded-tl-none'
                }`}>
                  {msg.role === MessageRole.MODEL && msg.text && (
                    <button 
                      onClick={() => handleCopyMessage(msg.id, msg.text)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-emerald-50 text-emerald-600 opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-100"
                      title="Koporora"
                    >
                      {copiedMessageId === msg.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                  
                  <FormattedText text={msg.text} searchQuery={searchQuery} />
                  {msg.sources && msg.sources.length > 0 && <SourcesToggle sources={msg.sources} className="mt-4" />}
                  
                  <div className={`text-[9px] mt-2 font-bold opacity-40 ${msg.role === MessageRole.USER ? 'text-white text-right' : 'text-stone-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <div ref={messagesEndRef} className="h-4 clear-both" />
        </div>

        {!shouldAutoScroll && messages.length > 3 && !isSearchOpen && (
          <button 
            onClick={() => scrollToBottom('smooth')}
            className="fixed bottom-32 right-8 md:right-12 p-3 bg-white text-emerald-600 rounded-full shadow-2xl border border-emerald-100 hover:bg-emerald-50 transition-all animate-bounce"
          >
            <ArrowDown className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="p-4 md:p-6 bg-white border-t border-emerald-100">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <textarea 
            ref={inputRef}
            value={inputValue} 
            onChange={(e) => setInputValue(e.target.value)} 
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Baza ai.rw icyo wifuza..." 
            className="w-full p-4 border-2 border-emerald-100 rounded-[24px] focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none h-14 md:h-16 bg-slate-50/50 transition-all font-medium resize-none" 
            disabled={isStreaming} 
          />
          <Button 
            onClick={() => handleSendMessage()} 
            disabled={!inputValue.trim() || isStreaming} 
            isLoading={isStreaming} 
            className="h-14 w-14 md:h-16 md:w-16 rounded-full shadow-xl flex-shrink-0"
          >
            <Send className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};
