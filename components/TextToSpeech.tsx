import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Play, Square, Loader2, Info, Gauge, Sliders, Download, ChevronDown, Check, Trash2, Megaphone, Volume1 } from 'lucide-react';
import { Button } from './Button';
import { generateSpeech } from '../services/geminiService';
import { useToast } from './ToastProvider';

// Utility functions for decoding PCM data from Gemini
const decode = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

// Utility to convert AudioBuffer to WAV Blob
const bufferToWav = (buffer: AudioBuffer): Blob => {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  
  const wavLength = 44 + (buffer.length * blockAlign);
  const bufferArr = new ArrayBuffer(wavLength);
  const view = new DataView(bufferArr);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // RIFF chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, wavLength - 8, true);
  writeString(8, 'WAVE');

  // fmt sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data sub-chunk
  writeString(36, 'data');
  view.setUint32(40, buffer.length * blockAlign, true);

  // Write audio data
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = buffer.getChannelData(channel)[i];
      // Clamp and scale to 16-bit
      const s = Math.max(-1, Math.min(1, sample));
      const int16 = s < 0 ? s * 0x8000 : s * 0x7FFF;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([bufferArr], { type: 'audio/wav' });
};

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

  // Helper to convert Float32 to Int16
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
  
  // Audio Params
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
      // Cleanup
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch(e) {}
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsVoiceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update text if initialText changes (e.g. re-navigation)
  useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);

  // Update active source node when params change
  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (sourceNodeRef.current) {
      sourceNodeRef.current.playbackRate.value = newSpeed;
    }
  };

  const handlePitchChange = (newPitch: number) => {
    setPitch(newPitch);
    if (sourceNodeRef.current) {
      sourceNodeRef.current.detune.value = newPitch;
    }
  };

  const handlePreviewVoice = async () => {
    if (isPreviewPlaying) return;
    setIsPreviewPlaying(true);

    try {
      const sampleText = `Muraho, ubu ni ijwi rya ${selectedVoice === 'AdVoice' ? 'AdVoice' : selectedVoice}.`;
      const base64Data = await generateSpeech(sampleText, selectedVoice);
      
      if (!base64Data) throw new Error("No data");

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      const audioData = decode(base64Data);
      const buffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsPreviewPlaying(false);
      source.start(0);
    } catch (e) {
      console.error(e);
      setIsPreviewPlaying(false);
      showToast("Habaye ikibazo cya preview.", "error");
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;

    // Stop previous playback
    stopAudio();
    setHasAudio(false);
    setIsLoading(true);

    try {
      const base64Data = await generateSpeech(text, selectedVoice);
      
      if (!base64Data) {
        throw new Error("No audio data received");
      }

      // Initialize Audio Context if needed
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      // Decode Audio
      const audioData = decode(base64Data);
      const buffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
      
      audioBufferRef.current = buffer;
      setHasAudio(true);
      showToast("Amajwi yabonetse!", "success");
      
      // Auto play
      playAudio();

    } catch (error) {
      console.error(error);
      showToast("Habaye ikibazo.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = () => {
    if (!audioBufferRef.current || !audioContextRef.current) return;

    // Resume context if suspended (browser policy)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    // Stop any currently playing node
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) {}
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    
    // Apply current params
    source.playbackRate.value = speed;
    source.detune.value = pitch;
    
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      setIsPlaying(false);
    };

    source.start(0);
    sourceNodeRef.current = source;
    setIsPlaying(true);
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleClear = () => {
    stopAudio();
    setHasAudio(false);
    setText('');
    showToast("Byasibwe", "info");
  };

  const handleDownload = async () => {
    if (!audioBufferRef.current) return;
    setIsDownloading(true);
    
    try {
      // Offline render to bake in speed/pitch effects
      const originalBuffer = audioBufferRef.current;
      const effectiveRate = speed * Math.pow(2, pitch / 1200);
      const newDuration = originalBuffer.duration / effectiveRate;
      
      // Ensure duration is safe
      if (!isFinite(newDuration) || newDuration <= 0) throw new Error("Invalid duration");

      const offlineCtx = new OfflineAudioContext(
        originalBuffer.numberOfChannels,
        Math.ceil(originalBuffer.sampleRate * newDuration),
        originalBuffer.sampleRate
      );
      
      const source = offlineCtx.createBufferSource();
      source.buffer = originalBuffer;
      source.playbackRate.value = speed;
      source.detune.value = pitch;
      source.connect(offlineCtx.destination);
      source.start(0);
      
      const renderedBuffer = await offlineCtx.startRendering();

      // Check for LAMEJS support for MP3
      const shouldUseMp3 = typeof (window as any).lamejs !== 'undefined';
      
      let blob: Blob;
      let extension: string;

      if (shouldUseMp3) {
        blob = bufferToMp3(renderedBuffer);
        extension = 'mp3';
      } else {
        blob = bufferToWav(renderedBuffer);
        extension = 'wav';
      }
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Filename based on input text (sanitized)
      // Take first 30 chars, replace non-alphanumeric with underscore, remove duplicates
      const safeName = text
        .trim()
        .slice(0, 30)
        .replace(/[^a-z0-9]+/gi, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase() || 'audio_output';

      link.download = `${safeName}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast(`Audio yamanuwe nka ${extension.toUpperCase()}!`, "success");
    } catch (e) {
      console.error(e);
      showToast("Habaye ikibazo kumanura audio.", "error");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6 overflow-y-auto">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-emerald-900">Soma Umwandiko</h2>
        <p className="text-emerald-700 mt-2">Hindura inyandiko amajwi y'umwimerere.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 space-y-6 flex-1 flex flex-col">
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-emerald-800">Andika hano</label>
            {text && (
              <button 
                onClick={handleClear}
                className="text-xs text-red-500 hover:text-red-700 flex items-center font-medium transition-colors bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md"
                title="Siba byose"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Siba Byose
              </button>
            )}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Andika ibyo ushaka ko ai.rw isoma..."
            className="w-full h-32 md:h-40 p-4 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 resize-none text-stone-800"
          />
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          
          {/* Voice Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-emerald-800 flex items-center">
              <Volume2 className="w-4 h-4 mr-2" />
              Hitamo Ijwi
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1" ref={dropdownRef}>
                <button
                  onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
                  className="w-full flex items-center justify-between p-3 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all hover:border-emerald-300 shadow-sm"
                >
                  <div className="flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${selectedVoice === 'AdVoice' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                    <span className="font-medium text-emerald-900">{selectedVoice}</span>
                    {selectedVoice === 'AdVoice' && (
                      <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium border border-amber-200">
                        Promo
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-emerald-500 transition-transform duration-200 ${isVoiceDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isVoiceDropdownOpen && (
                  <div className="absolute z-20 w-full mt-2 bg-white border border-emerald-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5">
                    {voices.map((voice) => (
                      <button
                        key={voice}
                        onClick={() => { setSelectedVoice(voice); setIsVoiceDropdownOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors text-left group ${
                          selectedVoice === voice 
                          ? 'bg-emerald-50 text-emerald-900 font-semibold' 
                          : 'text-stone-600 hover:bg-emerald-50/50 hover:text-emerald-800'
                        }`}
                      >
                        <div className="flex items-center">
                          <span>{voice}</span>
                          {voice === 'AdVoice' && (
                            <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium border border-amber-200 flex items-center">
                              <Megaphone className="w-3 h-3 mr-1" />
                              Promo
                            </span>
                          )}
                        </div>
                        {selectedVoice === voice && <Check className="w-4 h-4 text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                onClick={handlePreviewVoice}
                disabled={isPreviewPlaying}
                className="px-3 rounded-xl border border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50 focus:ring-2 focus:ring-emerald-500 transition-colors flex items-center justify-center shadow-sm"
                title="Umva ijwi (Preview)"
              >
                {isPreviewPlaying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Volume1 className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Audio Parameters */}
          <div className="space-y-4">
            {/* Speed Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs md:text-sm">
                <label className="font-medium text-emerald-800 flex items-center">
                  <Gauge className="w-4 h-4 mr-2" />
                  Umuvuduko
                </label>
                <span className="text-emerald-600 font-mono bg-emerald-50 px-2 rounded">{speed.toFixed(1)}x</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="2.0" 
                step="0.1" 
                value={speed}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>

            {/* Pitch Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs md:text-sm">
                <label className="font-medium text-emerald-800 flex items-center">
                  <Sliders className="w-4 h-4 mr-2" />
                  Ubwihindurize
                </label>
                <span className="text-emerald-600 font-mono bg-emerald-50 px-2 rounded">{pitch > 0 ? '+' : ''}{pitch}</span>
              </div>
              <input 
                type="range" 
                min="-1200" 
                max="1200" 
                step="100" 
                value={pitch}
                onChange={(e) => handlePitchChange(parseInt(e.target.value))}
                className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          isLoading={isLoading}
          disabled={!text.trim()}
          className="w-full h-12 mt-4"
        >
          <Volume2 className="w-5 h-5 mr-2" />
          {hasAudio ? "Ongera Usome" : "Soma"}
        </Button>

        {hasAudio && (
           <div className="bg-stone-50 rounded-xl p-6 border border-emerald-100 flex flex-col items-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
             <div className="w-full flex items-center justify-center gap-6">
                <button
                  onClick={isPlaying ? stopAudio : playAudio}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    isPlaying 
                      ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200 ring-4 ring-emerald-50' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg hover:scale-105'
                  }`}
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Square className="w-6 h-6 fill-current" /> : <Play className="w-8 h-8 ml-1 fill-current" />}
                </button>

                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border border-emerald-200 ${
                    isDownloading
                    ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                    : 'bg-white text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 shadow-sm'
                  }`}
                  title="Manura Audio"
                >
                  {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                </button>
             </div>
             
             <div className="flex items-center text-xs text-stone-500 bg-white px-3 py-1 rounded-full border border-stone-200">
                <Info className="w-3 h-3 mr-1" />
                <span>Harimo guhindura umuvuduko/amajwi</span>
             </div>
           </div>
        )}
      </div>
    </div>
  );
};