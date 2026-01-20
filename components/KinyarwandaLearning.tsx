
import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, PenTool, Sparkles, Send, Copy, Check, History, GraduationCap, Languages, ScrollText, Library, FileText, ExternalLink } from 'lucide-react';
import { generateKinyarwandaContent } from '../services/geminiService';
import { Button } from './Button';
import { useToast } from './ToastProvider';
import { ProgressBar } from './ProgressBar';
import { FormattedText } from './FormattedText';
import { SourcesToggle } from './SourcesToggle';
import { Source } from '../types';

export const KinyarwandaLearning: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'learn' | 'compose'>('learn');
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();
  const resultRef = useRef<HTMLDivElement>(null);

  const learnTopics = [
    { label: "Ikibonezamvugo (Grammar)", icon: BookOpen },
    { label: "Imyandikire (Orthography)", icon: PenTool },
    { label: "Amagambo n'Inyito (Vocabulary)", icon: Library },
    { label: "Ubuvanganzo (Literature)", icon: ScrollText }
  ];

  const composeFormats = [
    { label: "Umurabyo (Poem)", icon: Sparkles },
    { label: "Inkuru (Story)", icon: ScrollText },
    { label: "Ikina (Play)", icon: GraduationCap },
    { label: "Ibaruwa (Letter)", icon: FileText }
  ];

  const handleAction = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || topic;
    if (!finalPrompt.trim()) return;

    setIsLoading(true);
    setResult('');
    setSources([]);
    setCopied(false);

    try {
      let fullText = "";
      const promptWithInstruction = activeTab === 'learn' 
        ? `Nyamuneka nyigisha ibijyanye na: ${finalPrompt}. Koresha amategeko y'Inteko y'Umuco na REB.`
        : `Nyamuneka mpa umwandiko uhanganye kuri: ${finalPrompt}. Koresha Ikinyarwanda cy'umwimerere kandi gishituye.`;

      await generateKinyarwandaContent(
        promptWithInstruction,
        activeTab,
        (chunk) => {
          fullText += chunk;
          setResult(fullText);
        },
        (newSources) => setSources(newSources)
      );
      showToast('Byakozwe neza!', 'success');
    } catch (error) {
      showToast('Habaye ikibazo.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    showToast('Byakoporowe!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full p-4 md:p-8 space-y-8 overflow-y-auto">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter flex items-center justify-center gap-3">
          <BookOpen className="w-10 h-10 text-emerald-600" />
          Twige Ikinyarwanda
        </h2>
        <p className="text-emerald-700 font-medium max-w-2xl mx-auto">
          Wige ikibonezamvugo, imyandikire, cyangwa uhange ibitabo n'imivugo ukoresheje Ikinyarwanda cy'umwimerere cyemejwe n'inzego z'uburezi.
        </p>
      </div>

      <div className="flex bg-white rounded-2xl shadow-sm border border-emerald-100 p-1">
        <button
          onClick={() => { setActiveTab('learn'); setResult(''); setTopic(''); }}
          className={`flex-1 py-4 px-6 rounded-xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'learn' ? 'bg-emerald-600 text-white shadow-lg' : 'text-stone-500 hover:bg-emerald-50'
          }`}
        >
          <GraduationCap className="w-5 h-5" />
          Kwiga
        </button>
        <button
          onClick={() => { setActiveTab('compose'); setResult(''); setTopic(''); }}
          className={`flex-1 py-4 px-6 rounded-xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'compose' ? 'bg-emerald-600 text-white shadow-lg' : 'text-stone-500 hover:bg-emerald-50'
          }`}
        >
          <PenTool className="w-5 h-5" />
          Guhanga
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-emerald-50 space-y-8">
            <h3 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] px-2">
              {activeTab === 'learn' ? 'Hitamo icyo wiga' : 'Hitamo icyo uhanga'}
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              {(activeTab === 'learn' ? learnTopics : composeFormats).map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAction(item.label)}
                  disabled={isLoading}
                  className="flex items-center gap-4 p-5 rounded-3xl border-2 border-stone-50 bg-white hover:border-emerald-200 hover:bg-emerald-50 transition-all text-left group"
                >
                  <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform shadow-sm">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span className="font-bold text-stone-700 group-hover:text-emerald-900 transition-colors uppercase text-xs tracking-tight">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="pt-6 border-t border-emerald-50">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block px-2 mb-3">Ikibazo cyihariye</label>
              <div className="flex flex-col gap-3">
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={activeTab === 'learn' ? "Andika ikibazo cy'ikibonezamvugo..." : "Andika insanganyamatsiko y'umuvugo..."}
                  className="w-full h-32 p-4 bg-stone-50 border-2 border-stone-50 rounded-3xl outline-none focus:border-emerald-500 transition-colors text-sm font-medium resize-none shadow-inner"
                />
                <Button onClick={() => handleAction()} isLoading={isLoading} disabled={!topic.trim()} className="h-14 rounded-2xl shadow-xl shadow-emerald-600/10 uppercase tracking-widest text-xs font-black">
                  {activeTab === 'learn' ? 'Igisha' : 'Hanga'}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="bg-emerald-950 p-8 rounded-[40px] text-white space-y-6 relative overflow-hidden shadow-2xl">
             <div className="absolute inset-0 rwanda-pattern opacity-10 pointer-events-none"></div>
             <div className="relative z-10">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-4">Ubufasha bwa ai.rw</h4>
                <p className="text-xs text-emerald-100/70 leading-relaxed">
                  Iyi interface igufasha gusobanukirwa ururimi rw'Ikinyarwanda hakurikijwe amategeko agenga imyandikire n'imyivugire yemejwe mu Rwanda.
                </p>
             </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6 min-h-[600px] flex flex-col">
          <div className="flex-1 bg-white rounded-[48px] shadow-sm border border-stone-100 flex flex-col overflow-hidden">
            <div className="p-8 border-b border-stone-50 flex justify-between items-center bg-stone-50/30">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                    {activeTab === 'learn' ? <GraduationCap className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tighter leading-none">{activeTab === 'learn' ? 'Imyigishirize' : 'Umubumbe w\'Ibhangano'}</h3>
                    <p className="text-[10px] text-emerald-600/50 font-bold uppercase tracking-widest mt-1">Hifashishijwe ubumenyi bwa AI</p>
                 </div>
              </div>
              {result && (
                <button 
                  onClick={handleCopy}
                  className="p-3 bg-white hover:bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 transition-all transform active:scale-95"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              )}
            </div>

            <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar" ref={resultRef}>
              {result ? (
                <div className="animate-in fade-in duration-700">
                  <FormattedText text={result} className="text-stone-700 leading-relaxed text-lg" />
                  <SourcesToggle sources={sources} className="mt-12" />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30">
                  {isLoading ? (
                    <div className="w-full max-w-sm space-y-4">
                       <ProgressBar isLoading={true} duration={8000} label="ai.rw irimo gutunganya inyandiko..." />
                       <p className="text-xs font-black uppercase tracking-widest animate-pulse">Irimo gushaka amakuru...</p>
                    </div>
                  ) : (
                    <>
                      <Library className="w-24 h-24 text-emerald-900" />
                      <p className="text-lg font-bold uppercase tracking-tighter text-emerald-950">Tangira urugendo rwawe rw'Ikinyarwanda</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
