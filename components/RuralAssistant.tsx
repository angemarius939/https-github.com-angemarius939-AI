import React, { useState } from 'react';
import { Sprout, Briefcase, HandPlatter, Send, Loader2, Zap, Smartphone, CloudSun, Copy, Check } from 'lucide-react';
import { generateRuralAdvice } from '../services/geminiService';
import { Button } from './Button';
import { useToast } from './ToastProvider';
import { FormattedText } from './FormattedText';
import { SourcesToggle } from './SourcesToggle';
import { Source } from '../types';

export const RuralAssistant: React.FC = () => {
  const [sector, setSector] = useState<'agriculture' | 'business' | 'services' | 'technology' | 'climate'>('agriculture');
  const [query, setQuery] = useState('');
  const [advice, setAdvice] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const quickActions = {
    agriculture: [
      "Igihe cyiza cyo gutera ibigori",
      "Uko barwanya Nkongwa",
      "Ifumbire ibereye ibishyimbo",
      "Kuhira imyaka mu zuba"
    ],
    business: [
      "Uko wakwizigamira",
      "Gukurura abakiriya bashya",
      "Gufata ibitabo by'ubucuruzi",
      "Gusaba inguzanyo iciriritse"
    ],
    services: [
      "Gusaba Icyangombwa cy'Amavuko",
      "Kwishyura Mituweli",
      "Serivisi z'Ubutaka",
      "Kwiyandikisha muri Ejo Heza"
    ],
    technology: [
      "Gukoresha Mobile Money",
      "Kwishyura umuriro",
      "Gufungura konti ya Irembo",
      "Gukoresha internet kuri telefoni"
    ],
    climate: [
      "Imyaka ihanganira izuba",
      "Ingufu z'imirasire",
      "Kwitegura imyuzure",
      "Kuhira imyaka mu gihe cy'izuba"
    ]
  };

  const handleGetAdvice = async (promptOverride?: string) => {
    const promptToUse = promptOverride || query;
    if (!promptToUse.trim()) return;
    
    if (promptOverride) setQuery(promptOverride);

    setIsLoading(true);
    setAdvice('');
    setSources([]);
    setCopied(false);
    try {
      const result = await generateRuralAdvice(promptToUse, sector);
      setAdvice(result.text);
      setSources(result.sources);
      showToast('Inama yabonetse!', 'success');
    } catch (error) {
      setAdvice("Habaye ikibazo kubona inama.");
      showToast('Habaye ikibazo.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!advice) return;
    navigator.clipboard.writeText(advice);
    setCopied(true);
    showToast('Byakoporowe!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const getSectorIcon = () => {
    switch (sector) {
      case 'agriculture': return <Sprout className="w-12 h-12 text-green-600 mb-2" />;
      case 'business': return <Briefcase className="w-12 h-12 text-blue-600 mb-2" />;
      case 'services': return <HandPlatter className="w-12 h-12 text-orange-600 mb-2" />;
      case 'technology': return <Smartphone className="w-12 h-12 text-purple-600 mb-2" />;
      case 'climate': return <CloudSun className="w-12 h-12 text-teal-600 mb-2" />;
    }
  };

  const getSectorTitle = () => {
    switch (sector) {
      case 'agriculture': return "Ubuhinzi n'Ubworozi";
      case 'business': return "Ubucuruzi Buto";
      case 'services': return "Serivisi zitandukanye";
      case 'technology': return "Ikoranabuhanga";
      case 'climate': return "Ihindagurika ry'Ikirere";
    }
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6 overflow-y-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-emerald-900">Iterambere</h2>
        <p className="text-emerald-700 mt-2">Inama z'ubuhinzi, ubucuruzi, serivisi, ikoranabuhanga n'ikirere.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { id: 'agriculture', label: 'Ubuhinzi', icon: Sprout, color: 'green' },
          { id: 'business', label: 'Ubucuruzi', icon: Briefcase, color: 'blue' },
          { id: 'services', label: 'Serivisi', icon: HandPlatter, color: 'orange' },
          { id: 'technology', label: 'Ikoranabuhanga', icon: Smartphone, color: 'purple' },
          { id: 'climate', label: 'Ikirere', icon: CloudSun, color: 'teal' },
        ].map((item) => (
           <button
            key={item.id}
            onClick={() => { setSector(item.id as any); setAdvice(''); setSources([]); }}
            className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center text-center ${
              sector === item.id
                ? `border-${item.color}-500 bg-${item.color}-50 shadow-md transform scale-105`
                : `border-slate-200 bg-white hover:border-${item.color}-300 hover:bg-${item.color}-50/50`
            }`}
          >
            <item.icon className={`w-6 h-6 mb-1 ${sector === item.id ? `text-${item.color}-600` : 'text-slate-400'}`} />
            <span className={`text-[10px] md:text-xs font-semibold ${sector === item.id ? `text-${item.color}-800` : 'text-slate-600'}`}>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 space-y-4 flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center space-x-3 pb-4 border-b border-emerald-50">
          {getSectorIcon()}
          <div>
            <h3 className="text-lg font-bold text-slate-800">{getSectorTitle()}</h3>
            <p className="text-sm text-slate-500">Baza ikibazo cyawe kijyanye n'iyi serivisi.</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wide flex items-center">
            <Zap className="w-3.5 h-3.5 mr-1.5 fill-current" />
            Ibikunze kubazwa
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickActions[sector].map((action, index) => (
              <button
                key={index}
                onClick={() => handleGetAdvice(action)}
                disabled={isLoading}
                className="text-xs md:text-sm px-4 py-2.5 bg-white text-emerald-800 rounded-lg border border-emerald-100 hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-md transition-all duration-200 text-left shadow-sm active:scale-95 flex items-center justify-between group"
              >
                <span>{action}</span>
                <Send className="w-3 h-3 text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Urugero: ${
              sector === 'agriculture' ? 'Ni ryari bahinga ibigori?' : 
              sector === 'business' ? 'Nakongera nte inyungu?' : 
              sector === 'technology' ? 'Nakoresha nte Mobile Money?' :
              'Ese nabona nte serivisi z\'irembo?'}`}
            className="flex-1 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 resize-none h-24 bg-slate-50 focus:bg-white transition-colors"
          />
          <Button 
            onClick={() => handleGetAdvice()} 
            isLoading={isLoading} 
            disabled={!query.trim()}
            className="h-24 w-20 rounded-xl"
          >
            {!isLoading && <Send className="w-6 h-6" />}
          </Button>
        </div>

        <div className="flex-1 min-h-[300px] p-4 bg-stone-50 rounded-xl border border-stone-200 overflow-y-auto">
          {advice ? (
            <div className="animate-in fade-in duration-500 pb-4">
              <h4 className="font-semibold text-emerald-800 mb-3 flex items-center justify-between sticky top-0 bg-stone-50 py-2 border-b border-stone-200 z-10">
                <div className="flex items-center">
                  <Sprout className="w-4 h-4 mr-2" />
                  Inama ya ai.rw:
                </div>
                <button 
                  onClick={handleCopy}
                  className="p-1.5 rounded-md hover:bg-emerald-100 text-emerald-600 transition-colors"
                  title="Koporora"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </h4>
              <FormattedText text={advice} />
              
              {/* Show Sources Toggle */}
              <SourcesToggle sources={sources} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 italic space-y-2">
              <Loader2 className={`w-8 h-8 ${isLoading ? 'animate-spin text-emerald-500' : 'opacity-20'}`} />
              <p>{isLoading ? 'ai.rw irimo gutekereza...' : 'Igisubizo kizaza hano...'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};