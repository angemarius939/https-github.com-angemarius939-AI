
import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Lightbulb, Microscope, Compass, ArrowRight, Loader2, Wallet, PiggyBank, Briefcase, Activity, FileText, Copy, Check } from 'lucide-react';
import { Button } from './Button';
import { ProgressBar } from './ProgressBar';
import { useToast } from './ToastProvider';
import { generateBusinessAnalysis } from '../services/geminiService';
import { BusinessAnalysisResult } from '../types';
import { FormattedText } from './FormattedText';

export const DecisionAssistant: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<BusinessAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setResult(null);
    setCopied(false);
    try {
      const data = await generateBusinessAnalysis(input);
      setResult(data);
      showToast('Isesengura ryarangiye!', 'success');
    } catch (error: any) {
      console.error("UI Analysis Error:", error);
      showToast('Habaye ikibazo mu gusesengura amakuru.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.summary);
    setCopied(true);
    showToast('Byakoporowe!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const fillExample = (type: string) => {
    let text = "";
    if (type === 'retail') text = "Uyu munsi ncuruje ibicuruzwa by'ibihumbi 50,000 RWF. Naguze ibindi by'ibihumbi 30,000 RWF. Nishyuye umuriro 5,000 RWF.";
    if (type === 'farm') text = "Nasaruye ibigori ibiro 200 kuri 500 RWF/kg. Nashoye imbuto n'ifumbire by'ibihumbi 40,000 RWF. Abakozi bitwaye 15,000 RWF.";
    if (type === 'monthly') text = "Muri uku kwezi twinjije miliyoni 5. Twishyuye abakozi ibihumbi 800, umuriro 100, n'imisoro 200. Twaguze stock ya miliyoni 3.";
    setInput(text);
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto w-full p-4 md:p-8 space-y-8 overflow-y-auto">
      <div className="text-center">
        <h2 className="text-3xl font-black text-emerald-950 flex items-center justify-center gap-3 uppercase tracking-tighter">
          <Microscope className="w-8 h-8 text-emerald-600" />
          Umujyanama
        </h2>
        <p className="text-emerald-700 mt-2 max-w-2xl mx-auto font-medium">
          Andika amakuru y'ubucuruzi cyangwa imibare yawe, ai.rw igusesengurire inyungu n'ibyakorwa.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[32px] shadow-sm border border-emerald-100 p-8">
            <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest mb-6">Injiza Amakuru</h3>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Urugero: Uyu munsi nagurishije..."
              className="w-full h-64 p-5 border-2 border-emerald-50 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none resize-none text-stone-800 text-lg leading-relaxed mb-4 bg-slate-50/50"
            />
            <Button onClick={handleAnalyze} isLoading={isLoading} disabled={!input.trim()} className="w-full h-14 text-lg font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20">
              Sesengura
            </Button>
            <ProgressBar isLoading={isLoading} label="Irimo gusesengura..." duration={4000} />
            <div className="mt-8 pt-6 border-t border-emerald-50 space-y-3">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Ingero z'ibyo wabaza:</p>
              {['retail', 'farm', 'monthly'].map(t => (
                <button key={t} onClick={() => fillExample(t)} className="w-full text-left text-xs p-3 rounded-xl bg-stone-50 hover:bg-emerald-50 text-stone-600 hover:text-emerald-700 transition-all border border-stone-100 hover:border-emerald-200 capitalize font-bold">
                   {t === 'retail' ? '🏪 Ubucuruzi' : t === 'farm' ? '🌽 Ubuhinzi' : '📅 Ukwezi'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {!result ? (
            <div className="bg-stone-50 rounded-[40px] border-2 border-dashed border-stone-200 h-full min-h-[500px] flex flex-col items-center justify-center text-stone-400 p-8 text-center">
              <Activity className="w-16 h-16 mb-4 opacity-10" />
              <p className="text-lg font-bold text-stone-500 uppercase tracking-tighter">Nta sesengura rirahari</p>
              <p className="text-sm mt-2 max-w-sm font-medium">Andika amakuru ibumoso kugira ngo ai.rw igufashe.</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
              <div className="bg-emerald-950 text-white rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full transform translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                <div className="relative z-10 space-y-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-400" /> Incamake
                    </h3>
                    <button onClick={handleCopy} className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all transform active:scale-95">
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="text-lg md:text-xl font-medium leading-relaxed">
                    <FormattedText text={result.summary} className="text-white" />
                  </div>
                </div>
              </div>

              {result.isFinancial && result.financials && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Yinjijwe', val: result.financials.revenue, icon: TrendingUp, color: 'emerald' },
                    { label: 'Yasohotse', val: result.financials.expense, icon: TrendingDown, color: 'rose' },
                    { label: 'Inyungu', val: result.financials.profit, icon: DollarSign, color: 'blue' }
                  ].map((card, i) => (
                    <div key={i} className={`bg-${card.color}-50 p-6 rounded-3xl border border-${card.color}-100 relative group`}>
                       <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform`}>
                          <card.icon className={`w-12 h-12 text-${card.color}-600`} />
                       </div>
                       <span className={`text-[10px] font-black uppercase tracking-widest text-${card.color}-600 mb-2 block`}>{card.label}</span>
                       <div className={`text-2xl font-black text-${card.color}-900 tracking-tighter`}>
                         {card.val.toLocaleString()} <span className="text-[10px] font-bold opacity-60 ml-1">{result.financials?.currency}</span>
                       </div>
                    </div>
                  ))}
                </div>
              )}

              {result.chartData && result.chartData.length > 0 && (
                <div className="bg-white rounded-[40px] p-10 shadow-sm border border-stone-100">
                  <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-emerald-600" /> Ishusho y'imibare
                  </h3>
                  <div className="flex items-end justify-around h-48 w-full gap-4 px-4 pb-2 border-b border-stone-100">
                      {result.chartData.map((data, idx) => {
                          const maxVal = Math.max(...result.chartData.map(d => Math.abs(d.value)), 1);
                          const heightPercent = (Math.abs(data.value) / maxVal) * 100;
                          return (
                          <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group">
                              <div className="text-[10px] font-black text-stone-900 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {data.value.toLocaleString()}
                              </div>
                              <div className={`w-full max-w-[40px] rounded-t-xl transition-all duration-1000 ${
                                  data.type === 'revenue' ? 'bg-emerald-500' : data.type === 'expense' ? 'bg-rose-400' : 'bg-blue-500'
                                  }`} style={{ height: `${Math.max(heightPercent, 5)}%` }}
                              ></div>
                              <div className="text-[9px] font-black text-stone-400 mt-2 uppercase text-center truncate w-full">{data.label}</div>
                          </div>
                          );
                      })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {[
                   { label: 'Imbogamizi', data: result.risks, icon: AlertTriangle, color: 'amber' },
                   { label: 'Inama', data: result.advice, icon: Lightbulb, color: 'emerald' }
                 ].map((box, i) => (
                   <div key={i} className="bg-white rounded-[40px] shadow-sm border border-stone-100 overflow-hidden">
                      <div className={`bg-${box.color}-50 px-8 py-4 border-b border-${box.color}-100 flex items-center gap-3`}>
                         <box.icon className={`w-5 h-5 text-${box.color}-600`} />
                         <h3 className="text-sm font-black text-stone-800 uppercase tracking-widest">{box.label}</h3>
                      </div>
                      <div className="p-8">
                          <ul className="space-y-4">
                            {box.data.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-50 text-sm text-stone-600 font-medium">
                                  <div className={`w-1.5 h-1.5 rounded-full mt-2 bg-${box.color}-500 shrink-0`}></div>
                                  {item}
                                </li>
                            ))}
                          </ul>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
