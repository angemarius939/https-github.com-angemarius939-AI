import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Loader2, PlayCircle, StopCircle, Search, X, MessageSquare, RotateCcw } from 'lucide-react';
import { generateConversationResponse } from '../services/geminiService';
import { useToast } from './ToastProvider';
import { Button } from './Button';

export const VoiceConversation: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('Kanda mikoro kugira ngo tuganire.');
  const [conversationHistory, setConversationHistory] = useState<{role: string, parts: {text: string}[]}[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Stop after one sentence for turn-taking
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'rw-RW';

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech error", event);
        setIsListening(false);
        showToast("Habaye ikibazo cya mikoro.", "error");
      };

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const result = event.results[current][0].transcript;
        setTranscript(result);
      };
    }
  }, [showToast]);

  const toggleListening = async () => {
    if (!recognitionRef.current) {
      alert("Browser yanyu ntabwo ishyigikiye kwandika ukoresheje ijwi.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      // Handle the input manually if stopped early
      if (transcript.trim()) {
        await processUserInput(transcript);
      }
    } else {
      // Stop TTS if playing
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      
      setTranscript('');
      recognitionRef.current.start();
      
      // Hook into onend to trigger processing automatically when silence is detected
      recognitionRef.current.onend = async () => {
        setIsListening(false);
        if (transcript.trim()) {
           await processUserInput(transcript);
        }
      };
    }
  };

  const processUserInput = async (text: string) => {
    setIsProcessing(true);
    
    // Add user message to history
    const newHistory = [...conversationHistory, { role: 'user', parts: [{ text }] }];
    setConversationHistory(newHistory);
    
    try {
      const response = await generateConversationResponse(newHistory, text);
      
      setLastResponse(response);
      setConversationHistory(prev => [...prev, { role: 'model', parts: [{ text: response }] }]);
      
      // Auto-speak response (if possible)
      speakText(response);
      
    } catch (error) {
      console.error(error);
      setLastResponse("Habaye ikibazo. Ongera ugerageze.");
    } finally {
      setIsProcessing(false);
      setTranscript('');
    }
  };

  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Try to find a voice, though Kinyarwanda specific might not exist everywhere
    // We fall back to default
    utterance.rate = 0.9; 
    utterance.pitch = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  // Filter history for search
  const filteredHistory = conversationHistory.filter(item => 
    item.parts[0].text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full relative">
      {/* Top Controls */}
      <div className="absolute top-4 right-4 z-20">
        <Button 
          variant="ghost" 
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className="bg-white/80 backdrop-blur shadow-sm hover:bg-white text-emerald-800"
          title={isSearchOpen ? "Funga" : "Shakisha"}
        >
          {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
        </Button>
      </div>

      {isSearchOpen ? (
        <div className="flex-1 p-6 pt-20 bg-white/95 backdrop-blur-md flex flex-col h-full animate-in fade-in slide-in-from-top-4 duration-300 z-10">
          <div className="max-w-3xl mx-auto w-full flex flex-col h-full">
            <h3 className="text-xl font-bold text-emerald-900 mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Amateka y'Ikiganiro
            </h3>
            
            <div className="relative mb-6">
              <input 
                autoFocus
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Shakisha mu byavuzwe..."
                className="w-full p-3 pl-10 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
              />
              <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {filteredHistory.length === 0 ? (
                <div className="text-center text-stone-400 mt-12">
                   <p>{searchQuery ? `Nta kintu kibonetse kijyanye na "${searchQuery}"` : "Nta mateka y'ikiganiro arahari."}</p>
                </div>
              ) : (
                filteredHistory.map((item, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border ${item.role === 'user' ? 'bg-emerald-50 border-emerald-100 ml-8' : 'bg-white border-stone-200 mr-8 shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                        {item.role === 'user' ? 'Wowe' : 'ai.rw'}
                      </p>
                      {item.role === 'model' && (
                        <button 
                          onClick={() => speakText(item.parts[0].text)} 
                          className="text-emerald-500 hover:text-emerald-700 transition-colors"
                          title="Soma"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-stone-800 leading-relaxed text-sm md:text-base">
                      {searchQuery ? (
                        <span>
                          {item.parts[0].text.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) => 
                            part.toLowerCase() === searchQuery.toLowerCase() ? 
                            <span key={i} className="bg-yellow-200 text-black font-semibold rounded px-0.5">{part}</span> : part
                          )}
                        </span>
                      ) : (
                        item.parts[0].text
                      )}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-6 w-full max-w-3xl mx-auto">
          {/* Visualizer / Status Area */}
          <div className="w-full flex-1 flex flex-col items-center justify-center space-y-8 min-h-[300px]">
            
            {/* AI Avatar / Status */}
            <div className={`relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 ${isSpeaking ? 'bg-emerald-100 scale-110' : 'bg-white shadow-xl'}`}>
              <div className={`absolute inset-0 rounded-full border-4 border-emerald-500 opacity-20 ${isSpeaking ? 'animate-ping' : ''}`}></div>
              {isProcessing ? (
                <Loader2 className="w-16 h-16 text-emerald-600 animate-spin" />
              ) : isListening ? (
                <div className="flex gap-1 items-end h-16">
                  <div className="w-2 bg-emerald-500 animate-[bounce_1s_infinite] h-8"></div>
                  <div className="w-2 bg-emerald-500 animate-[bounce_1.2s_infinite] h-12"></div>
                  <div className="w-2 bg-emerald-500 animate-[bounce_0.8s_infinite] h-6"></div>
                  <div className="w-2 bg-emerald-500 animate-[bounce_1.1s_infinite] h-10"></div>
                </div>
              ) : (
                <Volume2 className={`w-16 h-16 ${isSpeaking ? 'text-emerald-600' : 'text-slate-400'}`} />
              )}
            </div>

            {/* Conversation Text Display */}
            <div className="w-full space-y-4 text-center max-w-lg">
              {isListening && transcript && (
                <p className="text-xl text-slate-500 animate-pulse">"{transcript}..."</p>
              )}
              
              {!isListening && !isProcessing && (
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-emerald-100">
                  <p className="text-lg md:text-xl font-medium text-slate-800 leading-relaxed">
                    {lastResponse}
                  </p>
                  {lastResponse && (
                    <button 
                      onClick={() => isSpeaking ? window.speechSynthesis.cancel() : speakText(lastResponse)}
                      className="mt-4 px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium flex items-center justify-center gap-2 mx-auto transition-colors duration-200 border border-emerald-200"
                    >
                      {isSpeaking ? <StopCircle className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                      {isSpeaking ? "Hagarika" : "Ongera Wumve"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Control Area */}
          <div className="w-full p-8 pb-12 flex justify-center">
            <button
              onClick={toggleListening}
              className={`relative group flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 shadow-xl ${
                isListening 
                  ? 'bg-red-500 text-white scale-110 shadow-red-200' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 shadow-emerald-200'
              }`}
            >
              {isListening ? (
                <MicOff className="w-10 h-10" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
              
              <span className="absolute -bottom-10 text-sm font-semibold text-slate-600 whitespace-nowrap bg-white/80 px-3 py-1 rounded-full">
                {isListening ? "Kanda uhagarike" : "Kanda uvuge"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};