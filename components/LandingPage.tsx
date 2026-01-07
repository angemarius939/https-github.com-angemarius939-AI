
import React, { useEffect, useState } from 'react';
import { 
  Sparkles, MessageSquare, Sprout, 
  TrendingUp, GraduationCap, FileText, 
  ArrowRight, Globe, Users, ShieldCheck, 
  Cpu, Heart
} from 'lucide-react';
import { AppView } from '../types';
import { Button } from './Button';
import { Logo } from './Logo';
import { getVisitStats } from '../services/statsService';

interface LandingPageProps {
  onStart: (view: AppView) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [totalVisits, setTotalVisits] = useState(0);

  useEffect(() => {
    // Load live stats for the landing page social proof
    const stats = getVisitStats();
    const total = stats.reduce((acc, curr) => acc + curr.count, 0);
    setTotalVisits(total > 0 ? total : 1240); // Fallback to a base number if local stats empty
  }, []);

  const scrollToTools = () => {
    const toolsSection = document.getElementById('serivisi-section');
    toolsSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const tools = [
    { id: AppView.CHAT, label: 'Ikiganiro (AI Chat)', desc: 'Baza ikibazo icyo ari cyo cyose mu Kinyarwanda, AI isubize mu buryo bwimbitse.', icon: MessageSquare, color: 'bg-emerald-600' },
    { id: AppView.TEXT_TOOLS, label: 'Umwandiko (Text)', desc: 'Kora incamake, hindura indimi, cyangwa ukosore imyandikire yawe.', icon: FileText, color: 'bg-teal-600' },
    { id: AppView.RURAL_SUPPORT, label: 'Iterambere (Rural)', desc: 'Ubufasha bwihariye ku bahinzi, aborozi n\'abakora ubucuruzi buciriritse.', icon: Sprout, color: 'bg-green-600' },
    { id: AppView.DECISION_ASSISTANT, label: 'Umujyanama', desc: 'Isesengurwa ry\'imibare, inyungu n\'ibishushanyo mbonera by\'imishinga.', icon: TrendingUp, color: 'bg-amber-600' },
    { id: AppView.COURSE_GENERATOR, label: 'Amasomo', desc: 'Tegura imfashanyigisho n\'amasomo arambuye ku ntego wihaye.', icon: GraduationCap, color: 'bg-indigo-600' },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white selection:bg-emerald-100 selection:text-emerald-900 font-sans animate-in fade-in duration-700">
      {/* Header Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[60] bg-white/80 backdrop-blur-xl border-b border-emerald-50 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <Logo size="sm" />
            <span className="text-xl font-black text-emerald-950 tracking-tighter uppercase">ai.rw</span>
          </div>
          <div className="flex items-center gap-4 md:gap-8">
             <div className="hidden md:flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-stone-400">
                <button onClick={scrollToTools} className="hover:text-emerald-600 transition-colors">Serivisi</button>
                <button onClick={() => document.getElementById('vision-section')?.scrollIntoView({behavior: 'smooth'})} className="hover:text-emerald-600 transition-colors">Intego</button>
             </div>
             <Button onClick={() => onStart(AppView.CHAT)} variant="primary" className="px-6 py-2.5 rounded-full text-[10px] shadow-lg shadow-emerald-600/20 uppercase font-black tracking-widest">Tangira ubu</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden pt-20">
        <div className="absolute inset-0 rwanda-pattern-light opacity-30 pointer-events-none z-0"></div>
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-emerald-100 rounded-full blur-[100px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-blue-100 rounded-full blur-[100px] opacity-40 animate-pulse delay-700"></div>

        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center space-y-8 md:space-y-12">
          <div className="flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-[0.25em] border border-emerald-100 animate-in slide-in-from-top-8 duration-1000">
              <Globe className="w-4 h-4" />
              Ikoranabuhanga rya AI mu Kinyarwanda
            </div>
            
            {/* Live Stats Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-stone-100 shadow-sm rounded-full text-[9px] font-bold text-stone-500 uppercase tracking-widest animate-in fade-in duration-1000 delay-500">
              <Users className="w-3 h-3 text-emerald-500" />
              Abasuye: <span className="text-emerald-600">{totalVisits.toLocaleString()}</span>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-emerald-950 tracking-tighter leading-[0.85] animate-in fade-in duration-1000 delay-200">
            AI yacu,<br />
            <span className="text-emerald-500 relative inline-block">
              Mu rurimi
              <span className="absolute -bottom-2 left-0 w-full h-2 md:h-4 bg-emerald-100 -z-10 rounded-full opacity-50"></span>
            </span> rwacu.
          </h1>
          
          <p className="text-lg md:text-2xl text-stone-600 max-w-2xl mx-auto leading-relaxed font-medium animate-in fade-in duration-1000 delay-400">
            Ikoranabuhanga rigezweho ryubakiye ku muco n'ururimi rw'Ikinyarwanda, rifasha mu buhinzi, ubucuruzi, n'iterambere ry'abaturage bose.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6 animate-in fade-in duration-1000 delay-600">
            <button 
              onClick={() => onStart(AppView.CHAT)}
              className="group relative w-full sm:w-auto px-12 py-6 bg-emerald-600 text-white rounded-[32px] text-xl font-black shadow-2xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-4"
            >
              Tangira ubu <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>
            <button 
              onClick={scrollToTools}
              className="px-10 py-6 bg-white text-emerald-900 border-2 border-emerald-100 rounded-[32px] text-lg font-bold hover:bg-emerald-50 transition-all shadow-sm"
            >
              Reba ibishya
            </button>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="serivisi-section" className="py-32 px-6 max-w-7xl mx-auto bg-slate-50/30 rounded-[64px] my-10 border border-slate-100 shadow-inner">
        <div className="text-center mb-20 space-y-4">
           <div className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.4em] mb-4">Ibyo tugukorera</div>
           <h2 className="text-4xl md:text-5xl font-black text-emerald-950 uppercase tracking-tighter">Serivisi zacu</h2>
           <p className="text-stone-500 font-medium max-w-lg mx-auto leading-relaxed">Hitamo icyo wifuza ko ai.rw igufasha uyu munsi, byose bikorwa mu rurimi rw'Ikinyarwanda.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => onStart(tool.id)}
                className="group text-left p-12 rounded-[56px] bg-white border border-stone-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative overflow-hidden"
              >
                <div className={`relative z-10 w-20 h-20 ${tool.color} rounded-3xl flex items-center justify-center text-white mb-10 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all`}>
                  <Icon className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-emerald-950 mb-4 tracking-tight">{tool.label}</h3>
                <p className="text-stone-500 leading-relaxed font-medium opacity-80 group-hover:opacity-100">{tool.desc}</p>
                <div className="mt-10 flex items-center text-emerald-600 font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                  Fungura ubu <ArrowRight className="ml-2 w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Trust & Values */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black text-emerald-950 uppercase tracking-tighter">Umutekano</h4>
            <p className="text-stone-500 text-sm">Amakuru yawe abikwa mu buryo bwizewe kandi bwubaha uburenganzira bwawe.</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
              <Cpu className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black text-emerald-950 uppercase tracking-tighter">Ikoranabuhanga</h4>
            <p className="text-stone-500 text-sm">Tukoresha uburyo bwa "Gemini AI" bugezweho kurusha ubundi ku isi.</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-600">
              <Heart className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black text-emerald-950 uppercase tracking-tighter">Umuco Nyarwanda</h4>
            <p className="text-stone-500 text-sm">Iyi AI yitoje amateka, imvugo, n'umuco w'u Rwanda kugira ngo igufashe neza.</p>
          </div>
        </div>
      </section>

      {/* Vision / Footer Section */}
      <section id="vision-section" className="py-48 bg-emerald-950 text-white rounded-t-[100px] relative overflow-hidden">
         <div className="absolute inset-0 rwanda-pattern opacity-10 pointer-events-none"></div>
         <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
         
         <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-20">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl transform hover:rotate-12 transition-transform">
                <Logo size="lg" variant="light" />
              </div>
            </div>
            <div className="space-y-10">
              <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-none uppercase">Intego ya ai.rw</h2>
              <p className="text-emerald-100/80 text-xl md:text-3xl leading-relaxed max-w-4xl mx-auto font-medium">
                 Turi hano kugira ngo duhe abanyarwanda bose amahirwe angana yo gukoresha ikoranabuhanga rya AI binyuze mu rurimi rwabo rwa kavukire, mu buryo bworoshye kandi bwizewe.
              </p>
            </div>
            <div className="pt-24 border-t border-white/5">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] font-black">&copy; 2026 ai.rw &bull; Uburenganzira bwose ni ubwacu.</p>
                <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-emerald-500/50">
                   <button className="hover:text-white transition-colors">Amategeko</button>
                   <button className="hover:text-white transition-colors">Ibijyanye natwe</button>
                   <button className="hover:text-white transition-colors">Twandikire</button>
                </div>
              </div>
            </div>
         </div>
      </section>
    </div>
  );
};
