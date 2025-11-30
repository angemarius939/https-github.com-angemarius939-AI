import React, { useState } from 'react';
import { FileText, Languages, Wand2, Copy, Check, MessageCircle, Volume2, Code, Terminal } from 'lucide-react';
import { generateTextAnalysis } from '../services/geminiService';
import { Button } from './Button';
import { useToast } from './ToastProvider';
import { ProgressBar } from './ProgressBar';

interface TextAssistantProps {
  onNavigateToTTS?: (text: string) => void;
}

export const TextAssistant: React.FC<TextAssistantProps> = ({ onNavigateToTTS }) => {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'summarize' | 'translate' | 'grammar'>('summarize');
  const [tone, setTone] = useState<'formal' | 'informal' | 'friendly'>('formal');
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleAction = async () => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    setResult(''); 
    try {
      const output = await generateTextAnalysis(inputText, activeTab, tone);
      setResult(output);
      showToast('Byakozwe neza!', 'success');
    } catch (error) {
      setResult("Habaye ikibazo.");
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

  const copyCodeSnippet = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast('Code yakoporowe!', 'info');
  };

  const toneOptions = [
    { value: 'formal', label: 'Byiyubashye' },
    { value: 'informal', label: 'Bisanzwe' },
    { value: 'friendly', label: 'Gicuti' },
  ] as const;

  // Function to render text with syntax highlighting for code blocks
  const renderFormattedResult = (text: string) => {
    if (!text) return <span className="text-stone-400 italic">Igisubizo kizaza hano...</span>;

    // Split text by markdown code blocks: ```lang ... ```
    const parts = text.split(/(```[\w-]*\n[\s\S]*?```)/g);

    return parts.map((part, index) => {
      // Check if this part is a code block
      if (part.startsWith('```')) {
        const match = part.match(/```([\w-]*)\n([\s\S]*?)```/);
        if (match) {
          const language = match[1] || 'Code';
          const codeContent = match[2];
          return (
            <div key={index} className="my-4 rounded-lg overflow-hidden border border-emerald-900/10 shadow-sm group">
              <div className="bg-stone-800 text-stone-300 px-4 py-1.5 text-xs font-mono flex justify-between items-center border-b border-stone-700">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3 h-3" />
                  <span className="uppercase tracking-wider text-[10px]">{language || 'TEXT'}</span>
                </div>
                <button
                  onClick={() => copyCodeSnippet(codeContent)}
                  className="hover:text-white transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100 duration-200"
                  title="Koporora Code"
                >
                  <Copy className="w-3 h-3" />
                  <span className="text-[10px]">Koporora</span>
                </button>
              </div>
              <pre className="bg-[#1e1e1e] text-emerald-50 p-4 overflow-x-auto text-sm font-mono leading-relaxed">
                <code>{codeContent}</code>
              </pre>
            </div>
          );
        }
      }

      // Handle regular text paragraphs and bold formatting
      return (
        <div key={index} className="whitespace-pre-wrap mb-2 leading-relaxed text-stone-800">
          {part.split(/(\*\*.*?\*\*)/g).map((subPart, subIndex) => 
            subPart.startsWith('**') && subPart.endsWith('**') ? (
              <strong key={subIndex} className="font-bold text-emerald-900">
                {subPart.slice(2, -2)}
              </strong>
            ) : (
              subPart
            )
          )}
        </div>
      );
    });
  };

  const getActionLabel = () => {
    const toneLabel = toneOptions.find(t => t.value === tone)?.label;
    if (activeTab === 'summarize') return 'Kora Incamake';
    if (activeTab === 'translate') return 'Hindura mu Kinyarwanda';
    return `Kosora Imyandikire (${toneLabel})`;
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-6 max-w-4xl mx-auto w-full overflow-y-auto">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-emerald-900">Ibikoresho by'Umwandiko</h2>
        <p className="text-emerald-600 mt-2">Hitamo igikorwa ushaka gukora ku mwandiko wawe.</p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 space-x-1 bg-emerald-50 rounded-xl border border-emerald-100">
        <button
          onClick={() => setActiveTab('summarize')}
          className={`flex-1 flex items-center justify-center py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'summarize' ? 'bg-white text-emerald-700 shadow-sm' : 'text-emerald-500 hover:text-emerald-700'
          }`}
        >
          <FileText className="w-4 h-4 mr-2" />
          Incamake
        </button>
        <button
          onClick={() => setActiveTab('translate')}
          className={`flex-1 flex items-center justify-center py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'translate' ? 'bg-white text-emerald-700 shadow-sm' : 'text-emerald-500 hover:text-emerald-700'
          }`}
        >
          <Languages className="w-4 h-4 mr-2" />
          Hindura
        </button>
        <button
          onClick={() => setActiveTab('grammar')}
          className={`flex-1 flex items-center justify-center py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'grammar' ? 'bg-white text-emerald-700 shadow-sm' : 'text-emerald-500 hover:text-emerald-700'
          }`}
        >
          <Wand2 className="w-4 h-4 mr-2" />
          Kosora
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Input Section */}
        <div className="flex flex-col space-y-4">
          <label className="text-sm font-medium text-emerald-800">Umwandiko wawe</label>
          
          <textarea
            className="flex-1 w-full p-4 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none bg-white text-stone-800 min-h-[150px] font-sans"
            placeholder="Shyira umwandiko hano..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-emerald-800 flex items-center">
              <MessageCircle className="w-4 h-4 mr-1 text-emerald-500" />
              Imvugo
            </label>
            <div className="flex bg-emerald-50/50 p-1 rounded-lg border border-emerald-100">
              {toneOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTone(option.value)}
                  className={`flex-1 py-2 px-2 text-xs md:text-sm font-medium rounded-md transition-all duration-200 flex flex-col md:flex-row items-center justify-center gap-1 ${
                    tone === option.value
                      ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100'
                      : 'text-stone-500 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2 space-y-2">
             <Button 
              onClick={handleAction} 
              isLoading={isLoading} 
              disabled={!inputText.trim()}
              className="w-full"
            >
              {getActionLabel()}
            </Button>
            <ProgressBar isLoading={isLoading} label="Irimo gutunganya..." />
          </div>
        </div>

        {/* Output Section */}
        <div className="flex flex-col space-y-3 h-full">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-emerald-800">Igisubizo</label>
            {result && (
              <div className="flex items-center gap-3">
                {onNavigateToTTS && (
                  <button
                    onClick={() => onNavigateToTTS(result)}
                    className="text-xs flex items-center text-emerald-600 hover:text-emerald-700 font-medium bg-emerald-50 px-2 py-1 rounded-md transition-colors border border-emerald-100"
                    title="Soma"
                  >
                    <Volume2 className="w-3 h-3 mr-1.5" />
                    Soma
                  </button>
                )}
                <button 
                  onClick={handleCopy}
                  className="text-xs flex items-center text-emerald-600 hover:text-emerald-700 font-medium bg-emerald-50 px-2 py-1 rounded-md transition-colors border border-emerald-100"
                >
                  {copied ? <Check className="w-3 h-3 mr-1.5" /> : <Copy className="w-3 h-3 mr-1.5" />}
                  {copied ? 'Byakoporowe' : 'Koporora'}
                </button>
              </div>
            )}
          </div>
          
          <div className="flex-1 w-full flex flex-col rounded-xl border border-emerald-200 bg-white overflow-hidden shadow-sm">
             {/* Context Header */}
             <div className="bg-emerald-50/50 border-b border-emerald-100 px-4 py-2 flex items-center text-xs text-emerald-600 font-medium">
               <div className="flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                 <span>{activeTab === 'summarize' ? 'Incamake' : activeTab === 'translate' ? 'Ubusobanuro' : 'Ikosora'}</span>
                 <span className="text-emerald-300">|</span>
                 <span className="uppercase text-[10px] tracking-wide">{toneOptions.find(t => t.value === tone)?.label}</span>
               </div>
             </div>

             {/* Result Content */}
             <div className="flex-1 p-4 overflow-y-auto min-h-[250px] bg-stone-50/30">
               {renderFormattedResult(result)}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};