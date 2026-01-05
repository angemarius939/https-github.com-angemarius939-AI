
import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Play, Square, Loader2, Info, Gauge, Sliders, Download, ChevronDown, Check, Trash2, Megaphone, Volume1 } from 'lucide-react';
import { Button } from './Button';
import { generateSpeech } from '../services/geminiService';
import { decodeBase64Audio, decodePCMToAudioBuffer, playAudioBuffer } from '../services/audioService';
import { useToast } from './ToastProvider';

// Utility to convert AudioBuffer to MP3 Blob using lamejs
const bufferToMp3 = (buffer: AudioBuffer): Blob => {
  const lamejs = (window as any).lamejs;
  if (!lamejs) throw new Error("lamejs not found");

  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const kbps = 128;
  const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, kbps);
  
  const sampleBlockSize = 1152;
  const mp3Data = [];

  const floatToInt = (samples: Float32Array) => {
    const l = samples.length;
    const result = new Int16Array(l);
    for (let i = 0; i < l; i++) {
       const s = Math.max(-1, Math.min(1, samples[i]));
       result[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return result;
  };

  const left = floatToInt(buffer.getChannelData(0));
  const right = channels > 1 ? floatToInt(buffer.getChannelData(1)) : undefined;

  let remaining = left.length;
  for (let i = 0; remaining >= sampleBlockSize; i += sampleBlockSize) {
    const leftChunk = left.subarray(i, i + sampleBlockSize);
    const rightChunk = right ? right.subarray(i, i + sampleBlockSize) : undefined;
    
    const mp3buf = rightChunk 
      ? mp3encoder.encodeBuffer(leftChunk, rightChunk)
      : mp3encoder.encodeBuffer(leftChunk);
      
    if (mp3buf.length > 0) mp3Data.push(mp3buf);
    remaining -= sampleBlockSize;
  }
  
  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) mp3Data.push(mp3buf);

  return new Blob(mp3Data, { type: 'audio/mp3' });
};

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
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { showToast } = useToast();

  const voices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr', 'AdVoice'];

  useEffect(() => {
    return () => {
      stopAudio();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (sourceNodeRef.current) sourceNodeRef.current.playbackRate.value = newSpeed;
  };

  const handlePitchChange = (newPitch: number) => {
    setPitch(newPitch);
    if (sourceNodeRef.current) sourceNodeRef.current.detune.value = newPitch;
  };

  const handlePreviewVoice = async () => {
    if (isPreviewPlaying) return;
    setIsPreviewPlaying(true);
    try {
      const sampleText = `Muraho, ubu ni ijwi rya ${selectedVoice}.`;
      const base64Data = await generateSpeech(sampleText, selectedVoice);
      if (!base64Data) throw new Error("No data");
      if (!audioContextRef.current) audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      const buffer = await decodePCMToAudioBuffer(decodeBase64Audio(base64Data), audioContextRef.current);
      playAudioBuffer(buffer, audioContextRef.current, () => setIsPreviewPlaying(false));
    } catch (e) {
      setIsPreviewPlaying(false);
      showToast("Habaye ikibazo.", "error");
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;
    stopAudio();
    setHasAudio(false);
    setIsLoading(true);
    try {
      const base64Data = await generateSpeech(text, selectedVoice);
      if (!base64Data) throw new Error("No data");
      if (!audioContextRef.current) audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      const buffer = await decodePCMToAudioBuffer(decodeBase64Audio(base64Data), audioContextRef.current);
      audioBufferRef.current = buffer;
      setHasAudio(true);
      playAudio();
    } catch (error) {
      showToast("Habaye ikibazo.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = () => {
    if (!audioBufferRef.current || !audioContextRef.current) return;
    stopAudio();
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
      const originalBuffer = audioBufferRef.current;
      const effectiveRate = speed * Math.pow(2, pitch / 1200);
      const offlineCtx = new OfflineAudioContext(
        originalBuffer.numberOfChannels,
        Math.ceil(originalBuffer.sampleRate * (originalBuffer.duration / effectiveRate)),
        originalBuffer.sampleRate
      );
      const source = offlineCtx.createBufferSource();
      source.buffer = originalBuffer;
      source.playbackRate.value = speed;
      source.detune.value = pitch;
      source.connect(offlineCtx.destination);
      source.start(0);
      const renderedBuffer = await offlineCtx.startRendering();
      const blob = typeof (window as any).lamejs !== 'undefined' ? bufferToMp3(renderedBuffer) : bufferToWav(renderedBuffer);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai_rw_audio_${Date.now()}.mp3`;
      link.click();
      URL.revokeObjectURL(url);
      showToast("Amajwi yamanuwe!", "success");
    } catch (e) {
      showToast("Habaye ikibazo.", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-6 max-w-4xl mx-auto w-full space-y-8 overflow-y-auto">
      <div className="text-center">
        <h2 className="text-3xl font-black text-emerald-950 uppercase tracking-tighter">Soma Umwandiko</h2>
        <p className="text-emerald-700 font-medium mt-1">Hindura inyandiko amajwi y'umwimerere (ai.rw TTS).</p>
      </div>

      <div className="bg-white/90 rounded-[40px] shadow-2xl border border-white/50 p-8 space-y-8 flex-1 flex flex-col">
        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-center px-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/50">Umwandiko (Text)</label>
            {text && <button onClick={() => setText('')} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:underline">Siba byose</button>}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Andika ibyo ushaka ko ai.rw isoma mu Kinyarwanda..."
            className="w-full h-40 p-6 bg-emerald-50/30 border border-emerald-100 rounded-3xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-lg font-medium text-stone-800 placeholder:text-stone-300 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-900/50 block">Ijwi rya AI (Voice)</label>
            <div className="flex gap-3">
              <div className="relative flex-1" ref={dropdownRef}>
                <button
                  onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
                  className="w-full flex items-center justify-between p-4 bg-white border-2 border-emerald-100 rounded-2xl shadow-sm hover:border-emerald-300 transition-all group"
                >
                  <span className="font-bold text-emerald-950">{selectedVoice}</span>
                  <ChevronDown className={`w-5 h-5 text-emerald-500 transition-transform ${isVoiceDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isVoiceDropdownOpen && (
                  <div className="absolute z-20 w-full mt-2 bg-white border-2 border-emerald-50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {voices.map((v) => (
                      <button key={v} onClick={() => { setSelectedVoice(v); setIsVoiceDropdownOpen(false); }} className={`w-full px-6 py-3.5 text-sm font-bold text-left hover:bg-emerald-50 transition-colors ${selectedVoice === v ? 'bg-emerald-50 text-emerald-700' : 'text-stone-500'}`}>
                        {v}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={handlePreviewVoice} className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center hover:bg-emerald-200 transition-all">
                {isPreviewPlaying ? <Loader2 className="animate-spin" /> : <Volume1 />}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-emerald-900/50">
                <span>Umuvuduko</span>
                <span className="text-emerald-700">{speed.toFixed(1)}x</span>
              </div>
              <input type="range" min="0.5" max="2.0" step="0.1" value={speed} onChange={e => handleSpeedChange(parseFloat(e.target.value))} className="w-full h-1.5 bg-emerald-50 rounded-full appearance-none cursor-pointer accent-emerald-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-emerald-900/50">
                <span>Ubwihindurize</span>
                <span className="text-emerald-700">{pitch}</span>
              </div>
              <input type="range" min="-1200" max="1200" step="100" value={pitch} onChange={e => handlePitchChange(parseInt(e.target.value))} className="w-full h-1.5 bg-emerald-50 rounded-full appearance-none cursor-pointer accent-emerald-600" />
            </div>
          </div>
        </div>

        <Button onClick={handleGenerate} isLoading={isLoading} disabled={!text.trim()} className="w-full h-16 rounded-3xl text-lg font-black shadow-xl shadow-emerald-200 uppercase tracking-widest">
           Soma ubu (Generate)
        </Button>

        {hasAudio && (
           <div className="flex items-center justify-center gap-6 py-4 animate-in fade-in slide-in-from-bottom-2">
              <button onClick={isPlaying ? stopAudio : playAudio} className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-red-100 text-red-600' : 'bg-emerald-600 text-white shadow-xl hover:scale-110'}`}>
                {isPlaying ? <Square className="fill-current" /> : <Play className="ml-1 fill-current w-10 h-10" />}
              </button>
              <button onClick={handleDownload} disabled={isDownloading} className="w-14 h-14 rounded-2xl border-2 border-stone-100 flex items-center justify-center text-stone-400 hover:text-emerald-600 hover:border-emerald-200 transition-all">
                {isDownloading ? <Loader2 className="animate-spin" /> : <Download />}
              </button>
           </div>
        )}
      </div>
    </div>
  );
};
