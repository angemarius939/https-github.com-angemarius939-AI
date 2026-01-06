
import React, { useEffect } from 'react';
import { 
  Sparkles, MessageSquare, Image as ImageIcon, Sprout, 
  TrendingUp, GraduationCap, AudioLines, FileText, 
  ArrowRight, BrainCircuit, ShieldCheck, Zap, Globe, ChevronDown, Target, Mountain
} from 'lucide-react';
import { AppView } from '../types';
import { Button } from './Button';

interface LandingPageProps {
  onStart: (view: AppView) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  // Simple scroll behavior for "Explore" button
  const scrollToTools = () => {
    const toolsSection = document.getElementById('serivisi-section');
    toolsSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const tools = [
    { 
      id: AppView.CHAT, 
      label: 'Ikiganiro (AI Chat)', 
      desc: 'Baza ikibazo icyo ari cyo cyose mu Kinyarwanda, AI isubize mu buryo bwimbitse.', 
      icon: MessageSquare, 
      color: 'bg-emerald-600',
      lightColor: 'bg-emerald-50' 
    },
    { 
      id: AppView.TEXT_TOOLS, 
      label: 'Umwandiko (Text)', 
      desc: 'Kora incamake z\'inyandiko, hindura indimi, cyangwa ukosore imyandikire yawe.', 
      icon: FileText, 
      color: 'bg-teal-600',
      lightColor: 'bg-teal-50' 
    },
    { 
      id: AppView.IMAGE_TOOLS, 
      label: 'Amafoto & Ishusho', 
      desc: 'Sesengura amafoto, vumbura ibiyagize, cyangwa uhange amafoto mashya.', 
      icon: ImageIcon, 
      color: 'bg-blue-600',
      lightColor: 'bg-blue-50' 
    },
    { 
      id: AppView.RURAL_SUPPORT, 
      label: 'Iterambere (Rural)', 
      desc: 'Ubufasha bwihariye ku bahinzi, aborozi n\'abakora ubucuruzi buciriritse.', 
      icon: Sprout, 
      color: 'bg-green-600',
      lightColor: 'bg-green-50' 
    },
    { 
      id: AppView.DECISION_ASSISTANT, 
      label: 'Umujyanama', 
      desc: 'Isesengurwa ry\'imibare, inyungu n\'ibishushanyo mbonera by\'imishinga.', 
      icon: TrendingUp, 
      color: 'bg-amber-600',
      lightColor: 'bg-amber-50' 
    },
    { 
      id: AppView.COURSE_GENERATOR, 
      label: 'Amasomo', 
      desc: 'Tegura imfashanyigisho n\'amasomo arambuye ku ntego wihaye.', 
      icon: GraduationCap, 
      color: 'bg-indigo-600',
      lightColor: 'bg-indigo-50' 
    },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white selection:bg-emerald-100 selection:text-emerald-900 font-sans">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-[60] bg-white/80 backdrop-blur-xl border-b border-emerald-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="relative w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20 group-hover:scale-110 transition-transform">
              <Mountain className="w-6 h-6 text-white" />
              <Sparkles className="w-3 h-3 text-emerald-200 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="text-xl font-black text-emerald-950 tracking-tighter uppercase">ai.rw</span>
          </div>
          <div className="flex items-center gap-4 md:gap-8">
             <div className="hidden md:flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-stone-400">
                <button onClick={scrollToTools} className="hover:text-emerald-600 transition-colors">Serivisi</button>
                <button onClick={() => document.getElementById('vision-section')?.scrollIntoView({behavior: 'smooth'})} className="hover:text-emerald-600 transition-colors">Intego</button>
             </div>
             <Button onClick={() => onStart(AppView.CHAT)} variant="primary" className="px-5 py-2 rounded-full text-[10px] shadow-lg shadow-emerald-600/20">Tangira ubu</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 rwanda-pattern-light opacity-30 pointer-events-none z-0"></div>
        <div className="absolute top-1/4 -right-20 w-[500px] h-[500px] bg-emerald-100/50 rounded-full blur-[120px] opacity-40 animate-pulse z-0"></div>
        <div className="absolute bottom-1/4 -left-20 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[120px] opacity-40 animate-pulse delay-1000 z-0"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center space-y-8 md:space-y-12">
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-[0.25em] border border-emerald-100 animate-in slide-in-from-top-8 duration-1000">
            <Globe className="w-4 h-4" />
            Ikoranabuhanga rya AI mu Kinyarwanda
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-emerald-950 tracking-tighter leading-[0.85] animate-in fade-in zoom-in-95 duration-1000 delay-200">
            AI yacu,<br />
            <span className="text-emerald-500 relative inline-block">
              Rurimi
              <span className="absolute -bottom-2 left-0 w-full h-2 md:h-4 bg-emerald-100 -z-10 rounded-full opacity-50"></span>
            </span> rwacu.
          </h1>
          
          <p className="text-lg md:text-2xl text-stone-600 max-w-2xl mx-auto leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-400">
            Ikoranabuhanga rigezweho ryubakiye ku muco n'ururimi rw'Ikinyarwanda, rifasha mu buhinzi, ubucuruzi, n'iterambere ry'abaturage.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-600">
            <button 
              onClick={() => onStart(AppView.CHAT)}
              className="group relative w-full sm:w-auto px-12 py-6 bg-emerald-600 text-white rounded-[32px] text-xl font-black shadow-2xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-4"
            >
              Tangira ubu <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>
            <div className="flex items-center gap-8 text-stone-400 text-[10px] font-black uppercase tracking-widest">
               <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Byizewe</div>
               <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Birihuta</div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <button 
          onClick={scrollToTools}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity"
        >
           <span className="text-[10px] font-black uppercase tracking-widest text-emerald-950">Serivisi</span>
           <div className="w-6 h-10 border-2 border-emerald-950 rounded-full flex items-start justify-center p-1">
              <div className="w-1.5 h-1.5 bg-emerald-950 rounded-full mt-1"></div>
           </div>
        </button>
      </section>

      {/* Tools Section */}
      <section id="serivisi-section" className="py-24 md:py-40 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 md:mb-24 gap-8">
           <div className="max-w-xl text-center md:text-left">
             <div className="text-emerald-500 text-xs font-black uppercase tracking-[0.3em] mb-4">Ibikoresho</div>
             <h2 className="text-4xl md:text-6xl font-black text-emerald-950 uppercase tracking-tighter leading-none mb-6">Hitamo Icyo Ukeneye</h2>
             <p className="text-stone-500 text-lg md:text-xl font-medium">Buri gice cyateguwe mu buryo bwihariye kugira ngo kigufashe mu kazi kawe ka buri munsi.</p>
           </div>
           <div className="hidden md:block bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 shadow-inner">
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.3em]">ai.rw v2.1 Platform</span>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onStart(tool.id)}
              className="group text-left p-10 md:p-12 rounded-[64px] bg-white border border-stone-100 shadow-sm hover:shadow-2xl hover:shadow-emerald-900/5 hover:-translate-y-4 hover:border-emerald-200 transition-all duration-500 relative overflow-hidden"
            >
              {/* Tool Background Glow */}
              <div className={`absolute top-0 right-0 p-40 ${tool.lightColor} opacity-0 group-hover:opacity-60 rounded-full transform translate-x-20 -translate-y-20 blur-3xl transition-opacity duration-700`}></div>
              
              <div className={`relative z-10 w-20 h-20 ${tool.color} rounded-[28px] flex items-center justify-center text-white mb-10 shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                <tool.icon className="w-10 h-10" />
              </div>
              
              <div className="relative z-10">
                <h3 className="text-2xl font-black text-emerald-950 mb-4 group-hover:text-emerald-700 transition-colors">{tool.label}</h3>
                <p className="text-stone-500 text-lg leading-relaxed mb-10 font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                  {tool.desc}
                </p>
                
                <div className="flex items-center text-emerald-600 text-[10px] font-black uppercase tracking-[0.25em] opacity-0 group-hover:opacity-100 transform translate-y-6 group-hover:translate-y-0 transition-all duration-500">
                  Gukoresha <ArrowRight className="ml-2 w-5 h-5" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Vision/Footer Area */}
      <section id="vision-section" className="py-40 bg-emerald-950 text-white rounded-t-[80px] md:rounded-t-[120px] relative overflow-hidden">
         <div className="absolute inset-0 rwanda-pattern opacity-10 pointer-events-none"></div>
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-emerald-950/80 to-emerald-900/95 pointer-events-none"></div>
         
         <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-20">
            <div className="w-32 h-32 bg-emerald-500 rounded-[40px] flex items-center justify-center mx-auto shadow-2xl rotate-12 hover:rotate-0 transition-transform duration-700 group cursor-pointer">
               <Target className="w-16 h-16 text-emerald-950 group-hover:scale-110 transition-transform" />
            </div>
            
            <div className="space-y-8">
              <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-none uppercase">Intego ya ai.rw</h2>
              <p className="text-emerald-100/80 text-xl md:text-3xl leading-relaxed max-w-3xl mx-auto font-medium">
                 Turi hano kugira ngo duhe abanyarwanda bose amahirwe angana yo gukoresha ikoranabuhanga rya AI binyuze mu rurimi rwabo rwa kavukire, mu rwego rwo kwihutisha iterambere ry'abaturage.
              </p>
            </div>

            <div className="flex flex-col items-center gap-12">
               <Button 
                onClick={() => onStart(AppView.CHAT)}
                variant="primary" 
                className="bg-white text-emerald-950 hover:bg-emerald-50 px-12 py-5 rounded-full text-lg shadow-2xl"
               >
                 Tanga igitekerezo cyangwa ubaze
               </Button>
               
               <div className="grid grid-cols-1 md:grid-cols-3 w-full gap-8 md:gap-16 pt-20 border-t border-emerald-900/50 text-center text-[10px] font-black uppercase tracking-[0.3em] opacity-30">
                  <div className="flex flex-col gap-2">
                     <span className="text-emerald-400">Tekiniki</span>
                     <span>Research Analytics Ltd</span>
                  </div>
                  <div className="flex flex-col gap-2">
                     <span className="text-emerald-400">Icyerekezo</span>
                     <span>Vision 2050 Rwanda</span>
                  </div>
                  <div className="flex flex-col gap-2">
                     <span className="text-emerald-400">Imyaka</span>
                     <span>Established 2026</span>
                  </div>
               </div>
            </div>
            
            <div className="pt-20 flex flex-col items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-[10px] text-emerald-500/80 font-black uppercase tracking-widest">Live in Kigali, Rwanda</p>
              </div>
              <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] font-black">&copy; 2026 ai.rw &bull; Uburenganzira bwose ni ubwacu.</p>
            </div>
         </div>
      </section>
    </div>
  );
};
