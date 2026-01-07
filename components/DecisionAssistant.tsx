
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
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setResult(null);
    setCopied(false);
    try {
      const data = await generateBusinessAnalysis(input);
      if (!data || typeof data !== 'object') {
        throw new Error("Invalid response format");
      }
      
      // Safety checks for required fields
      const summary = data.summary || "Nta ncamake yabonetse.";
      const risks = Array.isArray(data.risks) ? data.risks : [];
      const advice = Array.isArray(data.advice) ? data.advice : [];
      const chartData = Array.isArray(data.chartData) ? data.chartData : [];

      // Ensure financials are numbers if they exist
      let financials = undefined;
      if (data.isFinancial && data.financials) {
        financials = {
          revenue: Number(data.financials.revenue) || 0,
          expense: Number(data.financials.expense) || 0,
          profit: Number(data.financials.profit) || 0,
          currency: data.financials.currency || 'RWF'
        };
      }

      setResult({
        ...data,
        summary,
        risks,
        advice,
        chartData,
        financials
      });
      showToast('Isesengura ryarangiye!', 'success');
    } catch (error: any) {
      console.error("UI Analysis Error:", error);
      showToast(error.message || 'Habaye ikibazo mu gusesengura amakuru.', 'error');
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

  const fillExample = (type: 'retail' | 'farm' | 'livestock' | 'monthly' | 'complex' | 'generic') => {
    let text = "";
    if (type === 'retail') {
      text = "Uyu munsi ncuruje ibicuruzwa by'ibihumbi 50,000 RWF. Naguze inyongera y'ibicuruzwa by'ibihumbi 30,000 RWF. Nishyuye umuriro 5,000 RWF. Ndashaka kumenya inyungu yanjye n'inama z'uko nakongera abakiriya.";
    } else if (type === 'farm') {
      text = "Nasaruye ibigori ibiro 200, buri kiro nakigurishije 500 RWF. Nashoye imbuto n'ifumbire by'ibihumbi 40,000 RWF. Abakozi nabahaye 15,000 RWF. Ese mpagaze ute mu buhinzi bwanjye?";
    } else if (type === 'livestock') {
      text = "Ngurishije amata litiro 50 kuri 400 RWF litiro imwe. Nguze ubwatsi bw'ibihumbi 10,000 RWF n'imiti y'ibihumbi 5,000 RWF. Inka imwe irarwaye. Mungire inama.";
    } else if (type === 'monthly') {
      text = "Muri uku kwezi gushize, twinjije miliyoni 5 z'amafaranga y'u Rwanda mu bucuruzi bw'ibikoresho by'ubwubatsi. Twishyuye abakozi ibihumbi 800, umuriro n'amazi ibihumbi 100, n'imisoro ya RRA ibihumbi 200. Twaguze stock nshya ya miliyoni 3. Nyamuneka dukorere isesengura ry'ukwezi kandi utungire inama z'uburyo twagabanya amafaranga asohoka umwaka utaha.";
    } else if (type === 'complex') {
      text = "Dufite imishinga ibiri: Ubuhinzi n'Ubwikorezi. \n1. Ubuhinzi: Twagurishije toni 5 z'ibirayi kuri 300Frw/kg. Ifumbire yatwaye 500,000 Frw.\n2. Ubwikorezi: Moto yinjije 150,000 Frw, essence yatwaye 40,000 Frw, panne yatwaye 20,000 Frw.\nEse muri rusange twungutse angahe? Ni uwuhe mushinga uduha inyungu nyinshi? Ni izihe ngamba twafata?";
    } else if (type === 'generic') {
      text = "Mu ishuri ryisumbuye rya Kigali, abanyeshuri 50 bakoze ikizamini cy'imibare. 20 babonye hejuru ya 80%, 15 babonye hagati ya 50-79%, naho 15 babonye munsi ya 50%. Mu cyongereza ho, 40 babonye hejuru ya 60%. Nyamuneka dukorere raporoigaragaza uko batsinze, ushyiremo imbonerahamwe (table) n'inama z'uko twazamura ireme ry'uburezi.";
    }
    setInput(text);
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto w-full p-4 md:p-8 space-y-8 overflow-y-auto">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-emerald-900 flex items-center justify-center gap-3">
          <Microscope className="w-8 h-8 text-emerald-600" />
          Umujyanama
        </h2>
        <p className="text-emerald-700 mt-2 max-w-2xl mx-auto">
          Umufasha mu gusesengura amakuru yose (Ubucuruzi, Uburezi, Imibare, n'ibindi). 
          Andika ibyo ufite tubiguhemo imibare, ibishushanyo, na raporo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
            <h3 className="font-semibold text-emerald-900 mb-4">Andika Amakuru (Data)</h3>
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Urugero: Uyu munsi nagurishije... Cyangwa: Abanyeshuri batsinze..."
              className="w-full h-64 p-5 border-2 border-emerald-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none resize-none text-stone-800 text-lg leading-relaxed mb-4 bg-slate-50/50"
            />
            
            <Button 
              onClick={handleAnalyze} 
              isLoading={isLoading} 
              disabled={!input.trim()}
              className="w-full h-14 text-lg font-bold"
            >
              Sesengura
            </Button>
            
            <ProgressBar isLoading={isLoading} label="Irimo gusesengura..." duration={4000} />

            <div className="mt-6 pt-6 border-t border-emerald-50">
              <p className="text-xs font-semibold text-emerald-600 uppercase mb-3">Gerageza Urugero:</p>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => fillExample('retail')}
                  className="text-left text-xs p-2 rounded-lg bg-stone-50 hover:bg-emerald-50 text-stone-600 hover:text-emerald-700 transition-colors border border-stone-100 hover:border-emerald-200"
                >
                  🏪 Ubucuruzi (Retail)
                </button>
                <button 
                  onClick={() => fillExample('farm')}
                  className="text-left text-xs p-2 rounded-lg bg-stone-50 hover:bg-emerald-50 text-stone-600 hover:text-emerald-700 transition-colors border border-stone-100 hover:border-emerald-200"
                >
                  🌽 Ubuhinzi (Agriculture)
                </button>
                <button 
                  onClick={() => fillExample('monthly')}
                  className="text-left text-xs p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 transition-colors border border-blue-100 hover:border-blue-200 font-medium"
                >
                  📅 Raporo y'Ukwezi (Monthly)
                </button>
                <button 
                  onClick={() => fillExample('generic')}
                  className="text-left text-xs p-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 hover:text-teal-800 transition-colors border border-teal-100 hover:border-teal-200 font-medium"
                >
                  📊 Raporo Rusange (Generic)
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {!result ? (
            <div className="bg-stone-50 rounded-2xl border border-stone-200 border-dashed h-full min-h-[400px] flex flex-col items-center justify-center text-stone-400 p-8 text-center" style={{ minHeight: '600px' }}>
              <Microscope className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium text-stone-500">Nta sesengura rirahari</p>
              <p className="text-sm mt-2 max-w-sm">
                Andika amakuru ibumoso ukande "Sesengura" kugira ngo ubone raporo n'imbonerahamwe.
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-emerald-900 text-white rounded-[32px] p-8 md:p-10 shadow-2xl relative group border border-emerald-800 overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-white opacity-[0.03] rounded-full transform translate-x-10 -translate-y-10 blur-3xl"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black flex items-center uppercase tracking-wider">
                      <Lightbulb className="w-6 h-6 mr-3 text-yellow-400" />
                      Incamake
                    </h3>
                    <button 
                      onClick={handleCopy}
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all transform active:scale-95"
                      title="Koporora"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="text-white text-lg md:text-xl font-medium">
                    <FormattedText text={result.summary} className="text-white" />
                  </div>
                </div>
              </div>

              {result.isFinancial && result.financials ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                     <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform">
                        <Wallet className="w-16 h-16 text-emerald-600" />
                     </div>
                     <div className="flex flex-col relative z-10">
                       <span className="text-sm font-medium text-emerald-600 mb-1 flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" /> Yinjijwe
                       </span>
                       <div className="text-2xl font-extrabold text-emerald-800 tracking-tight">
                         {result.financials.revenue.toLocaleString()} 
                         <span className="text-xs font-medium text-emerald-600 ml-1">{result.financials.currency}</span>
                       </div>
                     </div>
                  </div>
                  
                  <div className="bg-rose-50 p-5 rounded-2xl border border-rose-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                     <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform">
                        <Briefcase className="w-16 h-16 text-rose-600" />
                     </div>
                     <div className="flex flex-col relative z-10">
                       <span className="text-sm font-medium text-rose-600 mb-1 flex items-center gap-1">
                          <TrendingDown className="w-4 h-4" /> Yasohotse
                       </span>
                       <div className="text-2xl font-extrabold text-rose-800 tracking-tight">
                         {result.financials.expense.toLocaleString()} 
                         <span className="text-xs font-medium text-rose-600 ml-1">{result.financials.currency}</span>
                       </div>
                     </div>
                  </div>

                  <div className={`p-5 rounded-2xl border relative overflow-hidden group hover:shadow-md transition-shadow ${result.financials.profit >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
                     <div className={`absolute top-0 right-0 p-4 opacity-10 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform`}>
                        <PiggyBank className={`w-16 h-16 ${result.financials.profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                     </div>
                     <div className="flex flex-col relative z-10">
                       <span className={`text-sm font-medium mb-1 flex items-center gap-1 ${result.financials.profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                          <DollarSign className="w-4 h-4" /> Inyungu
                       </span>
                       <div className={`text-2xl font-extrabold tracking-tight ${result.financials.profit >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                         {result.financials.profit.toLocaleString()} 
                         <span className={`text-xs font-medium ml-1 ${result.financials.profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{result.financials.currency}</span>
                       </div>
                     </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                   {result.kpiCards?.map((card, idx) => (
                     <div key={idx} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-5">
                           <Activity className="w-16 h-16 text-stone-800" />
                        </div>
                        <div className="relative z-10">
                           <span className="text-sm font-medium text-stone-500 mb-1 block">{card.label}</span>
                           <div className={`text-2xl font-extrabold tracking-tight ${
                             card.color === 'emerald' ? 'text-emerald-700' :
                             card.color === 'blue' ? 'text-blue-700' :
                             card.color === 'orange' ? 'text-orange-700' : 'text-stone-800'
                           }`}>
                             {card.value}
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
              )}

              {result.chartData && result.chartData.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-stone-800 flex items-center">
                          <Compass className="w-5 h-5 mr-2 text-emerald-600" />
                          Imbonerahamwe (Visuals)
                      </h3>
                      <div className="flex bg-stone-100 rounded-lg p-1">
                          <button 
                              onClick={() => setChartType('bar')}
                              className={`p-1.5 rounded-md transition-all ${chartType === 'bar' ? 'bg-white shadow text-emerald-700' : 'text-stone-500 hover:text-stone-700'}`}
                          >
                              <Activity className="w-4 h-4" />
                          </button>
                      </div>
                  </div>
                  
                  <div className="flex items-end justify-around h-48 w-full gap-4 px-4 pb-2 border-b border-stone-200 animate-in fade-in">
                      {result.chartData.map((data, idx) => {
                          const maxVal = Math.max(...result.chartData.map(d => Math.abs(d.value)), 1);
                          const heightPercent = maxVal > 0 ? (Math.abs(data.value) / maxVal) * 100 : 0;
                          
                          return (
                          <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group">
                              <div className="text-xs font-bold text-stone-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {data.value.toLocaleString()}
                              </div>
                              <div 
                                  className={`w-full max-w-[60px] rounded-t-lg transition-all duration-1000 ease-out hover:opacity-90 relative group-hover:scale-105 ${
                                  data.type === 'revenue' ? 'bg-emerald-500' : 
                                  data.type === 'expense' ? 'bg-rose-400' : 
                                  data.type === 'profit' ? 'bg-blue-500' :
                                  'bg-indigo-400'
                                  }`}
                                  style={{ height: `${Math.max(heightPercent, 2)}%` }}
                              ></div>
                              <div className="text-xs font-medium text-stone-500 mt-2 text-center truncate w-full" title={data.label}>
                                  {data.label}
                              </div>
                          </div>
                          );
                      })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                    <div className="bg-amber-50/50 px-6 py-4 border-b border-amber-100 flex items-center gap-2">
                       <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                         <AlertTriangle className="w-5 h-5" />
                       </div>
                       <h3 className="font-bold text-stone-800">Imbogamizi & Ibyago</h3>
                    </div>
                    <div className="p-6">
                        <ul className="space-y-3">
                        {result.risks.map((risk, idx) => (
                            <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 border border-stone-100 text-sm text-stone-600 hover:bg-amber-50/30 transition-colors">
                            <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                            {risk}
                            </li>
                        ))}
                        </ul>
                    </div>
                 </div>

                 <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                    <div className="bg-emerald-50/50 px-6 py-4 border-b border-emerald-100 flex items-center gap-2">
                       <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                         <Lightbulb className="w-5 h-5" />
                       </div>
                       <h3 className="font-bold text-stone-800">Inama & Ibisubizo</h3>
                    </div>
                    <div className="p-6">
                        <ul className="space-y-3">
                        {result.advice.map((tip, idx) => (
                            <li key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-stone-50 border border-stone-100 text-sm text-stone-600 hover:bg-emerald-50/30 transition-colors">
                            <ArrowRight className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                            {tip}
                            </li>
                        ))}
                        </ul>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
