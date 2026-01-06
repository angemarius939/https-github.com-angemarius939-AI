
import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, User, Mic, MicOff, Search, X, AlertTriangle, Copy, Check, Smile, RefreshCw, Mountain, Sparkles, Image as ImageIcon, TrendingUp, Sprout, GraduationCap, ArrowRight, FileText, AudioLines, AlertCircle, Home } from 'lucide-react';
import { Message, MessageRole, Source, AppView } from '../types';
import { streamChatResponse } from '../services/geminiService';
import { Button } from './Button';
import { FormattedText } from './FormattedText';
import { SourcesToggle } from './SourcesToggle';

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
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const textBeforeListening = useRef('');
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const hasPlayedReceiveSound = useRef(false);

  const quickFeatures = [
    { view: AppView.RURAL_SUPPORT, icon: Sprout, label: 'Iterambere', color: 'bg-green-100 text-green-700' },
    { view: AppView.DECISION_ASSISTANT, icon: TrendingUp, label: 'Umujyanama', color: 'bg-amber-100 text-amber-700' },
    { view: AppView.COURSE_GENERATOR, icon: GraduationCap, label: 'Amasomo', color: 'bg-indigo-100 text-indigo-700' },
    { view: AppView.TEXT_TOOLS, icon: FileText, label: 'Umwandiko', color: 'bg-teal-100 text-teal-700' },
    { view: AppView.TEXT_TO_SPEECH, icon: AudioLines, label: 'Soma', color: 'bg-pink-100 text-pink-700' },
  ];

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Immediate scroll on first load and when messages significantly change
  useEffect(() => {
    if (!isSearchOpen) {
      const behavior = isStreaming ? 'auto' : 'smooth';
      // Small timeout to ensure DOM has updated after state change
      const timer = setTimeout(() => scrollToBottom(behavior), 10);
      return () => clearTimeout(timer);
    }
  }, [messages, isSearchOpen, isStreaming]);

  // Extra scroll check for mount
  useEffect(() => {
    const timer = setTimeout(() => scrollToBottom('auto'), 100);
    return () => clearTimeout(timer);
  }, []);

  const playUISound = (type: 'send' | 'receive' | 'click' | 'delete') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      if (type === 'click') {
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.05, now);
        osc.start(now); osc.stop(now + 0.05);
      } else if (type === 'send') {
        osc.frequency.setValueAtTime(300, now);
        gain.gain.setValueAtTime(0.08, now);
        osc.start(now); osc.stop(now + 0.15);
      } else if (type === 'receive') {
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.08, now);
        osc.start(now); osc.stop(now + 0.3);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'rw-RW';
      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; ++i) fullTranscript += event.results[i][0].transcript;
        setInputValue(textBeforeListening.current + ' ' + fullTranscript);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return alert("Browser yanyu ntabwo ishyigikiye ijwi.");
    if (isListening) recognitionRef.current.stop();
    else { textBeforeListening.current = inputValue; recognitionRef.current.start(); }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isStreaming) return;
    playUISound('send');
    const userMsg: Message = { id: Date.now().toString(), role: MessageRole.USER, text: inputValue, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsStreaming(true);
    hasPlayedReceiveSound.current = false;

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
        if (!hasPlayedReceiveSound.current && chunk.trim()) { playUISound('receive'); hasPlayedReceiveSound.current = true; }
        currentText += chunk;
        setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: currentText } : m));
      }, (newSources) => {
        newSources.forEach(s => uniqueSources.set(s.uri, s));
        setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, sources: Array.from(uniqueSources.values()) } : m));
      });
    } catch (error: any) {
      console.error("Chat error:", error);
      let errorMessage = 'Habaye ikibazo mu gushaka igisubizo. Ongera ugerageze mukanya.';
      
      if (error?.message === "API_KEY_MISSING") {
        errorMessage = 'Habaye ikibazo: API_KEY ntigaragara muri Vercel Settings. Nyamuneka yishyiremo kugira ngo porogaramu ikore.';
      } else if (error?.message === "INVALID_API_KEY") {
        errorMessage = 'Habaye ikibazo: API_KEY ukoresha ntabwo yemewe cyangwa ntabwo ikora. Nyamuneka yigenzure.';
      }
      
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

  const handleCopyMessage = (text: string, id: string) => { 
    navigator.clipboard.writeText(text); 
    setCopiedMessageId(id); 
    setTimeout(() => setCopiedMessageId(null), 2000); 
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => { 
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      handleSendMessage(); 
    } 
  };
  
  const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString('rw-RW', { hour: '2-digit', minute: '2-digit' });

  const filteredMessages = messages.filter(msg => 
    msg.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm overflow-hidden border border-emerald-100 relative">
      {isClearConfirmOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500"><AlertTriangle className="w-6 h-6" /></div>
              <div><h3 className="text-lg font-bold">Siba Ikiganiro?</h3><p className="text-sm text-stone-500 mt-1">Ese urizera neza ko ushaka gusiba iki kiganiro?</p></div>
              <div className="flex gap-3 w-full pt-2"><Button variant="secondary" className="flex-1" onClick={() => setIsClearConfirmOpen(false)}>Oya</Button><Button variant="danger" className="flex-1" onClick={confirmClearChat}>Yego</Button></div>
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
                className="w-full pl-9 pr-16 py-2 text-sm border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white" 
              />
              {searchQuery && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                  {filteredMessages.length}
                </div>
              )}
            </div>
            <Button variant="ghost" onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="hover:bg-red-50 text-red-500"><X className="w-5 h-5" /></Button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => onNavigate?.(AppView.LANDING)}
                className="p-2 hover:bg-emerald-100 rounded-lg text-emerald-700 transition-colors flex items-center gap-1.5"
                title="Genda ahabanza"
              >
                <div className="relative">
                   <Mountain className="w-5 h-5" />
                   <Sparkles className="w-2.5 h-2.5 text-emerald-500 absolute -top-1 -right-1" />
                </div>
              </button>
              <div className="animate-in fade-in"><h2 className="text-lg font-black text-emerald-950 uppercase tracking-tighter">ai.rw</h2></div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" onClick={() => setIsSearchOpen(true)} title="Shakisha"><Search className="w-5 h-5 text-emerald-700" /></Button>
              <Button variant="ghost" onClick={() => setIsClearConfirmOpen(true)} title="Siba byose"><RefreshCw className="w-5 h-5 text-stone-400" /></Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 relative">
        {isSearchOpen && searchQuery && filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-stone-400 space-y-3 animate-in fade-in zoom-in-95">
             <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 opacity-20" />
             </div>
             <p className="font-medium">Nta bisubizo byabonetse kuri "<strong>{searchQuery}</strong>"</p>
          </div>
        ) : (
          <>
            {filteredMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[90%] md:max-w-[85%] ${msg.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center mx-2 shadow-sm ${msg.role === MessageRole.USER ? 'bg-emerald-600' : msg.role === MessageRole.ERROR ? 'bg-red-50' : 'bg-emerald-800'}`}>
                    {msg.role === MessageRole.USER ? <User className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-white" />}
                  </div>
                  <div className="flex flex-col">
                    <div className={`p-4 md:p-6 rounded-3xl shadow-sm min-w-[80px] group relative animate-in fade-in slide-in-from-bottom-2 ${msg.role === MessageRole.USER ? 'bg-emerald-600 text-white rounded-tr-none' : msg.role === MessageRole.ERROR ? 'bg-red-50 text-red-600 border border-red-200 rounded-tl-none' : 'bg-white text-stone-800 border border-emerald-100 rounded-tl-none'}`}>
                      <FormattedText text={msg.text} searchQuery={searchQuery} />
                      {isStreaming && msg.role === MessageRole.MODEL && msg.id === streamingMessageId && !msg.text && <div className="py-2"><div className="flex space-x-1"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-75"></div><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-150"></div></div></div>}
                      
                      {msg.sources && msg.sources.length > 0 && <SourcesToggle sources={msg.sources} className="mt-4" />}

                      <div className="flex items-center justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        {msg.role === MessageRole.MODEL && msg.text && <button onClick={() => handleCopyMessage(msg.text, msg.id)} className="p-1.5 rounded transition-colors hover:bg-emerald-50 text-stone-400">{copiedMessageId === msg.id ? <Check size={14} /> : <Copy size={14} />}</button>}
                        <span className={`text-[10px] font-black uppercase ${msg.role === MessageRole.USER ? 'text-white/50' : 'text-stone-400'}`}>{formatTime(msg.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {messages.length <= 1 && !searchQuery && !isSearchOpen && (
          <div className="space-y-6">
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 animate-in fade-in duration-700 delay-300">
              {quickFeatures.map((feat, idx) => (
                <button key={idx} onClick={() => onNavigate?.(feat.view)} className={`flex flex-col items-center p-6 rounded-[32px] border border-emerald-100 shadow-sm transition-all hover:-translate-y-2 ${feat.color} bg-opacity-5 hover:bg-opacity-10`}>
                  <div className={`p-4 rounded-2xl mb-4 ${feat.color} bg-opacity-20`}><feat.icon className="w-8 h-8" /></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-center">{feat.label}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-center animate-in fade-in delay-500">
               <button 
                 onClick={() => onNavigate?.(AppView.LANDING)}
                 className="flex items-center gap-2 px-6 py-3 rounded-full bg-stone-100 text-stone-600 font-bold text-xs uppercase tracking-widest hover:bg-emerald-100 hover:text-emerald-700 transition-all border border-stone-200"
               >
                 <Home className="w-4 h-4" />
                 Genda ahabanza (Go Home)
               </button>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {!isSearchOpen && (
        <div className="p-4 md:p-6 bg-white border-t border-emerald-100 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-end gap-3 max-w-4xl mx-auto">
            <textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder="Baza ai.rw icyo wifuza..." className="w-full p-4 border-2 border-emerald-100 rounded-[24px] focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none resize-none h-14 md:h-16 bg-slate-50/50 text-stone-800 font-medium shadow-inner" disabled={isStreaming} />
            <Button variant="secondary" onClick={toggleListening} className={`h-14 w-14 md:h-16 md:w-16 rounded-full transition-all ${isListening ? 'animate-pulse bg-red-100 text-red-600 border-red-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200'}`} disabled={isStreaming}>{isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}</Button>
            <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isStreaming} isLoading={isStreaming} className="h-14 w-14 md:h-16 md:w-16 rounded-full shadow-xl shadow-emerald-500/20 active:scale-95 transition-transform"><Send className="w-6 h-6" /></Button>
          </div>
        </div>
      )}
    </div>
  );
};
