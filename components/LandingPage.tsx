
import React from 'react';
import { 
  Sparkles, MessageSquare, Image as ImageIcon, Sprout, 
  TrendingUp, GraduationCap, FileText, 
  ArrowRight, ShieldCheck, Zap, Globe, Target
} from 'lucide-react';
import { AppView } from '../types';
import { Button } from './Button';
import { Logo } from './Logo';

interface LandingPageProps {
  onStart: (view: AppView) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const scrollToTools = () => {
    const toolsSection = document.getElementById('serivisi-section');
    toolsSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const tools = [
    { id: AppView.CHAT, label: 'Ikiganiro (AI Chat)', desc: 'Baza ikibazo icyo ari cyo cyose mu Kinyarwanda, AI isubize mu buryo bwimbitse.', icon: MessageSquare, color: 'bg-emerald-600', lightColor: 'bg-emerald-50' },
    { id: AppView.TEXT_TOOLS, label: 'Umwandiko (Text)', desc: 'Kora incamake z\'inyandiko, hindura indimi, cyangwa ukosore imyandikire yawe.', icon: FileText, color: 'bg-teal-600', lightColor: 'bg-teal-50' },
    { id: AppView.IMAGE_TOOLS, label: 'Amafoto & Ishusho', desc: 'Sesengura amafoto, vumbura ibiyagize, cyangwa uhange amafoto mashya.', icon: ImageIcon, color: 'bg-blue-600', lightColor: 'bg-blue-50' },
    { id: AppView.RURAL_SUPPORT, label: 'Iterambere (Rural)', desc: 'Ubufasha bwihariye ku bahinzi, aborozi n\'abakora ubucuruzi buciriritse.', icon: Sprout, color: 'bg-green-600', lightColor: 'bg-green-50' },
    { id: AppView.DECISION_ASSISTANT, label: 'Umujyanama', desc: 'Isesengurwa ry\'imibare, inyungu n\'ibishushanyo mbonera by\'imishinga.', icon: TrendingUp, color: 'bg-amber-600', lightColor: 'bg-amber-50' },
    { id: AppView.COURSE_GENERATOR, label: 'Amasomo', desc: 'Tegura imfashanyigisho n\'amasomo arambuye ku ntego wihaye.', icon: GraduationCap, color: 'bg-indigo-600', lightColor: 'bg-indigo-50' },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white selection:bg-emerald-100 selection:text-emerald-900 font-sans">
      <nav className="fixed top-0 left-0 right-0 z-[60] bg-white/80 backdrop-blur-xl border-b border-emerald-50 px-6 py-4">
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
             <Button onClick={() => onStart(AppView.CHAT)} variant="primary" className="px-5 py-2 rounded-full text-[10px] shadow-lg shadow-emerald-600/20">Tangira ubu</Button>
          </div>
        </div>
      </nav>

      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        <div className="absolute inset-0 rwanda-pattern-light opacity-30 pointer-events-none z-0"></div>
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center space-y-8 md:space-y-12">
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-[0.25em] border border-emerald-100 animate-in slide-in-from-top-8 duration-1000">
            <Globe className="w-4 h-4" />
            Ikoranabuhanga rya AI mu Kinyarwanda
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-emerald-950 tracking-tighter leading-[0.85] animate-in fade-in zoom-in-95 duration-1000 delay-200">
            AI yacu,<br />
            <span className="text-emerald-500 relative inline-block">
              Mu rurimi
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
          </div>
        </div>
      </section>

      <section id="serivisi-section" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onStart(tool.id)}
              className="group text-left p-10 rounded-[48px] bg-white border border-stone-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative overflow-hidden"
            >
              <div className={`relative z-10 w-16 h-16 ${tool.color} rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg group-hover:scale-110 transition-transform`}>
                <tool.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-emerald-950 mb-4">{tool.label}</h3>
              <p className="text-stone-500 leading-relaxed font-medium opacity-80 group-hover:opacity-100">{tool.desc}</p>
            </button>
          ))}
        </div>
      </section>

      <section id="vision-section" className="py-40 bg-emerald-950 text-white rounded-t-[80px] relative overflow-hidden">
         <div className="absolute inset-0 rwanda-pattern opacity-10 pointer-events-none"></div>
         <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-16">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <Logo size="lg" variant="light" />
              </div>
            </div>
            <div className="space-y-8">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none uppercase">Intego ya ai.rw</h2>
              <p className="text-emerald-100/80 text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto font-medium">
                 Turi hano kugira ngo duhe abanyarwanda bose amahirwe angana yo gukoresha ikoranabuhanga rya AI binyuze mu rurimi rwabo rwa kavukire.
              </p>
            </div>
            <div className="pt-20">
              <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] font-black">&copy; 2026 ai.rw &bull; Uburenganzira bwose ni ubwacu.</p>
            </div>
         </div>
      </section>
    </div>
  );
};
