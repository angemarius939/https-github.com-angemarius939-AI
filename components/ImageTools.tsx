
import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Sparkles, Upload, Loader2, Target, BarChart, Tag, Volume2, Camera, SwitchCamera, FileText, PenTool, LayoutTemplate, Monitor, ScanText, Download, Ratio, History, Clock, ArrowUpRight, Info, AlertTriangle, Eye, EyeOff, X } from 'lucide-react';
import { analyzeImage, generateImage, extractTextFromImage } from '../services/geminiService';
import { Button } from './Button';
import { useToast } from './ToastProvider';
import { ImageAnalysisResult } from '../types';
import { ProgressBar } from './ProgressBar';
import { FormattedText } from './FormattedText';

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
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full p-4 md:p-8 space-y-6 overflow-y-auto">
      {/* Header & Tabs */}
      <div className="space-y-6">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold text-emerald-900">Amafoto & Ishusho</h2>
          <p className="text-emerald-700 mt-1">Hanga amafoto mashya cyangwa usesengure ayo ufite.</p>
        </div>

        <div className="flex border-b border-stone-200 bg-white rounded-t-xl overflow-hidden shadow-sm">
          <button
            onClick={() => setActiveMode('generate')}
            className={`flex-1 py-4 flex items-center justify-center font-medium transition-all duration-200 ${
              activeMode === 'generate' 
                ? 'text-emerald-700 border-b-2 border-emerald-500 bg-emerald-50/50' 
                : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Sparkles className={`w-5 h-5 mr-2 ${activeMode === 'generate' ? 'text-emerald-500' : 'text-stone-400'}`} />
            Hanga Ifoto
          </button>
          <button
            onClick={() => setActiveMode('analyze')}
            className={`flex-1 py-4 flex items-center justify-center font-medium transition-all duration-200 ${
              activeMode === 'analyze' 
                ? 'text-emerald-700 border-b-2 border-emerald-500 bg-emerald-50/50' 
                : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
            }`}
          >
            <ImageIcon className={`w-5 h-5 mr-2 ${activeMode === 'analyze' ? 'text-emerald-500' : 'text-stone-400'}`} />
            Sesengura Ifoto
          </button>
        </div>
      </div>

      {activeMode === 'generate' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          
          {/* SECTION 1: CREATION STUDIO */}
          <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-6 space-y-6">
            <div className="border-b border-emerald-50 pb-4">
               <h3 className="text-lg font-bold text-emerald-900 flex items-center">
                 <Sparkles className="w-5 h-5 mr-2 text-emerald-500" />
                 Studio (Aho guhangira)
               </h3>
               <p className="text-stone-500 text-sm mt-1">Sobanura ifoto wifuza, hanyuma uhitemo ingano yayo.</p>
            </div>

            <div className="space-y-4">
              {/* Prompt Input */}
              <div className="space-y-2">
                 <label className="text-sm font-medium text-emerald-800">Ubusobanuro (Prompt)</label>
                 <textarea
                   value={genPrompt}
                   onChange={(e) => setGenPrompt(e.target.value)}
                   placeholder="Urugero: Injangwe irimo gukina umupira mu busitani bwiza..."
                   className="w-full p-4 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none bg-emerald-50/20 text-stone-800"
                 />
              </div>

              {/* Aspect Ratio & Action Row */}
              <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-end">
                 <div className="space-y-2 w-full md:w-auto">
                    <label className="text-sm font-medium text-emerald-800 flex items-center">
                      <Ratio className="w-4 h-4 mr-2" />
                      Ingano (Ratio)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ratios.map(r => (
                        <button
                          key={r.value}
                          onClick={() => setAspectRatio(r.value)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 ${
                            aspectRatio === r.value 
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md transform scale-105' 
                              : 'bg-white text-stone-600 border-stone-200 hover:border-emerald-300 hover:bg-emerald-50'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                 </div>

                 <Button 
                   onClick={handleGenerate} 
                   isLoading={isGenerating} 
                   disabled={!genPrompt.trim()}
                   className="w-full md:w-auto px-8 h-11"
                 >
                   Hanga Ifoto
                 </Button>
              </div>

              <ProgressBar isLoading={isGenerating} label="Irimo guhanga ifoto..." duration={5000} />
            </div>
          </div>

          {/* SECTION 2: MY CREATIONS & PREVIEW */}
          <div className="bg-stone-50/50 rounded-xl border border-stone-200 p-6 space-y-6">
             <h3 className="text-lg font-bold text-emerald-900 flex items-center">
                <History className="w-5 h-5 mr-2 text-emerald-600" />
                Ibyakozwe (My Creations)
             </h3>

             {/* Main Viewer - Only shown if generating or result exists */}
             {(isGenerating || generatedImageUrl) && (
               <div id="main-image-viewer" className={`relative w-full bg-white rounded-xl flex items-center justify-center overflow-hidden border border-emerald-200 shadow-sm mx-auto transition-all duration-500 ${
                   aspectRatio === '16:9' ? 'aspect-video' : 
                   aspectRatio === '9:16' ? 'aspect-[9/16] max-w-sm' : 
                   aspectRatio === '4:3' ? 'aspect-[4/3]' : 
                   aspectRatio === '3:4' ? 'aspect-[3/4] max-w-sm' : 
                   'aspect-square max-w-lg'
               }`}>
                 {isGenerating ? (
                   <div className="text-center p-6">
                     <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-3" />
                     <p className="text-emerald-800 font-medium">ai.rw irimo gukora ifoto...</p>
                     <p className="text-emerald-600 text-sm mt-1">Bishobora gufata amasegonda make</p>
                   </div>
                 ) : generatedImageUrl ? (
                   <div className="relative w-full h-full group">
                     <img src={generatedImageUrl} alt="Generated" className="w-full h-full object-contain" />
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
                         title="Funga"
                       >
                         <X className="w-6 h-6" />
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
                 ) : null}
               </div>
             )}

             {/* History Grid */}
             {genHistory.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {genHistory.map((item) => (
                    <div key={item.id} className="group relative rounded-lg overflow-hidden border border-emerald-100 bg-white hover:shadow-md transition-all">
                      <div 
                        className="aspect-square bg-stone-100 cursor-pointer overflow-hidden relative"
                        onClick={() => handleRestoreFromHistory(item)}
                      >
                        <img src={item.url} alt="History" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                           <ArrowUpRight className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all" />
                        </div>
                      </div>
                      <div className="p-2 space-y-1">
                        <p className="text-[10px] text-stone-500 truncate font-medium" title={item.prompt}>{item.prompt}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-stone-400 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDownloadImage(item.url); }}
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
             ) : (
                !isGenerating && !generatedImageUrl && (
                  <div className="text-center py-12 text-stone-400 bg-white rounded-xl border border-dashed border-stone-200">
                     <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                     <p className="text-sm font-medium">Nta mafoto urakora. Koresha Studio hejuru!</p>
                  </div>
                )
             )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-b-xl rounded-tl-xl shadow-sm border border-emerald-100 p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 mt-0">
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
                    
                    {/* Close Button Top Right */}
                    <button 
                      onClick={stopCamera}
                      className="absolute top-4 right-4 p-2 bg-black/40 rounded-full text-white hover:bg-red-500/80 transition-colors backdrop-blur-md"
                      title="Hagarika"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    {/* Camera Controls Bottom */}
                    <div className="absolute bottom-6 left-0 right-0 flex items-center justify-evenly px-6 pb-2 safe-area-bottom">
                       {/* Switch Camera */}
                       <button 
                         onClick={toggleCamera}
                         className="p-3 bg-black/40 rounded-full text-white hover:bg-black/60 backdrop-blur-md transition-all"
                         title="Hindura Kamera"
                       >
                         <SwitchCamera className="w-6 h-6" />
                       </button>

                       {/* Capture */}
                       <button 
                         onClick={capturePhoto}
                         className="relative p-1 rounded-full border-4 border-white/80 transition-transform active:scale-95"
                         title="Fata Ifoto"
                       >
                         <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-stone-300">
                            <Camera className="w-8 h-8 opacity-50" />
                         </div>
                       </button>

                       {/* OCR / Scan */}
                       <button 
                         onClick={captureAndRead}
                         className="p-3 bg-emerald-500 rounded-full text-white hover:bg-emerald-600 backdrop-blur-md transition-all shadow-lg flex flex-col items-center justify-center gap-0.5"
                         title="Fata & Soma (OCR)"
                       >
                         <ScanText className="w-6 h-6" />
                         <span className="text-[9px] font-bold uppercase tracking-wide">Soma</span>
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
                    
                    <div className="text-stone-800 leading-relaxed text-sm">
                      <FormattedText text={analysisResult.description} />
                    </div>

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
