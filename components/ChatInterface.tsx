
import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, User, Mic, MicOff, Search, X, AlertTriangle, Copy, Check, Smile, RefreshCw, Sparkles, Image as ImageIcon, TrendingUp, Sprout, GraduationCap, ArrowRight, FileText, AudioLines } from 'lucide-react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const textBeforeListening = useRef('');
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showInputEmoji, setShowInputEmoji] = useState(false);
  const [activeReactionId, setActiveReactionId] = useState<string | null>(null);
  const hasPlayedReceiveSound = useRef(false);

  const emojiList = ['👍', '👎', '❤️', '🔥', '🎉', '🤔', '😂', '👋', '🤖', '✅', '✨', '🚀'];
  const reactionList = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

  // Check for admin visibility
  const isAdmin = typeof window !== 'undefined' && localStorage.getItem('ai_rw_admin_active') === 'true';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!searchQuery) {
      scrollToBottom();
    }
  }, [messages, searchQuery, isSearchOpen]);

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
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'send') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'receive') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.3);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'delete') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
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
      recognitionRef.current.onerror = () => setIsListening(false);

      recognitionRef.current.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
             fullTranscript += event.results[i][0].transcript;
        }
        const separator = textBeforeListening.current && !textBeforeListening.current.endsWith(' ') && fullTranscript ? ' ' : '';
        setInputValue(textBeforeListening.current + separator + fullTranscript);
      };
    }
    
    return () => {
        if(recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const toggleListening = () => {
    playUISound('click');
    if (!recognitionRef.current) {
      alert("Browser yanyu ntabwo ishyigikiye kwandika ukoresheje ijwi.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      textBeforeListening.current = inputValue;
      recognitionRef.current.start();
    }
  };

  const handleSendMessage = async () => {
    if (isListening && recognitionRef.current) recognitionRef.current.stop();
    if (!inputValue.trim() || isStreaming) return;

    playUISound('send');
    if (isSearchOpen) {
      setSearchQuery('');
      setIsSearchOpen(false);
    }
    setShowInputEmoji(false);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsStreaming(true);
    hasPlayedReceiveSound.current = false;

    const history = messages.map(m => ({
      role: m.role === MessageRole.USER ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const modelMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: modelMsgId,
      role: MessageRole.MODEL,
      text: '', 
      timestamp: Date.now(),
      sources: []
    }]);

    try {
      let currentText = '';
      const uniqueSources = new Map<string, Source>();

      await streamChatResponse(
        history, 
        userMsg.text, 
        (chunk) => {
          if (!hasPlayedReceiveSound.current && chunk.trim()) {
            playUISound('receive');
            hasPlayedReceiveSound.current = true;
          }
          currentText += chunk;
          setMessages(prev => prev.map(m => 
            m.id === modelMsgId ? { ...m, text: currentText } : m
          ));
        },
        (newSources) => {
           newSources.forEach(s => uniqueSources.set(s.uri, s));
           const sourceArray = Array.from(uniqueSources.values());
           setMessages(prev => prev.map(m => 
             m.id === modelMsgId ? { ...m, sources: sourceArray } : m
           ));
        }
      );
    } catch (error: any) {
      console.error("Chat error:", error);
      let errorMessage = 'Habaye ikibazo cya tekinike. Ongera ugerageze mukanya.';
      
      if (error?.message === "API_KEY_MISSING" || error?.toString().includes("401") || error?.toString().includes("403")) {
        errorMessage = "Ikibazo cya API Key: Nyamuneka reba niba API Key yashyizwemo neza muri Environment Variables ya Vercel (Production environment).";
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: MessageRole.ERROR,
        text: errorMessage,
        timestamp: Date.now()
      }]);
    } finally {
      setIsStreaming(false);
    }
  };

  const confirmClearChat = () => {
    playUISound('delete');
    setMessages([{
      id: Date.now().toString(),
      role: MessageRole.MODEL,
      text: 'Ikiganiro gishya cyatangiye. Niteguye kugufasha!',
      timestamp: Date.now()
    }]);
    setSearchQuery('');
    setInputValue('');
    setIsSearchOpen(false);
    setIsClearConfirmOpen(false);
  };

  const handleQuickClear = () => {
     playUISound('delete');
     confirmClearChat();
  }

  const handleClearInput = () => {
    setInputValue('');
    playUISound('click');
  };

  const handleDeleteMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
    playUISound('click');
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    playUISound('click');
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleReaction = (msgId: string, emoji: string) => {
    playUISound('click');
    setMessages(prev => prev.map(msg => 
      msg.id === msgId ? { ...msg, reaction: msg.reaction === emoji ? undefined : emoji } : msg
    ));
    setActiveReactionId(null);
  };

  const handleAddInputEmoji = (emoji: string) => {
    setInputValue(prev => prev + emoji);
    playUISound('click');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('rw-RW', { hour: '2-digit', minute: '2-digit' });
  };

  const navigateTo = (view: AppView) => {
     if (onNavigate) onNavigate(view);
  };

  const filteredMessages = messages.filter(msg => 
    msg.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;

  const quickFeatures = [
    { view: AppView.RURAL_SUPPORT, icon: Sprout, label: 'Iterambere', color: 'bg-green-100 text-green-700', description: 'Inama z\'ubuhinzi' },
    { view: AppView.DECISION_ASSISTANT, icon: TrendingUp, label: 'Umujyanama', color: 'bg-amber-100 text-amber-700', description: 'Gusesengura' },
    { view: AppView.COURSE_GENERATOR, icon: GraduationCap, label: 'Amasomo', color: 'bg-indigo-100 text-indigo-700', description: 'Tegura isomo' },
    { view: AppView.TEXT_TOOLS, icon: FileText, label: 'Umwandiko', color: 'bg-teal-100 text-teal-700', description: 'Kosora inyandiko' },
    { view: AppView.TEXT_TO_SPEECH, icon: AudioLines, label: 'Soma', color: 'bg-pink-100 text-pink-700', description: 'Hindura ijwi' },
    ...(isAdmin ? [
        { view: AppView.IMAGE_TOOLS, icon: ImageIcon, label: 'Amafoto', color: 'bg-purple-100 text-purple-700', description: 'Hanga ishusho' },
        { view: AppView.VOICE_CONVERSATION, icon: Mic, label: 'Kuvuga', color: 'bg-blue-100 text-blue-700', description: 'Ganira na AI' },
    ] : []),
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm overflow-hidden border border-emerald-100 relative">
      {/* Confirmation Modal */}
      {isClearConfirmOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-red-100 scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">Siba Ikiganiro?</h3>
                <p className="text-sm text-stone-500 mt-1">
                  Ese urizera neza ko ushaka gusiba iki kiganiro? Ibyo waganiriye byose birahita bigenda.
                </p>
              </div>
              <div className="flex gap-3 w-full pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => { playUISound('click'); setIsClearConfirmOpen(false); }}>Oya, Bireke</Button>
                <Button variant="danger" className="flex-1" onClick={confirmClearChat}>Yego, Siba</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-emerald-100 flex justify-between items-center bg-emerald-50/50 min-h-[72px]">
        {isSearchOpen ? (
          <div className="flex items-center w-full gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500" />
              <input 
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Shakisha mu kiganiro..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
            <Button variant="ghost" onClick={() => { playUISound('click'); setIsSearchOpen(false); setSearchQuery(''); }} className="p-2 h-10 w-10 text-stone-500 hover:text-stone-700">
              <X className="w-5 h-5" />
            </Button>
          </div>
        ) : (
          <>
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
              <h2 className="text-lg font-black text-emerald-950 uppercase tracking-tight">ai.rw</h2>
              <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest opacity-80">Ubufasha mu Kinyarwanda</p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" onClick={() => { playUISound('click'); setIsSearchOpen(true); }} className="text-emerald-700 hover:bg-emerald-100/50">
                <Search className="w-5 h-5" />
              </Button>
              <Button variant="ghost" onClick={handleQuickClear} className="text-stone-400 hover:text-stone-600 hover:bg-stone-100">
                <RefreshCw className="w-5 h-5" />
              </Button>
              <Button variant="ghost" onClick={() => { playUISound('click'); setIsClearConfirmOpen(true); }} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 relative" onClick={() => setActiveReactionId(null)}>
        {filteredMessages.length === 0 && searchQuery && (
          <div className="flex flex-col items-center justify-center h-full text-stone-400 space-y-2">
            <Search className="w-8 h-8 opacity-20" />
            <p className="text-sm">Nta butumwa bubonetse bujyanye na "{searchQuery}".</p>
          </div>
        )}

        {filteredMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[90%] md:max-w-[80%] ${msg.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mx-2 shadow-sm ${
                msg.role === MessageRole.USER ? 'bg-emerald-600' : 
                msg.role === MessageRole.ERROR ? 'bg-red-500' : 'bg-emerald-600'
              }`}>
                {msg.role === MessageRole.USER ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
              </div>
              
              <div className="flex flex-col">
                <div className={`p-4 rounded-2xl shadow-sm min-w-[80px] group relative animate-in fade-in slide-in-from-bottom-1 duration-300 ${
                  msg.role === MessageRole.USER 
                    ? 'bg-emerald-600 text-white rounded-tr-none' 
                    : msg.role === MessageRole.ERROR
                    ? 'bg-red-50 text-red-600 border border-red-200 rounded-tl-none'
                    : 'bg-white text-stone-800 border border-emerald-100 rounded-tl-none'
                }`}>
                  <div className="min-h-[1.5em] text-sm md:text-base">
                    {msg.role === MessageRole.USER ? (
                      <span className="whitespace-pre-wrap">{msg.text}</span>
                    ) : (
                      <FormattedText text={msg.text} searchQuery={searchQuery} />
                    )}
                    
                    {!msg.text && isStreaming && msg.role === MessageRole.MODEL && msg.id === lastMessageId && (
                      <div className="py-2">
                        <div className="flex space-x-1 items-center bg-emerald-50/80 rounded-full px-2 py-1 w-fit">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {msg.reaction && (
                     <div onClick={() => handleReaction(msg.id, msg.reaction!)} className={`absolute -bottom-3 ${msg.role === MessageRole.USER ? 'left-0' : 'right-0'} bg-white border border-stone-200 rounded-full px-2 py-0.5 text-xs shadow-sm cursor-pointer hover:bg-stone-50 transition-transform hover:scale-110 flex items-center z-10`}>
                       {msg.reaction}
                     </div>
                  )}

                  <div className={`flex items-center justify-end gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                    msg.role === MessageRole.USER ? 'text-emerald-100/80' : msg.role === MessageRole.ERROR ? 'text-red-300' : 'text-stone-400'
                  }`}>
                    {msg.role === MessageRole.MODEL && msg.text && !msg.reaction && (
                      <div className="relative">
                        <button onClick={(e) => { e.stopPropagation(); setActiveReactionId(activeReactionId === msg.id ? null : msg.id); }} className="p-1 rounded hover:bg-emerald-50 transition-colors">
                          <Smile size={14} />
                        </button>
                        {activeReactionId === msg.id && (
                          <div className="absolute bottom-6 left-0 bg-white border border-stone-200 rounded-lg shadow-lg p-1.5 flex gap-1 z-20 animate-in fade-in zoom-in-95 duration-150">
                             {reactionList.map(emoji => (
                               <button key={emoji} onClick={() => handleReaction(msg.id, emoji)} className="hover:bg-stone-100 rounded p-1 text-base transition-transform hover:scale-110">
                                 {emoji}
                               </button>
                             ))}
                          </div>
                        )}
                      </div>
                    )}
                    {msg.role === MessageRole.MODEL && msg.text && (
                      <button onClick={() => handleCopyMessage(msg.text, msg.id)} className="p-1 rounded hover:bg-emerald-50 transition-colors">
                        {copiedMessageId === msg.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }} className="p-1 rounded hover:bg-red-50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-widest">{formatTime(msg.timestamp)}</span>
                  </div>

                  {msg.sources && msg.sources.length > 0 && <SourcesToggle sources={msg.sources} />}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {messages.length <= 1 && !searchQuery && (
           <div className="mt-8 mb-12 px-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="text-center mb-8">
                 <p className="text-[10px] font-black text-emerald-900/40 uppercase tracking-[0.2em] mb-2">Hitamo Serivisi (Quick Access)</p>
                 <div className="h-0.5 w-12 bg-emerald-500/20 mx-auto rounded-full"></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                 {quickFeatures.map((feat, idx) => (
                    <button 
                      key={idx}
                      type="button"
                      onClick={() => navigateTo(feat.view)}
                      className={`flex flex-col items-center justify-center p-6 rounded-[32px] border border-emerald-100 shadow-sm transition-all group active:scale-95 cursor-pointer ${feat.color} bg-opacity-5 hover:bg-opacity-10 hover:shadow-xl hover:-translate-y-2 duration-300`}
                    >
                       <div className={`p-4 rounded-2xl mb-4 ${feat.color} bg-opacity-20 group-hover:rotate-6 transition-all shadow-sm`}>
                          <feat.icon className="w-8 h-8" />
                       </div>
                       <span className="text-sm font-black uppercase tracking-wider mb-1">{feat.label}</span>
                       <span className="text-[10px] opacity-60 font-medium">{feat.description}</span>
                    </button>
                 ))}
              </div>
              <div className="mt-12 p-6 bg-white border border-emerald-50 rounded-3xl text-center flex flex-col items-center">
                 <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-3">
                    <Sparkles className="w-5 h-5" />
                 </div>
                 <h4 className="text-sm font-bold text-emerald-900">Ukeneye ubufasha?</h4>
                 <p className="text-xs text-stone-500 mt-1 max-w-xs">Andika ikibazo cyawe hano hasi, ai.rw iguhe igisubizo mu Kinyarwanda mu masegonda make.</p>
              </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-emerald-100 relative shadow-[0_-10px_20px_rgba(16,185,129,0.03)]">
        {showInputEmoji && (
          <div className="absolute bottom-20 left-4 bg-white border border-emerald-100 rounded-2xl shadow-2xl p-4 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200 w-72">
             <div className="flex justify-between items-center mb-3 pb-2 border-b border-stone-100">
               <span className="text-xs font-black uppercase tracking-widest text-emerald-900/40">Hitamo Emoji</span>
               <button onClick={() => setShowInputEmoji(false)} className="text-stone-400 hover:text-stone-600"><X size={14}/></button>
             </div>
             <div className="grid grid-cols-6 gap-2">
               {emojiList.map(emoji => (
                 <button key={emoji} onClick={() => handleAddInputEmoji(emoji)} className="p-2 hover:bg-emerald-50 rounded-lg text-xl transition-transform hover:scale-125">
                   {emoji}
                 </button>
               ))}
             </div>
          </div>
        )}

        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <div className="relative flex-1">
             <button
               onClick={() => setShowInputEmoji(!showInputEmoji)}
               className={`absolute left-4 top-4 text-stone-400 hover:text-emerald-600 transition-all p-1 rounded-md ${showInputEmoji ? 'text-emerald-600 bg-emerald-50' : ''}`}
             >
               <Smile size={20} />
             </button>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Ndakumva..." : "Baza ai.rw icyo wifuza..."}
              className={`w-full p-4 pl-14 pr-12 border-2 border-emerald-100 rounded-[24px] focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all resize-none h-14 max-h-40 overflow-y-auto font-medium text-stone-800 ${isListening ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50/50'}`}
              disabled={isStreaming || isListening}
            />
            {inputValue && (
              <button onClick={handleClearInput} className="absolute right-4 top-4 text-stone-300 hover:text-red-500 transition-colors p-1">
                <X size={18} />
              </button>
            )}
          </div>
          
          <Button 
            variant={isListening ? "danger" : "secondary"}
            onClick={toggleListening}
            className={`h-14 w-14 rounded-full transition-all shadow-md ${isListening ? 'animate-pulse ring-4 ring-red-400/20' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
            disabled={isStreaming}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          <Button 
            onClick={handleSendMessage} 
            disabled={!inputValue.trim() || isStreaming}
            isLoading={isStreaming}
            className="h-14 w-14 rounded-full shadow-lg shadow-emerald-500/20"
          >
            {!isStreaming && <Send className="w-5 h-5" />}
          </Button>
        </div>
        <div className="flex items-center justify-center gap-2 mt-3 text-[10px] font-black uppercase tracking-[0.1em] text-stone-400">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40"></div>
           ai.rw ishobora gukora amakosa. Banza ugenzure amakuru.
        </div>
      </div>
    </div>
  );
};
