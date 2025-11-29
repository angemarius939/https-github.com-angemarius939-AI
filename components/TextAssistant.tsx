import React, { useState } from 'react';
import { FileText, Languages, Wand2, Copy, Check, MessageCircle, Volume2 } from 'lucide-react';
import { generateTextAnalysis } from '../services/geminiService';
import { Button } from './Button';
import { useToast } from './ToastProvider';

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

  const toneOptions = [
    { value: 'formal', label: 'Byiyubashye' },
    { value: 'informal', label: 'Bisanzwe' },
    { value: 'friendly', label: 'Gicuti' },
  ] as const;

  return (
    <div className="flex flex-col h-full p-6 space-y-6 max-w-4xl mx-auto w-full">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        {/* Input Section */}
        <div className="flex flex-col space-y-4">
          <label className="text-sm font-medium text-emerald-800">Umwandiko wawe</label>
          
          <textarea
            className="flex-1 w-full p-4 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none bg-white text-stone-800 min-h-[150px]"
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

          <Button 
            onClick={handleAction} 
            isLoading={isLoading} 
            disabled={!inputText.trim()}
            className="w-full mt-2"
          >
            {activeTab === 'summarize' ? 'Kora Incamake' : activeTab === 'translate' ? 'Hindura mu Kinyarwanda' : 'Kosora Imyandikire'}
          </Button>
        </div>

        {/* Output Section */}
        <div className="flex flex-col space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-emerald-800">Igisubizo</label>
            {result && (
              <div className="flex items-center gap-3">
                {onNavigateToTTS && (
                  <button
                    onClick={() => onNavigateToTTS(result)}
                    className="text-xs flex items-center text-emerald-600 hover:text-emerald-700 font-medium bg-emerald-50 px-2 py-1 rounded-md transition-colors"
                    title="Soma"
                  >
                    <Volume2 className="w-3 h-3 mr-1.5" />
                    Soma
                  </button>
                )}
                <button 
                  onClick={handleCopy}
                  className="text-xs flex items-center text-emerald-600 hover:text-emerald-700 font-medium bg-emerald-50 px-2 py-1 rounded-md transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 mr-1.5" /> : <Copy className="w-3 h-3 mr-1.5" />}
                  {copied ? 'Byakoporowe' : 'Koporora'}
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 w-full p-4 border border-emerald-200 rounded-xl bg-emerald-50/30 text-stone-800 overflow-y-auto whitespace-pre-wrap min-h-[250px]">
            {result || <span className="text-stone-400 italic">Igisubizo kizaza hano...</span>}
          </div>
        </div>
      </div>
    </div>
  );
};