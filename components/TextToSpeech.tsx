
import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Play, Square, Loader2, Download, ChevronDown, Check, Trash2, Mic, Volume1, Settings2, Headphones, Activity } from 'lucide-react';
import { Button } from './Button';
import { generateSpeech } from '../services/geminiService';
import { decodeBase64Audio, decodePCMToAudioBuffer, playAudioBuffer } from '../services/audioService';
import { useToast } from './ToastProvider';

// MP3/WAV utilities included for download feature
const bufferToWav = (buffer: AudioBuffer): Blob => {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const blockAlign = numChannels * (bitDepth / 8);
  const wavLength = 44 + (buffer.length * blockAlign);
  const bufferArr = new ArrayBuffer(wavLength);
  const view = new DataView(bufferArr);
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, wavLength - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, buffer.length * blockAlign, true);
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const s = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
  }
  return new Blob([bufferArr], { type: 'audio/wav' });
};

interface TextToSpeechProps {
  initialText?: string;
}

export const TextToSpeech: React.FC<TextToSpeechProps> = ({ initialText }) => {
  const [text, setText] = useState(initialText || '');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { showToast } = useToast();

  const voices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

  useEffect(() => {
    return () => {
      stopAudio();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    stopAudio();
    setHasAudio(false);
    setIsLoading(true);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const base64Data = await generateSpeech(text, selectedVoice);
      if (!base64Data) throw new Error("No data received from AI engine.");

      const pcmData = decodeBase64Audio(base64Data);
      const buffer = await decodePCMToAudioBuffer(pcmData, audioContextRef.current);
      audioBufferRef.current = buffer;
      setHasAudio(true);
      playAudio();
      showToast("Umwandiko wahinduwe neza!", "success");
    } catch (error) {
      console.error("TTS Error:", error);
      showToast("Habaye ikibazo muguhindura ijwi. Ongera ugerageze.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = () => {
    if (!audioBufferRef.current || !audioContextRef.current) return;
    stopAudio();
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.playbackRate.value = speed;
    source.detune.value = pitch;
    source.connect(audioContextRef.current.destination);
    source.onended = () => setIsPlaying(false);
    source.start(0);
    sourceNodeRef.current = source;
    setIsPlaying(true);
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) {}
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleDownload = async () => {
    if (!audioBufferRef.current) return;
    setIsDownloading(true);
    try {
      const blob = bufferToWav(audioBufferRef.current);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai_rw_audio_${Date.now()}.wav`;
      link.click();
      URL.revokeObjectURL(url);
      showToast("Amajwi yamanuwe!", "success");
    } catch (e) {
      showToast("Habaye ikibazo mugumanura.", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <div className="max-w-4xl mx-auto w-full p-6 md:p-10 space-y-8 overflow-y-auto h-full scroll-smooth">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-emerald-100 text-emerald-600 rounded-2xl mb-2">
            <Headphones className="w-8 h-8" />
          </div>
          <h2 className="text-4xl font-black text-emerald-950 tracking-tighter uppercase">Soma Inyandiko</h2>
          <p className="text-emerald-700 font-medium">Hindura umwandiko wawe amagambo avuzwe na AI yacu.</p>
        </div>

        <div className="bg-white rounded-[48px] shadow-2xl shadow-emerald-900/5 border border-emerald-100 p-8 md:p-12 space-y-10">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-900/40">Injiza Umwandiko (Kinyarwanda)</label>
              {text && (
                <button 
                  onClick={() => setText('')} 
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Siba byose
                </button>
              )}
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Andika ibyo ushaka ko ai.rw isoma..."
              className="w-full h-48 p-8 bg-slate-50 border border-emerald-100 rounded-[32px] focus:ring-4 focus:ring-emerald-500/10 focus:bg-white focus:border-emerald-500 outline-none transition-all text-xl font-medium text-slate-800 placeholder:text-slate-300 resize-none shadow-inner"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-900/40 px-4">
                <Mic className="w-3.5 h-3.5" />
                Hitamo Ijwi (Voice)
              </div>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
                  className="w-full flex items-center justify-between p-5 bg-white border-2 border-emerald-50 rounded-3xl shadow-sm hover:border-emerald-200 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 font-bold">
                      {selectedVoice.charAt(0)}
                    </div>
                    <span className="font-bold text-slate-800 text-lg">{selectedVoice}</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-emerald-500 transition-transform ${isVoiceDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isVoiceDropdownOpen && (
                  <div className="absolute z-20 w-full mt-3 bg-white border border-emerald-50 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-2">
                    {voices.map((v) => (
                      <button 
                        key={v} 
                        onClick={() => { setSelectedVoice(v); setIsVoiceDropdownOpen(false); }} 
                        className={`w-full px-6 py-4 text-left rounded-2xl transition-all flex items-center justify-between ${
                          selectedVoice === v ? 'bg-emerald-50 text-emerald-700 font-black' : 'text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {v}
                        {selectedVoice === v && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-8 bg-slate-50/50 p-6 rounded-3xl border border-emerald-50/50">
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-emerald-900/40 px-2">
                  <span className="flex items-center gap-1.5"><Activity className="w-3 h-3" /> Umuvuduko (Speed)</span>
                  <span className="text-emerald-700 font-black">{speed.toFixed(1)}x</span>
                </div>
                <input 
                  type="range" min="0.5" max="2.0" step="0.1" value={speed} 
                  onChange={e => setSpeed(parseFloat(e.target.value))} 
                  className="w-full h-2 bg-emerald-100 rounded-full appearance-none cursor-pointer accent-emerald-600" 
                />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-emerald-900/40 px-2">
                  <span className="flex items-center gap-1.5"><Settings2 className="w-3 h-3" /> Ijwi (Pitch)</span>
                  <span className="text-emerald-700 font-black">{pitch > 0 ? '+' : ''}{pitch}</span>
                </div>
                <input 
                  type="range" min="-1200" max="1200" step="100" value={pitch} 
                  onChange={e => setPitch(parseInt(e.target.value))} 
                  className="w-full h-2 bg-emerald-100 rounded-full appearance-none cursor-pointer accent-emerald-600" 
                />
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Button 
              onClick={handleGenerate} 
              isLoading={isLoading} 
              disabled={!text.trim()} 
              className="w-full h-20 rounded-[32px] text-xl font-black shadow-2xl shadow-emerald-500/20 uppercase tracking-[0.2em] transition-all active:scale-95"
            >
              <Volume2 className="w-6 h-6 mr-3" />
              Soma ubu (Generate)
            </Button>
          </div>

          {hasAudio && (
             <div className="flex flex-col items-center gap-8 py-8 animate-in fade-in zoom-in-95 duration-500">
                {/* Modern Waveform Placeholder */}
                <div className="flex items-end justify-center gap-1 h-12 w-full max-w-xs">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-2 bg-emerald-500 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse' : 'h-2'}`}
                      style={{ 
                        height: isPlaying ? `${20 + Math.random() * 80}%` : '8px',
                        animationDelay: `${i * 0.05}s`
                      }}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-center gap-8">
                  <button 
                    onClick={isPlaying ? stopAudio : playAudio} 
                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl transform hover:scale-105 active:scale-95 ${
                      isPlaying ? 'bg-rose-500 text-white shadow-rose-500/30' : 'bg-emerald-600 text-white shadow-emerald-600/30'
                    }`}
                  >
                    {isPlaying ? <Square className="fill-current w-8 h-8" /> : <Play className="ml-2 fill-current w-12 h-12" />}
                  </button>
                  
                  <button 
                    onClick={handleDownload} 
                    disabled={isDownloading} 
                    className="w-16 h-16 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm group"
                  >
                    {isDownloading ? <Loader2 className="animate-spin" /> : <Download className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />}
                  </button>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
