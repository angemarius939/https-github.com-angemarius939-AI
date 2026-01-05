
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Loader2, PlayCircle, StopCircle, Search, X, MessageSquare, RotateCcw, Copy, Check } from 'lucide-react';
import { generateConversationResponse, generateSpeech } from '../services/geminiService';
import { decodeBase64Audio, decodePCMToAudioBuffer, playAudioBuffer } from '../services/audioService';
import { useToast } from './ToastProvider';
import { Button } from './Button';

export const VoiceConversation: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('Kanda mikoro kugira ngo tuganire.');
  const [conversationHistory, setConversationHistory] = useState<{role: string, parts: {text: string}[]}[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  const { showToast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'rw-RW';

      recognitionRef.current.onstart = () => setIsListening(true);
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        const text = transcriptRef.current.trim();
        if (text && text.length > 0) {
           processUserInput(text);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech error", event);
        setIsListening(false);
        if (event.error !== 'no-speech') {
           showToast("Habaye ikibazo cya mikoro.", "error");
        }
      };

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const result = event.results[current][0].transcript;
        setTranscript(result);
        transcriptRef.current = result;
      };
    }

    return () => {
      stopAudio();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [showToast]);

  const stopAudio = () => {
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
      } catch (e) {}
      activeSourceRef.current = null;
    }
    setIsSpeaking(false);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Browser yanyu ntabwo ishyigikiye kwandika ukoresheje ijwi.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      stopAudio();
      setTranscript('');
      transcriptRef.current = '';
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Failed to start recognition", e);
      }
    }
  };

  const speakTextWithEngine = async (text: string) => {
    stopAudio();
    setIsSpeaking(true);
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const base64Audio = await generateSpeech(text, 'Zephyr');
      if (!base64Audio) throw new Error("Audio generation failed");

      const pcmData = decodeBase64Audio(base64Audio);
      const buffer = await decodePCMToAudioBuffer(pcmData, audioContextRef.current);
      
      activeSourceRef.current = playAudioBuffer(buffer, audioContextRef.current, () => {
        setIsSpeaking(false);
        activeSourceRef.current = null;
      });
    } catch (e) {
      console.error("ai.rw TTS Error:", e);
      setIsSpeaking(false);
      showToast("Habaye ikibazo cy'amajwi.", "error");
    }
  };

  const processUserInput = async (text: string) => {
    setIsProcessing(true);
    setCopied(false);
    
    const newHistory = [...conversationHistory, { role: 'user', parts: [{ text }] }];
    setConversationHistory(newHistory);
    
    try {
      const response = await generateConversationResponse(newHistory, text);
      setLastResponse(response);
      setConversationHistory(prev => [...prev, { role: 'model', parts: [{ text: response }] }]);
      
      await speakTextWithEngine(response);
      
    } catch (error: any) {
      console.error(error);
      setLastResponse("Habaye ikibazo. Ongera ugerageze.");
    } finally {
      setIsProcessing(false);
      setTranscript('');
      transcriptRef.current = '';
    }
  };

  const handleCopy = () => {
    if (!lastResponse) return;
    navigator.clipboard.writeText(lastResponse);
    setCopied(true);
    showToast('Byakoporowe!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredHistory = conversationHistory.filter(item => 
    item.parts[0].text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full relative">
      <div className="absolute top-4 right-4 z-20">
        <Button 
          variant="ghost" 
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className="bg-white/80 backdrop-blur shadow-sm hover:bg-white text-emerald-800"
        >
          {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
        </Button>
      </div>

      {isSearchOpen ? (
        <div className="flex-1 p-6 pt-20 bg-white/95 backdrop-blur-md flex flex-col h-full animate-in fade-in slide-in-from-top-4 duration-300 z-10">
          <div className="max-w-3xl mx-auto w-full flex flex-col h-full">
            <h3 className="text-xl font-bold text-emerald-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Amateka y'Ikiganiro
            </h3>
            
            <div className="relative mb-6">
              <input 
                autoFocus
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Shakisha mu byavuzwe..."
                className="w-full p-4 pl-12 border border-emerald-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
              />
              <Search className="w-5 h-5 text-emerald-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {filteredHistory.length === 0 ? (
                <div className="text-center text-stone-400 mt-12">
                   <p>Nta mateka y'ikiganiro arahari.</p>
                </div>
              ) : (
                filteredHistory.map((item, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl border ${item.role === 'user' ? 'bg-emerald-50 border-emerald-100 ml-8' : 'bg-white border-stone-200 mr-8 shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                        {item.role === 'user' ? 'Wowe' : 'ai.rw'}
                      </p>
                      <div className="flex gap-2">
                        {item.role === 'model' && (
                          <button 
                            onClick={() => { navigator.clipboard.writeText(item.parts[0].text); showToast('Byakoporowe!', 'info'); }} 
                            className="text-stone-300 hover:text-emerald-600 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-stone-800 leading-relaxed text-sm">
                      {item.parts[0].text}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-6 w-full max-w-3xl mx-auto">
          <div className="w-full flex-1 flex flex-col items-center justify-center space-y-12 min-h-[300px]">
            
            <div className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500 ${isSpeaking || isListening ? 'bg-emerald-100 scale-110 shadow-2xl shadow-emerald-200/50' : 'bg-white shadow-xl'}`}>
              {(isSpeaking || isListening) && (
                <div className="absolute inset-0 rounded-full border-8 border-emerald-500/20 animate-ping"></div>
              )}
              {isProcessing ? (
                <Loader2 className="w-16 h-16 text-emerald-600 animate-spin" />
              ) : isListening ? (
                <div className="flex gap-1.5 items-end h-16">
                  {[0.4, 0.7, 0.3, 0.8, 0.5].map((d, i) => (
                    <div key={i} className="w-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ height: `${d * 100}%`, animationDelay: `${i * 0.1}s` }}></div>
                  ))}
                </div>
              ) : (
                <Volume2 className={`w-20 h-20 ${isSpeaking ? 'text-emerald-600 animate-pulse' : 'text-slate-300'}`} />
              )}
            </div>

            <div className="w-full space-y-6 text-center max-w-xl">
              {isListening && transcript && (
                <p className="text-2xl font-bold text-emerald-800 animate-pulse">"{transcript}..."</p>
              )}
              
              {!isListening && !isProcessing && (
                <div className="bg-white/90 backdrop-blur-md p-8 rounded-[32px] shadow-2xl border border-emerald-100/50 transform transition-all hover:scale-[1.01]">
                  <p className="text-xl md:text-2xl font-medium text-slate-800 leading-snug">
                    {lastResponse}
                  </p>
                  {lastResponse && (
                    <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
                      <button 
                        onClick={() => isSpeaking ? stopAudio() : speakTextWithEngine(lastResponse)}
                        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-200"
                      >
                        {isSpeaking ? <StopCircle className="w-5 h-5 fill-current" /> : <RotateCcw className="w-5 h-5" />}
                        {isSpeaking ? "Hagarika" : "Ongera Wumve"}
                      </button>
                      <button 
                        onClick={handleCopy}
                        className="p-3 bg-white hover:bg-stone-50 text-emerald-600 rounded-full border border-stone-200 transition-all hover:scale-110"
                        title="Koporora"
                      >
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="w-full p-12 flex justify-center">
            <button
              onClick={toggleListening}
              className={`relative group flex items-center justify-center w-28 h-28 rounded-full transition-all duration-300 shadow-2xl ${
                isListening 
                  ? 'bg-red-500 text-white scale-110 shadow-red-200' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 shadow-emerald-600/30'
              }`}
            >
              {isListening ? <MicOff className="w-12 h-12" /> : <Mic className="w-12 h-12" />}
              <span className="absolute -bottom-14 text-sm font-black uppercase tracking-widest text-slate-400 bg-white/50 px-4 py-1.5 rounded-full backdrop-blur-sm">
                {isListening ? "Hagarika" : "Kanda Uvuge"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
