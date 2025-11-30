import React, { useState } from 'react';
import { Sprout, Briefcase, HandPlatter, Send, Loader2, Zap, Smartphone, Wifi, BatteryCharging } from 'lucide-react';
import { generateRuralAdvice } from '../services/geminiService';
import { Button } from './Button';
import { useToast } from './ToastProvider';

export const RuralAssistant: React.FC = () => {
  const [sector, setSector] = useState<'agriculture' | 'business' | 'services' | 'technology'>('agriculture');
  const [query, setQuery] = useState('');
  const [advice, setAdvice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
      "Kwiyandikisha ku Irembo",
      "Kwishyura Mituweli",
      "Gufata icyangombwa cy'ubutaka",
      "Serivisi z'ejo heza"
    ],
    technology: [
      "Gukoresha Mobile Money",
      "Kugura umuriro kuri telefoni",
      "Gufungura konti ya Irembo",
      "Gukoresha internet kuri telefoni"
    ]
  };

  const handleGetAdvice = async (promptOverride?: string) => {
    const promptToUse = promptOverride || query;
    if (!promptToUse.trim()) return;
    
    if (promptOverride) setQuery(promptOverride);

    setIsLoading(true);
    setAdvice('');
    try {
      // We pass the sector to the service. For 'technology', the service might default to general advice
      // but we can update the prompt context implicitly or update the service later.
      // For now, passing the prompt is sufficient as the AI context is strong.
      const result = await generateRuralAdvice(promptToUse, sector as any);
      setAdvice(result);
      showToast('Inama yabonetse!', 'success');
    } catch (error) {
      setAdvice("Habaye ikibazo kubona inama.");
      showToast('Habaye ikibazo.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getSectorIcon = () => {
    switch (sector) {
      case 'agriculture': return <Sprout className="w-12 h-12 text-green-600 mb-2" />;
      case 'business': return <Briefcase className="w-12 h-12 text-blue-600 mb-2" />;
      case 'services': return <HandPlatter className="w-12 h-12 text-orange-600 mb-2" />;
      case 'technology': return <Smartphone className="w-12 h-12 text-purple-600 mb-2" />;
    }
  };

  const getSectorTitle = () => {
    switch (sector) {
      case 'agriculture': return "Ubuhinzi n'Ubworozi";
      case 'business': return "Ubucuruzi Buto";
      case 'services': return "Serivisi zitandukanye";
      case 'technology': return "Ikoranabuhanga";
    }
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6 overflow-y-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-emerald-900">Iterambere</h2>
        <p className="text-emerald-700 mt-2">Inama z'ubuhinzi, ubucuruzi, serivisi n'ikoranabuhanga.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => { setSector('agriculture'); setAdvice(''); }}
          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center text-center ${
            sector === 'agriculture'
              ? 'border-green-500 bg-green-50 shadow-md transform scale-105'
              : 'border-slate-200 bg-white hover:border-green-300 hover:bg-green-50/50'
          }`}
        >
          <Sprout className={`w-6 h-6 md:w-8 md:h-8 mb-2 ${sector === 'agriculture' ? 'text-green-600' : 'text-slate-400'}`} />
          <span className={`text-xs md:text-sm font-semibold ${sector === 'agriculture' ? 'text-green-800' : 'text-slate-600'}`}>Ubuhinzi</span>
        </button>

        <button
          onClick={() => { setSector('business'); setAdvice(''); }}
          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center text-center ${
            sector === 'business'
              ? 'border-blue-500 bg-blue-50 shadow-md transform scale-105'
              : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
          }`}
        >
          <Briefcase className={`w-6 h-6 md:w-8 md:h-8 mb-2 ${sector === 'business' ? 'text-blue-600' : 'text-slate-400'}`} />
          <span className={`text-xs md:text-sm font-semibold ${sector === 'business' ? 'text-blue-800' : 'text-slate-600'}`}>Ubucuruzi</span>
        </button>

        <button
          onClick={() => { setSector('services'); setAdvice(''); }}
          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center text-center ${
            sector === 'services'
              ? 'border-orange-500 bg-orange-50 shadow-md transform scale-105'
              : 'border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/50'
          }`}
        >
          <HandPlatter className={`w-6 h-6 md:w-8 md:h-8 mb-2 ${sector === 'services' ? 'text-orange-600' : 'text-slate-400'}`} />
          <span className={`text-xs md:text-sm font-semibold ${sector === 'services' ? 'text-orange-800' : 'text-slate-600'}`}>Serivisi</span>
        </button>

        <button
          onClick={() => { setSector('technology'); setAdvice(''); }}
          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center text-center ${
            sector === 'technology'
              ? 'border-purple-500 bg-purple-50 shadow-md transform scale-105'
              : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/50'
          }`}
        >
          <Smartphone className={`w-6 h-6 md:w-8 md:h-8 mb-2 ${sector === 'technology' ? 'text-purple-600' : 'text-slate-400'}`} />
          <span className={`text-xs md:text-sm font-semibold ${sector === 'technology' ? 'text-purple-800' : 'text-slate-600'}`}>Ikoranabuhanga</span>
        </button>
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

        <div className="flex-1 min-h-[300px] p-4 bg-stone-50 rounded-xl border border-stone-200 overflow-y-auto whitespace-pre-wrap">
          {advice ? (
            <div className="text-slate-800 leading-relaxed animate-in fade-in duration-500 pb-4">
              <h4 className="font-semibold text-emerald-800 mb-2 flex items-center sticky top-0 bg-stone-50 py-2 border-b border-stone-200">
                <Sprout className="w-4 h-4 mr-2" />
                Inama ya ai.rw:
              </h4>
              {advice}
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
