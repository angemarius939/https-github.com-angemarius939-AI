
import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, BookOpen, Clock, ListChecks, Search, 
  History, Target, Layers, Book, BrainCircuit, 
  ArrowRight, Printer, Layout, FileText, Link, 
  ChevronRight, HelpCircle, Download, Lightbulb, 
  Bookmark, Copy, Check, Menu, X, Sparkles, Map,
  ChevronDown, BookMarked
} from 'lucide-react';
import { generateCourse } from '../services/geminiService';
import { Button } from './Button';
import { CourseLevel, Source } from '../types';
import { useToast } from './ToastProvider';
import { ProgressBar } from './ProgressBar';
import { FormattedText } from './FormattedText';
import { SourcesToggle } from './SourcesToggle';

const Sprout = (props: any) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 20h10" /><path d="M10 20V8a3 3 0 0 0-3-3 3 3 0 0 0-3 3v12" /><path d="M14 20V6a3 3 0 0 1 3-3 3 3 0 0 1 3 3v14" />
  </svg>
);

interface CourseHistoryItem {
  id: string;
  topic: string;
  level: string;
  duration: string;
  content: string;
  sources?: Source[];
  timestamp: number;
}

interface ParsedSection {
  title: string;
  content: string;
  id: string;
  theme: 'emerald' | 'blue' | 'amber' | 'indigo' | 'violet' | 'rose';
}

