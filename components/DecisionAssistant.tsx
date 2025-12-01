import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Lightbulb, BarChart3, PieChart, ArrowRight, Loader2 } from 'lucide-react';
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
  const { showToast } = useToast();

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setResult(null);
    try {
      const data = await generateBusinessAnalysis(input);
      setResult(data);
      showToast('Isesengura ryarangiye!', 'success');
    } catch (error: any) {
      showToast('Habaye ikibazo.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fillExample = (type: 'retail' | 'farm' | 'livestock') => {
    let text = "";
    if (type === 'retail') {
      text = "Uyu munsi ncuruje ibicuruzwa by'ibihumbi 50,000 RWF. Naguze inyongera y'ibicuruzwa by'ibihumbi 30,000 RWF. Nishyuye umuriro 5,000 RWF. Ndashaka kumenya inyungu yanjye n'inama z'uko nakongera abakiriya.";
    } else if (type === 'farm') {
      text = "Nasaruye ibigori ibiro 200, buri kiro nakigurishije 500 RWF. Nashoye imbuto n'ifumbire by'ibihumbi 40,000 RWF. Abakozi nabahaye 15,000 RWF. Ese mpagaze ute mu buhinzi bwanjye?";
    } else {
      text = "Ngurishije amata litiro 50 kuri 400 RWF litiro imwe. Nguze ubwatsi bw'ibihumbi 10,000 RWF n'imiti y'ibihumbi 5,000 RWF. Inka imwe irarwaye. Mungire inama.";
    }
    setInput(text);
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto w-full p-4 md:p-8 space-y-8 overflow-y-auto">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-emerald-900 flex items-center justify-center gap-3">
          <TrendingUp className="w-8 h-8 text-emerald-600" />
          Umujyanama
        </h2>
        <p className="text-emerald-700 mt-2 max-w-2xl mx-auto">
          Umufasha mu gufata ibyemezo by'ubucuruzi, ubuhinzi, n'ubworozi. 
          Andika ibyo wakoze, tubiguhemo imibare n'inama.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Input */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
            <h3 className="font-semibold text-emerald-900 mb-4">Andika Ibikorwa byawe</h3>
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Urugero: Uyu munsi nagurishije..."
              className="w-full h-48 p-4 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 resize-none text-stone-800 text-sm leading-relaxed mb-4"
            />
            
            <Button 
              onClick={handleAnalyze} 
              isLoading={isLoading} 
              disabled={!input.trim()}
              className="w-full"
            >
              Sesengura
            </Button>
            
            <ProgressBar isLoading={isLoading} label="Irimo gusesengura imari..." duration={4000} />

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
                  onClick={() => fillExample('livestock')}
                  className="text-left text-xs p-2 rounded-lg bg-stone-50 hover:bg-emerald-50 text-stone-600 hover:text-emerald-700 transition-colors border border-stone-100 hover:border-emerald-200"
                >
                  🐄 Ubworozi (Livestock)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Output */}
        <div className="lg:col-span-2 space-y-6">
          {!result ? (
            <div className="bg-stone-50 rounded-2xl border border-stone-200 border-dashed h-full min-h-[400px] flex flex-col items-center justify-center text-stone-400 p-8 text-center">
              <BarChart3 className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium text-stone-500">Nta sesengura rirahari</p>
              <p className="text-sm mt-2 max-w-sm">
                Andika amakuru ibumoso ukande "Sesengura" kugira ngo ubone raporo y'imari n'inama.
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Summary Card */}
              <div className="bg-emerald-900 text-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bold mb-2 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />
                  Incamake
                </h3>
                <div className="text-emerald-100 leading-relaxed">
                  <FormattedText text={result.summary} className="text-emerald-100" />
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-sm font-medium text-stone-500">Yinjijwe</span>
                     <TrendingUp className="w-4 h-4 text-emerald-500" />
                   </div>
                   <div className="text-2xl font-bold text-emerald-700">
                     {result.financials.revenue.toLocaleString()} <span className="text-sm font-normal text-stone-500">{result.financials.currency}</span>
                   </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-sm font-medium text-stone-500">Yasohotse</span>
                     <TrendingDown className="w-4 h-4 text-red-500" />
                   </div>
                   <div className="text-2xl font-bold text-red-700">
                     {result.financials.expense.toLocaleString()} <span className="text-sm font-normal text-stone-500">{result.financials.currency}</span>
                   </div>
                </div>

                <div className={`p-4 rounded-xl shadow-sm border ${result.financials.profit >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                   <div className="flex items-center justify-between mb-2">
                     <span className={`text-sm font-medium ${result.financials.profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>Inyungu / Igihombo</span>
                     <DollarSign className={`w-4 h-4 ${result.financials.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                   </div>
                   <div className={`text-2xl font-bold ${result.financials.profit >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
                     {result.financials.profit.toLocaleString()} <span className={`text-sm font-normal ${result.financials.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{result.financials.currency}</span>
                   </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
                <h3 className="font-bold text-stone-800 mb-6 flex items-center">
                   <BarChart3 className="w-5 h-5 mr-2 text-emerald-600" />
                   Imbonerahamwe y'Imari
                </h3>
                
                <div className="flex items-end justify-around h-48 w-full gap-4 px-4 pb-2 border-b border-stone-200">
                   {result.chartData.map((data, idx) => {
                     // Normalize height based on max value roughly
                     const maxVal = Math.max(...result.chartData.map(d => d.value));
                     const heightPercent = maxVal > 0 ? (data.value / maxVal) * 100 : 0;
                     
                     return (
                       <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group">
                          <div className="text-xs font-bold text-stone-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {data.value.toLocaleString()}
                          </div>
                          <div 
                            className={`w-full max-w-[60px] rounded-t-lg transition-all duration-1000 ease-out hover:opacity-90 ${
                              data.type === 'revenue' ? 'bg-emerald-500' : 
                              data.type === 'expense' ? 'bg-red-400' : 
                              'bg-blue-500'
                            }`}
                            style={{ height: `${Math.max(heightPercent, 5)}%` }}
                          ></div>
                          <div className="text-xs font-medium text-stone-500 mt-2 text-center truncate w-full">
                            {data.label}
                          </div>
                       </div>
                     );
                   })}
                </div>
                <div className="flex justify-center gap-4 mt-4 text-xs text-stone-500">
                  <div className="flex items-center"><div className="w-3 h-3 bg-emerald-500 rounded mr-1"></div> Yinjijwe</div>
                  <div className="flex items-center"><div className="w-3 h-3 bg-red-400 rounded mr-1"></div> Yasohotse</div>
                  <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 rounded mr-1"></div> Inyungu</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Risks */}
                 <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-l-amber-400 border border-stone-100">
                    <h3 className="font-bold text-stone-800 mb-4 flex items-center">
                       <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" />
                       Imbogamizi & Ibyago
                    </h3>
                    <ul className="space-y-3">
                      {result.risks.map((risk, idx) => (
                        <li key={idx} className="flex items-start text-sm text-stone-600">
                          <span className="text-amber-500 mr-2 mt-0.5">•</span>
                          {risk}
                        </li>
                      ))}
                      {result.risks.length === 0 && <li className="text-sm text-stone-400 italic">Nta mbogamizi zigaragara zabonetse.</li>}
                    </ul>
                 </div>

                 {/* Advice */}
                 <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-l-emerald-500 border border-stone-100">
                    <h3 className="font-bold text-stone-800 mb-4 flex items-center">
                       <Lightbulb className="w-5 h-5 mr-2 text-emerald-500" />
                       Inama z'Umujyanama
                    </h3>
                    <ul className="space-y-3">
                      {result.advice.map((tip, idx) => (
                        <li key={idx} className="flex items-start text-sm text-stone-600">
                          <ArrowRight className="w-4 h-4 text-emerald-500 mr-2 mt-0.5 shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                 </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};