import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Sparkles, Upload, Loader2, Target, BarChart, Tag, Volume2, Camera, SwitchCamera, FileText, PenTool, LayoutTemplate, Monitor, ScanText, Download, Ratio, History, Clock, ArrowUpRight, Info, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { analyzeImage, generateImage, extractTextFromImage } from '../services/geminiService';
import { Button } from './Button';
import { useToast } from './ToastProvider';
import { ImageAnalysisResult } from '../types';
import { ProgressBar } from './ProgressBar';

interface ImageToolsProps {
  onNavigateToTTS?: (text: string) => void;
}

interface GeneratedHistoryItem {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

export const ImageTools: React.FC<ImageToolsProps> = ({ onNavigateToTTS }) => {
  const [activeMode, setActiveMode] = useState<'generate' | 'analyze'>('generate');
  const { showToast } = useToast();
  
  // Analysis State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisPrompt, setAnalysisPrompt] = useState('');
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true); // Toggle for detection boxes
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isFlashing, setIsFlashing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Generation State
  const [genPrompt, setGenPrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  
  // History State
  const [genHistory, setGenHistory] = useState<GeneratedHistoryItem[]>([]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (isCameraOpen) {
      stopCamera();
      startCamera();
    }
  }, [facingMode]);

  // Auto-scroll to result when it appears
  useEffect(() => {
    if (analysisResult && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [analysisResult]);

  const validateFile = (file: File): boolean => {
    // Check if file is image
    if (!file.type.startsWith('image/')) {
      showToast("Nyamuneka hitamo ifoto (jpg, png).", "error");
      return false;
    }
    // Check size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("Ifoto iraremereye cyane. Arenze 5MB.", "error");
      return false;
    }
    return true;
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      showToast("Ntabwo byashobotse gufungura kamera.", "error");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = () => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 100);

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        
        setTimeout(() => {
          setSelectedImage(dataUrl);
          setAnalysisResult(null);
          stopCamera();
        }, 400);
      }
    }
  };

  const captureAndRead = () => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 100);

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        
        setTimeout(() => {
          setSelectedImage(dataUrl);
          stopCamera();
          // Trigger OCR immediately
          handleOCRInternal(dataUrl);
        }, 400);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!validateFile(file)) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const base64Data = selectedImage.split(',')[1];
      const result = await analyzeImage(base64Data, analysisPrompt);
      setAnalysisResult(result);
      showToast('Isesengura ryarangiye!', 'success');
    } catch (error) {
      showToast('Habaye ikibazo.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOCR = () => {
    if (selectedImage) {
      handleOCRInternal(selectedImage);
    }
  };

  const handleOCRInternal = async (imageDataUrl: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const base64Data = imageDataUrl.split(',')[1];
      const extractedText = await extractTextFromImage(base64Data);
      
      const result: ImageAnalysisResult = {
        description: extractedText,
        confidenceScore: 99,
        keyObservations: ["Inyandiko yakuwe mu ifoto", "Ururimi rw'umwimerere"],
        imageType: 'Inyandiko'
      };

      setAnalysisResult(result);
      showToast('Inyandiko yakuwemo!', 'success');
    } catch (error) {
       showToast('Habaye ikibazo gukuramo inyandiko.', 'error');
    } finally {
       setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!genPrompt.trim()) return;
    setIsGenerating(true);
    setGeneratedImageUrl(null);
    try {
      const result = await generateImage(genPrompt, aspectRatio);
      setGeneratedImageUrl(result);
      
      // Add to history
      const newItem: GeneratedHistoryItem = {
        id: Date.now().toString(),
        url: result,
        prompt: genPrompt,
        timestamp: Date.now()
      };
      setGenHistory(prev => [newItem, ...prev]);

      showToast('Ifoto yakozwe neza!', 'success');
    } catch (error) {
      showToast('Habaye ikibazo guhanga ifoto.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = (url: string) => {
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai_rw_generated_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Ifoto yamanuwe!', 'success');
    }
  };

  const handleRestoreFromHistory = (item: GeneratedHistoryItem) => {
    setGeneratedImageUrl(item.url);
    setGenPrompt(item.prompt);
    // Scroll to top to see main viewer
    const viewer = document.getElementById('main-image-viewer');
    if (viewer) viewer.scrollIntoView({ behavior: 'smooth' });
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 80) return "Icyizere Gihanitse";
    if (score >= 50) return "Icyizere Ringaniye";
    return "Icyizere Gike";
  };

  const getConfidenceMessage = (score: number) => {
    if (score >= 80) return "Icyizere ni cyose. Ibisubizo birizewe cyane.";
    if (score >= 50) return "Icyizere kiraringaniye. Reba niba ifoto isobanutse neza.";
    return "Icyizere ni gike. Nyamuneka gerageza ifoto igaragara neza kurushaho.";
  };

  const getImageTypeIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('inyandiko') || t.includes('document')) return <FileText className="w-4 h-4 mr-1.5" />;
    if (t.includes('igishushanyo') || t.includes('diagram')) return <LayoutTemplate className="w-4 h-4 mr-1.5" />;
    if (t.includes('ubuhanzi') || t.includes('art')) return <PenTool className="w-4 h-4 mr-1.5" />;
    if (t.includes('ecran') || t.includes('screen')) return <Monitor className="w-4 h-4 mr-1.5" />;
    return <ImageIcon className="w-4 h-4 mr-1.5" />;
  };

  const ratios = [
    { label: "1:1", value: "1:1" },
    { label: "16:9", value: "16:9" },
    { label: "9:16", value: "9:16" },
    { label: "4:3", value: "4:3" },
    { label: "3:4", value: "3:4" },
    { label: "3:2", value: "3:2" },
    { label: "2:3", value: "2:3" },
  ];

  // Helper to calculate box styles
  const getBoxStyle = (box2d: number[]) => {
    // Gemini coordinates are [ymin, xmin, ymax, xmax] normalized 0-1000
    const [ymin, xmin, ymax, xmax] = box2d;
    return {
      top: `${ymin / 10}%`,
      left: `${xmin / 10}%`,
      height: `${(ymax - ymin) / 10}%`,
      width: `${(xmax - xmin) / 10}%`,
    };
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full p-4 md:p-8 space-y-8 overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-center gap-4 mb-4">
        <button
          onClick={() => setActiveMode('generate')}
          className={`flex items-center justify-center px-6 py-3 rounded-xl border transition-all ${
            activeMode === 'generate' 
              ? 'bg-emerald-600 text-white border-transparent shadow-md' 
              : 'bg-white text-emerald-700 border-emerald-100 hover:bg-emerald-50'
          }`}
        >
          <Sparkles className="w-5 h-5 mr-2" />
          <span className="font-medium">Hanga Ifoto</span>
        </button>
        <button
          onClick={() => setActiveMode('analyze')}
          className={`flex items-center justify-center px-6 py-3 rounded-xl border transition-all ${
            activeMode === 'analyze' 
              ? 'bg-emerald-600 text-white border-transparent shadow-md' 
              : 'bg-white text-emerald-700 border-emerald-100 hover:bg-emerald-50'
          }`}
        >
          <ImageIcon className="w-5 h-5 mr-2" />
          <span className="font-medium">Sesengura Ifoto</span>
        </button>
      </div>

      {activeMode === 'generate' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-emerald-900">Hanga ifoto ukoresheje amagambo</h3>
              <p className="text-stone-500 text-sm">Sobanura ifoto wifuza, ai.rw irayiguha.</p>
            </div>
            
            <div className="flex gap-3">
              <input
                type="text"
                value={genPrompt}
                onChange={(e) => setGenPrompt(e.target.value)}
                placeholder="Urugero: Injangwe irimo gukina umupira..."
                className="flex-1 p-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <Button onClick={handleGenerate} isLoading={isGenerating} disabled={!genPrompt.trim()}>
                Hanga
              </Button>
            </div>
            
            {/* Aspect Ratio Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <span className="text-xs font-medium text-emerald-800 flex items-center shrink-0">
                <Ratio className="w-3 h-3 mr-1" />
                Ingano:
              </span>
              {ratios.map(r => (
                <button
                  key={r.value}
                  onClick={() => setAspectRatio(r.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                    aspectRatio === r.value 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-emerald-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            
            <ProgressBar isLoading={isGenerating} label="Irimo guhanga ifoto..." duration={5000} />

            <div id="main-image-viewer" className={`relative w-full bg-emerald-50 rounded-xl flex items-center justify-center overflow-hidden border border-emerald-200 border-dashed ${
                aspectRatio === '16:9' ? 'aspect-video' : 
                aspectRatio === '9:16' ? 'aspect-[9/16] max-w-sm mx-auto' : 
                aspectRatio === '4:3' ? 'aspect-[4/3]' : 
                aspectRatio === '3:4' ? 'aspect-[3/4] max-w-sm mx-auto' : 
                aspectRatio === '3:2' ? 'aspect-[3/2]' : 
                aspectRatio === '2:3' ? 'aspect-[2/3] max-w-sm mx-auto' : 
                'aspect-square max-w-lg mx-auto'
            }`}>
              {isGenerating ? (
                <div className="text-center p-6">
                  <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-3" />
                  <p className="text-emerald-800 font-medium">ai.rw irimo gukora ifoto...</p>
                  <p className="text-emerald-600 text-sm mt-1">Bishobora gufata amasegonda make</p>
                </div>
              ) : generatedImageUrl ? (
                <div className="relative w-full h-full group">
                  <img src={generatedImageUrl} alt="Generated" className="w-full h-full object-contain bg-black/5" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button
                      onClick={() => handleDownloadImage(generatedImageUrl!)}
                      className="p-3 bg-white text-emerald-600 rounded-full shadow-lg hover:bg-emerald-50 transition-colors transform hover:scale-105"
                      title="Manura Ifoto (Download)"
                    >
                      <Download className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => setGeneratedImageUrl(null)}
                      className="p-3 bg-white text-red-600 rounded-full shadow-lg hover:bg-red-50 transition-colors transform hover:scale-105"
                      title="Siba"
                    >
                      <span className="font-bold px-1">X</span>
                    </button>
                    {onNavigateToTTS && (
                      <button
                        onClick={() => onNavigateToTTS("Iyi ni ifoto yakozwe na A.I. " + genPrompt)}
                        className="p-3 bg-white text-emerald-600 rounded-full shadow-lg hover:bg-emerald-50 transition-colors transform hover:scale-105"
                        title="Soma mu ijwi"
                      >
                        <Volume2 className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-emerald-400">
                  <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nta foto irakorwa</p>
                </div>
              )}
            </div>
          </div>

          {/* History Section */}
          {genHistory.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-emerald-100">
              <h3 className="text-sm font-bold text-emerald-900 flex items-center">
                <History className="w-4 h-4 mr-2" />
                Amateka y'Amafoto
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {genHistory.map((item) => (
                  <div key={item.id} className="group relative rounded-lg overflow-hidden border border-emerald-100 bg-white hover:shadow-md transition-all">
                    <div 
                      className="aspect-square bg-stone-100 cursor-pointer overflow-hidden"
                      onClick={() => handleRestoreFromHistory(item)}
                    >
                      <img src={item.url} alt="History" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                         <ArrowUpRight className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all" />
                      </div>
                    </div>
                    <div className="p-2 space-y-1">
                      <p className="text-[10px] text-stone-500 truncate" title={item.prompt}>{item.prompt}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-stone-400 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        <button 
                          onClick={() => handleDownloadImage(item.url)}
                          className="text-emerald-500 hover:text-emerald-700 p-1 hover:bg-emerald-50 rounded"
                          title="Manura"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="space-y-2">
            <h3 className="text-lg font-semibold text-emerald-900">Sesengura Ifoto</h3>
            <p className="text-stone-500 text-sm">Shyiramo ifoto ubaze ai.rw ibibazo kuri yo mu Kinyarwanda.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className={`aspect-square w-full rounded-xl border-2 flex flex-col items-center justify-center overflow-hidden relative transition-colors ${
                  isCameraOpen ? 'border-emerald-500 bg-black' : 
                  selectedImage ? 'border-emerald-300 bg-emerald-50' : 
                  'border-dashed border-stone-300 hover:border-emerald-400 hover:bg-emerald-50'
                }`}>
                
                {isCameraOpen ? (
                  <>
                    <video ref={videoRef} autoPlay playsInline className={`absolute inset-0 w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} />
                    
                    <div className={`absolute inset-0 bg-white z-50 pointer-events-none transition-opacity ${isFlashing ? 'duration-0 opacity-100' : 'duration-700 ease-out opacity-0'}`} />

                    <div className="absolute bottom-4 flex gap-4 z-10 items-center justify-center w-full px-4">
                       <button 
                         onClick={stopCamera}
                         className="p-3 bg-red-500/80 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg backdrop-blur-sm"
                         title="Hagarika"
                       >
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                       </button>
                       
                       <button 
                         onClick={capturePhoto}
                         className="p-1 rounded-full border-4 border-white/50 hover:border-white transition-all shadow-xl"
                         title="Fata Ifoto"
                       >
                         <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors">
                            <Camera className="w-8 h-8" />
                         </div>
                       </button>

                       <button 
                         onClick={captureAndRead}
                         className="p-3 bg-emerald-600/90 rounded-full text-white hover:bg-emerald-700 transition-colors shadow-lg backdrop-blur-sm flex items-center gap-2 font-bold text-xs"
                         title="Fata & Soma (OCR)"
                       >
                         <ScanText className="w-5 h-5" />
                         <span>Soma</span>
                       </button>

                       <button 
                         onClick={toggleCamera}
                         className="p-3 bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors shadow-lg backdrop-blur-sm"
                         title="Hindura Kamera"
                       >
                         <SwitchCamera className="w-6 h-6" />
                       </button>
                    </div>
                  </>
                ) : selectedImage ? (
                  <div className="relative w-full h-full">
                    <img src={selectedImage} alt="Preview" className="w-full h-full object-contain rounded-lg p-2" />
                    
                    {/* Bounding Box Overlays */}
                    {showOverlays && analysisResult?.detectedObjects && analysisResult.detectedObjects.map((obj, idx) => (
                      <div
                        key={idx}
                        className="absolute border-2 border-emerald-500 bg-emerald-500/10 rounded-sm hover:bg-emerald-500/20 transition-colors animate-in fade-in zoom-in-95 duration-500"
                        style={getBoxStyle(obj.box_2d)}
                      >
                         <span className="absolute -top-6 left-0 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                           {obj.label}
                         </span>
                      </div>
                    ))}
                    
                    {analysisResult?.detectedObjects && analysisResult.detectedObjects.length > 0 && (
                      <button 
                        onClick={() => setShowOverlays(!showOverlays)}
                        className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 backdrop-blur-sm transition-colors z-10"
                        title={showOverlays ? "Hisha ibyabonetse" : "Erekana ibyabonetse"}
                      >
                         {showOverlays ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full p-4 text-center">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="w-10 h-10 text-stone-400 mb-2" />
                      <p className="text-sm font-medium text-stone-600">Kanda hano ushyiremo ifoto</p>
                    </div>
                    
                    <div className="my-4 w-1/2 border-t border-stone-200"></div>
                    
                    <Button variant="secondary" onClick={() => { setFacingMode('environment'); startCamera(); }} className="w-auto px-6">
                      <Camera className="w-4 h-4 mr-2" />
                      Fata Ifoto
                    </Button>
                  </div>
                )}
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  accept="image/*" 
                  className="hidden" 
                />
                
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {selectedImage && (
                 <Button variant="secondary" onClick={() => { setSelectedImage(null); setAnalysisResult(null); }} className="w-full">
                  Siba Ifoto
                 </Button>
              )}
            </div>

            <div className="flex flex-col h-full space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700">Ikibazo kuri iyi foto (Ubushake)</label>
                <textarea
                  value={analysisPrompt}
                  onChange={(e) => setAnalysisPrompt(e.target.value)}
                  placeholder="Sobanura iyi foto... (Cyangwa: Soma inyandiko iriho)"
                  className="w-full p-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 resize-none h-24"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleAnalyze} 
                  isLoading={isAnalyzing} 
                  disabled={!selectedImage || isAnalyzing} 
                  className="flex-1"
                >
                  {analysisPrompt ? "Baza Ikibazo" : "Sesengura"}
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={handleOCR} 
                  isLoading={isAnalyzing} 
                  disabled={!selectedImage || isAnalyzing}
                  title="Kuramo inyandiko"
                  className="px-4"
                >
                  <ScanText className="w-5 h-5 md:mr-2" />
                  <span className="hidden md:inline">Soma Inyandiko (OCR)</span>
                </Button>
              </div>

              <div className="flex-1 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 overflow-y-auto" ref={resultRef}>
                {analysisResult ? (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="flex flex-col space-y-2">
                       <div className="flex justify-between items-center">
                        {analysisResult.imageType && (
                          <div className="flex items-center px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md text-xs font-semibold shadow-sm border border-emerald-200">
                             {getImageTypeIcon(analysisResult.imageType)}
                             {analysisResult.imageType}
                          </div>
                        )}
                        
                        {onNavigateToTTS && (
                          <button
                            onClick={() => onNavigateToTTS(analysisResult.description)}
                            className="text-xs flex items-center text-emerald-600 hover:text-emerald-700 font-medium bg-white border border-emerald-100 px-2 py-1 rounded-md transition-colors shadow-sm"
                            title="Soma mu ijwi"
                          >
                            <Volume2 className="w-3.5 h-3.5 mr-1.5" />
                            Soma
                          </button>
                        )}
                       </div>

                       <div className="flex items-center text-sm font-semibold text-emerald-800">
                          <Target className="w-4 h-4 mr-1.5" />
                          Ibisobanuro
                       </div>
                    </div>
                    
                    <p className="text-stone-800 whitespace-pre-wrap leading-relaxed text-sm">
                      {analysisResult.description}
                    </p>

                    <div className="bg-white p-3 rounded-lg border border-emerald-100">
                      <div className="flex justify-between items-center mb-1.5">
                        <h4 className="text-xs font-semibold text-stone-500 flex items-center">
                          <BarChart className="w-3.5 h-3.5 mr-1.5" />
                          Icyizere (Confidence)
                        </h4>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          analysisResult.confidenceScore >= 80 ? 'bg-emerald-100 text-emerald-700' : 
                          analysisResult.confidenceScore >= 50 ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {analysisResult.confidenceScore}%
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden mb-2">
                        <div 
                          className={`h-full transition-all duration-1000 ease-out ${getConfidenceColor(analysisResult.confidenceScore)}`}
                          style={{ width: `${analysisResult.confidenceScore}%` }}
                        />
                      </div>
                      
                      <div className="flex items-start gap-2 bg-stone-50 p-2 rounded-md">
                         {analysisResult.confidenceScore < 50 ? (
                           <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                         ) : (
                           <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                         )}
                         <div className="flex flex-col">
                            <p className="text-[10px] font-medium text-stone-600">
                              {getConfidenceLabel(analysisResult.confidenceScore)}
                            </p>
                            <p className="text-[10px] text-stone-500 leading-tight mt-0.5">
                              {getConfidenceMessage(analysisResult.confidenceScore)}
                            </p>
                         </div>
                      </div>
                    </div>

                    {analysisResult.keyObservations && analysisResult.keyObservations.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-emerald-800 mb-2 flex items-center">
                          <Tag className="w-3.5 h-3.5 mr-1.5" />
                          Ibintu by'ingenzi
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.keyObservations.map((obs, idx) => (
                            <span 
                              key={idx}
                              className="text-xs bg-white text-emerald-700 border border-emerald-200 px-2 py-1 rounded-md shadow-sm"
                            >
                              {obs}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysisResult.detectedObjects && analysisResult.detectedObjects.length > 0 && (
                       <div>
                        <h4 className="text-xs font-semibold text-emerald-800 mb-2 flex items-center">
                          <Target className="w-3.5 h-3.5 mr-1.5" />
                          Ibyabonetse mu ifoto ({analysisResult.detectedObjects.length})
                        </h4>
                        <div className="text-xs text-stone-600">
                           {analysisResult.detectedObjects.map(obj => obj.label).join(', ')}.
                        </div>
                       </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-stone-400 text-sm italic space-y-2">
                    {isAnalyzing ? (
                      <div className="w-full px-8">
                         <div className="flex flex-col items-center mb-2">
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
                            <p>ai.rw irimo gusesengura...</p>
                         </div>
                         <ProgressBar isLoading={true} duration={4000} />
                      </div>
                    ) : (
                      <p>Ibisubizo bizaza hano...</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};