export const CourseGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<CourseLevel>('beginner');
  const [duration, setDuration] = useState('');
  const [prerequisites, setPrerequisites] = useState('');
  const [courseContent, setCourseContent] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedSections, setParsedSections] = useState<ParsedSection[]>([]);
  const [activeSection, setActiveSection] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const [history, setHistory] = useState<CourseHistoryItem[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const exampleTopics = [
    { label: "Ubuhinzi bwa Kijyambere", icon: Sprout },
    { label: "Imicungire y'Imari", icon: Layout },
    { label: "Ikoranabuhanga ry'Ibanze", icon: BrainCircuit },
    { label: "Kwiga Icyongereza", icon: Book },
    { label: "Umutekano kuri Internet", icon: Target }
  ];

  const getSectionTheme = (title: string, index: number): ParsedSection['theme'] => {
    const t = title.toLowerCase();
    if (t.includes('ibibazo') || t.includes('quiz') || t.includes('imyitozo')) return 'rose';
    if (t.includes('mfashanyigisho') || t.includes('resource') || t.includes('ibitabo')) return 'blue';
    if (t.includes('intangiriro') || t.includes('intro')) return 'emerald';
    if (t.includes('incamake') || t.includes('outline')) return 'violet';
    const themes: ParsedSection['theme'][] = ['emerald', 'indigo', 'blue', 'violet', 'rose', 'amber'];
    return themes[index % themes.length];
  };

  const getThemeStyles = (theme: ParsedSection['theme']) => {
    switch (theme) {
      case 'amber': return { border: 'border-amber-100', bg: 'bg-amber-50', text: 'text-amber-900', icon: 'bg-amber-100 text-amber-700', accent: 'bg-amber-500' };
      case 'blue': return { border: 'border-blue-100', bg: 'bg-blue-50', text: 'text-blue-900', icon: 'bg-blue-100 text-blue-700', accent: 'bg-blue-500' };
      case 'indigo': return { border: 'border-indigo-100', bg: 'bg-indigo-50', text: 'text-indigo-900', icon: 'bg-indigo-100 text-indigo-700', accent: 'bg-indigo-500' };
      case 'rose': return { border: 'border-rose-100', bg: 'bg-rose-50', text: 'text-rose-900', icon: 'bg-rose-100 text-rose-700', accent: 'bg-rose-500' };
      case 'violet': return { border: 'border-violet-100', bg: 'bg-violet-50', text: 'text-violet-900', icon: 'bg-violet-100 text-violet-700', accent: 'bg-violet-500' };
      default: return { border: 'border-emerald-100', bg: 'bg-emerald-50', text: 'text-emerald-900', icon: 'bg-emerald-100 text-emerald-700', accent: 'bg-emerald-500' };
    }
  };

  useEffect(() => {
    if (!courseContent) {
      setParsedSections([]);
      return;
    }
    // Resilient parsing: split by level 2 or level 1 headers
    const rawSections = courseContent.split(/\n(?=#{1,2}\s)/g);
    const sections: ParsedSection[] = rawSections
      .map((section, index) => {
        const match = section.match(/^#{1,2}\s+(.*)\n([\s\S]*)$/);
        if (match) {
          const title = match[1].trim();
          const content = match[2].trim();
          return { title, content, id: `section-${index}`, theme: getSectionTheme(title, index) };
        }
        if (index === 0 && section.trim()) {
          return { title: "Intangiriro", content: section.trim(), id: 'section-0', theme: 'emerald' };
        }
        return null;
      })
      .filter((s): s is ParsedSection => s !== null);
    
    setParsedSections(sections);
    if (sections.length > 0) setActiveSection(sections[0].id);
  }, [courseContent]);

  const handleCreateCourse = async (customTopic?: string) => {
    const finalTopic = customTopic || topic;
    if (!finalTopic.trim()) return;
    setTopic(finalTopic);
    setIsLoading(true);
    setCourseContent('');
    setSources([]);
    try {
      const result = await generateCourse(finalTopic, level, duration, prerequisites);
      setCourseContent(result.text);
      setSources(result.sources);
      setHistory(prev => [{ id: Date.now().toString(), topic: finalTopic, level, duration, content: result.text, sources: result.sources, timestamp: Date.now() }, ...prev]);
      showToast('Isomo ryateguwe!', 'success');
    } catch (error) {
      showToast('Habaye ikibazo.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      scrollContainerRef.current?.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(courseContent);
    setCopied(true);
    showToast('Byakoporowe!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-slate-50/50">
      <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
        <aside className={`absolute md:relative z-40 w-full md:w-[320px] lg:w-[380px] flex flex-col h-full bg-white border-r border-emerald-100 transition-transform duration-300 ${isMobileSidebarOpen || !courseContent ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-8 space-y-10 overflow-y-auto h-full scrollbar-hide">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-emerald-950 tracking-tighter uppercase">Tegura Amasomo</h2>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">ai.rw Academic</span>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-900/40 px-1">Urwego</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['beginner', 'intermediate', 'advanced'] as CourseLevel[]).map((l) => (
                    <button key={l} onClick={() => setLevel(l)} className={`py-2 text-[10px] font-black uppercase rounded-xl border-2 transition-all ${level === l ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-emerald-50 text-emerald-800'}`}>
                      {l === 'beginner' ? 'Ibanze' : l === 'intermediate' ? 'Hagati' : 'Hejur'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-900/40 px-1">Ingingo</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                  <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Urugero: Ubuhinzi..." className="w-full pl-12 pr-4 py-4 bg-emerald-50/30 border-2 border-emerald-50 rounded-2xl outline-none font-bold" />
                </div>
              </div>
              <Button onClick={() => handleCreateCourse()} isLoading={isLoading} disabled={!topic.trim()} className="w-full h-16 rounded-[24px] text-lg font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20">
                Tegura Isomo
              </Button>
              <ProgressBar isLoading={isLoading} label="Irimo gutegura isomo..." duration={15000} />
            </div>
            {history.length > 0 && (
              <div className="pt-8 border-t border-emerald-50 space-y-4">
                <h3 className="text-[10px] font-black text-emerald-900/40 uppercase tracking-[0.2em] flex items-center gap-2"><History className="w-4 h-4" /> Amateka</h3>
                <div className="space-y-3">
                  {history.map((item) => (
                    <button key={item.id} onClick={() => { setCourseContent(item.content); setSources(item.sources || []); setTopic(item.topic); }} className={`w-full text-left p-5 rounded-2xl border transition-all ${courseContent === item.content ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-stone-100'}`}>
                      <div className="font-black text-sm uppercase truncate">{item.topic}</div>
                      <div className="text-[10px] opacity-60 uppercase font-bold">{item.level} level</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {courseContent && (
            <div className="bg-white/80 backdrop-blur-xl border-b border-emerald-50 p-5 px-8 flex justify-between items-center z-30 sticky top-0 shadow-sm">
               <div className="flex items-center gap-4">
                 <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden p-2.5 bg-emerald-50 rounded-xl text-emerald-600"><Menu className="w-6 h-6" /></button>
                 <h1 className="text-xl md:text-2xl font-black text-emerald-950 uppercase tracking-tighter truncate max-w-xs">{topic}</h1>
               </div>
               <div className="flex gap-2">
                  <button onClick={handleCopy} className="p-3 bg-stone-50 text-stone-400 hover:text-emerald-600 rounded-xl">{copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}</button>
               </div>
            </div>
          )}
          <div className="flex-1 flex overflow-hidden">
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar">
              {!courseContent ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-12">
                  <div className="w-40 h-40 bg-white rounded-[48px] shadow-2xl flex items-center justify-center border border-emerald-50"><GraduationCap className="w-20 h-20 text-emerald-600" /></div>
                  <div className="space-y-6 max-w-xl">
                    <h3 className="text-4xl md:text-5xl font-black text-emerald-950 tracking-tighter uppercase leading-none">Kwiga ni Ubuzima</h3>
                    <p className="text-stone-500 font-medium text-lg leading-relaxed">Tegura isomo rirambuye ku ntego wihaye binyuze mu Kinyarwanda.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl px-4">
                    {exampleTopics.map((ex, i) => (
                      <button key={i} onClick={() => handleCreateCourse(ex.label)} className="p-8 bg-white rounded-[40px] border border-stone-100 hover:border-emerald-300 transition-all text-left">
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6"><ex.icon className="w-7 h-7" /></div>
                        <span className="font-black text-emerald-950 uppercase block text-lg mb-2">{ex.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto p-6 md:p-12 pb-40 space-y-20">
                  <header className="bg-emerald-950 rounded-[64px] p-10 md:p-20 text-white shadow-2xl relative overflow-hidden group">
                     <div className="relative z-10 space-y-10">
                        <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
                          <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/10 rounded-full text-[11px] font-black uppercase tracking-[0.25em] backdrop-blur-sm">
                            <Map className="w-4 h-4 text-emerald-400" /> Isomo rya AI
                          </div>
                        </div>
                        <h2 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.85]">{topic}</h2>
                        {sources.length > 0 && <SourcesToggle sources={sources} variant="dark" className="mt-10" />}
                     </div>
                  </header>
                  <section className="space-y-16">
                    {parsedSections.map((section, idx) => {
                      const styles = getThemeStyles(section.theme);
                      return (
                        <div key={section.id} id={section.id} className="flex gap-8 md:gap-12 animate-in fade-in slide-in-from-bottom-8">
                           <div className={`w-16 h-16 shrink-0 rounded-[24px] ${styles.bg} border-2 ${styles.border} flex items-center justify-center text-xl font-black text-emerald-900 shadow-sm relative z-10`}>{idx + 1}</div>
                           <div className={`flex-1 bg-white rounded-[40px] shadow-sm border border-stone-100 overflow-hidden ${activeSection === section.id ? 'ring-4 ring-emerald-500/5' : ''}`}>
                              <div className={`${styles.bg} px-8 py-6 border-b border-stone-50 flex justify-between items-center`}>
                                 <h3 className={`text-xl md:text-2xl font-black uppercase tracking-tighter ${styles.text}`}>{section.title}</h3>
                              </div>
                              <div className="p-8 md:p-12 prose prose-emerald max-w-none">
                                 <FormattedText text={section.content} />
                              </div>
                           </div>
                        </div>
                      );
                    })}
                  </section>
                </div>
              )}
            </div>
            {courseContent && (
              <div className="hidden xl:block w-80 shrink-0 h-full border-l border-emerald-50 bg-white/30 backdrop-blur-sm p-8 overflow-y-auto">
                <div className="sticky top-0 space-y-8">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-950">Muri iri somo</h4>
                  <div className="space-y-2">
                    {parsedSections.map((s, idx) => (
                      <button key={s.id} onClick={() => scrollToSection(s.id)} className={`w-full text-left px-5 py-4 text-[10px] font-black rounded-2xl transition-all flex items-center gap-3 ${activeSection === s.id ? 'bg-emerald-600 text-white shadow-xl' : 'text-stone-400 hover:bg-emerald-50'}`}>
                        <span className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center text-[10px] ${activeSection === s.id ? 'bg-white/20' : 'bg-stone-100'}`}>{idx + 1}</span>
                        <span className="truncate uppercase tracking-tight">{s.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
