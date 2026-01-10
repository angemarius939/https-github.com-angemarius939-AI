
import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, BookOpen, Menu, X, Sparkles, Layout, Book, Target, 
  Timer, Lightbulb, ChevronRight, Check, History, ArrowRight, Layers
} from 'lucide-react';
import { streamCourseResponse } from '../services/geminiService';
import { Button } from './Button';
import { CourseLevel, Source } from '../types';
import { useToast } from './ToastProvider';
import { ProgressBar } from './ProgressBar';
import { FormattedText } from './FormattedText';
import { SourcesToggle } from './SourcesToggle';

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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [history, setHistory] = useState<CourseHistoryItem[]>([]);
  const { showToast } = useToast();

  const exampleTopics = [
    { label: "Ubuhinzi bwa Kijyambere", icon: Sparkles },
    { label: "Imicungire y'Imari", icon: Layout },
    { label: "Kwiga Icyongereza", icon: Book },
    { label: "Umutekano kuri Internet", icon: Target }
  ];

  useEffect(() => {
    if (!courseContent) {
      setParsedSections([]);
      return;
    }

    // Improved parsing for streaming content
    const rawSections = courseContent.split(/\n(?=#{1,3}\s)/g);
    const sections: ParsedSection[] = rawSections
      .map((section, index) => {
        const match = section.match(/^#{1,3}\s+(.*)\n([\s\S]*)$/);
        if (match) {
          return {
            title: match[1].trim(),
            content: match[2].trim(),
            id: `section-${index}`,
            theme: index % 2 === 0 ? 'emerald' : 'blue'
          } as ParsedSection;
        }
        if (index === 0 && section.trim()) {
          return { title: "Intangiriro", content: section.trim(), id: 'section-0', theme: 'emerald' } as ParsedSection;
        }
        return null;
      })
      .filter((s): s is ParsedSection => s !== null);
    
    setParsedSections(sections.length > 0 ? sections : [{ title: "Isomo", content: courseContent, id: 'section-0', theme: 'emerald' }]);
    if (sections.length > 0 && !activeSection) setActiveSection(sections[0].id);
  }, [courseContent]);

  const handleCreateCourse = async (customTopic?: string) => {
    const finalTopic = customTopic || topic;
    if (!finalTopic.trim()) return;
    
    setTopic(finalTopic);
    setIsLoading(true);
    setCourseContent('');
    setActiveSection('');
    
    try {
      let fullText = "";
      await streamCourseResponse(
        finalTopic, 
        level, 
        duration || 'Igihe gikwiriye', 
        prerequisites,
        (chunk) => {
          fullText += chunk;
          setCourseContent(fullText);
        }
      );
      
      setHistory(prev => [{ 
        id: Date.now().toString(), 
        topic: finalTopic, 
        level, 
        duration, 
        content: fullText, 
        timestamp: Date.now() 
      }, ...prev]);
      
      showToast('Isomo ryateguwe neza!', 'success');
      setIsMobileSidebarOpen(false);
    } catch (error) {
      showToast('Habaye ikibazo mu gutegura isomo. Gerageza mukanya.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const levelOptions: { value: CourseLevel; label: string }[] = [
    { value: 'beginner', label: 'Abatangiye' },
    { value: 'intermediate', label: 'Abaziho bike' },
    { value: 'advanced', label: 'Ababiziranyi' }
  ];

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-slate-50/50">
      <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
        <aside className={`absolute md:relative z-40 w-full md:w-[360px] flex flex-col h-full bg-white border-r border-emerald-100 transition-transform duration-300 ${isMobileSidebarOpen || !courseContent ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-8 space-y-8 overflow-y-auto h-full scrollbar-hide">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-emerald-950 uppercase tracking-tighter">Amasomo</h2>
              <button className="md:hidden" onClick={() => setIsMobileSidebarOpen(false)}>
                <X className="w-6 h-6 text-stone-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block px-1 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Ingingo y'Isomo
                </label>
                <input 
                  value={topic} 
                  onChange={(e) => setTopic(e.target.value)} 
                  placeholder="Urugero: Ubuhinzi bw'icyayi..." 
                  className="w-full p-4 bg-emerald-50/30 border-2 border-emerald-50 rounded-2xl outline-none font-bold focus:border-emerald-500 transition-colors" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block px-1 flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Urwego rw'Isomo
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {levelOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setLevel(opt.value)}
                      className={`p-3 rounded-xl border-2 text-sm font-bold transition-all text-left ${
                        level === opt.value 
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' 
                          : 'bg-white border-stone-100 text-stone-600 hover:border-emerald-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block px-1 flex items-center gap-1">
                  <Timer className="w-3 h-3" /> Igihe cyo Kwiga
                </label>
                <input 
                  value={duration} 
                  onChange={(e) => setDuration(e.target.value)} 
                  placeholder="Urugero: Icyumweru 1..." 
                  className="w-full p-4 bg-emerald-50/30 border-2 border-emerald-50 rounded-2xl outline-none font-bold focus:border-emerald-500 transition-colors" 
                />
              </div>

              <Button onClick={() => handleCreateCourse()} isLoading={isLoading} disabled={!topic.trim()} className="w-full h-14 rounded-2xl shadow-xl shadow-emerald-600/20">
                Tegura Isomo
              </Button>
              <ProgressBar isLoading={isLoading} label="ai.rw irimo gutegura isomo..." duration={15000} />
            </div>

            {history.length > 0 && (
              <div className="pt-8 space-y-4">
                <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-100 pb-2">Amateka</h3>
                <div className="space-y-3">
                  {history.slice(0, 5).map((item) => (
                    <button key={item.id} onClick={() => { setCourseContent(item.content); setTopic(item.topic); }} className="w-full text-left p-4 rounded-xl border border-stone-100 bg-white hover:border-emerald-200 hover:shadow-sm transition-all group">
                      <div className="font-bold text-sm truncate uppercase text-stone-800 group-hover:text-emerald-700">{item.topic}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {courseContent && (
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden absolute top-4 left-4 z-30 p-3 bg-emerald-600 text-white rounded-full shadow-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
          )}

          <div className="flex-1 overflow-y-auto p-4 md:p-12 space-y-8 custom-scrollbar">
            {!courseContent && !isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-12 py-20">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-100 rounded-full blur-3xl opacity-50 scale-150 animate-pulse"></div>
                  <GraduationCap className="w-32 h-32 text-emerald-600 relative z-10" />
                </div>
                <div className="space-y-4 max-w-lg mx-auto">
                  <h3 className="text-4xl font-black text-emerald-950 uppercase tracking-tighter">Kwiga ni Ubuzima</h3>
                  <p className="text-stone-500 font-medium">Hitamo ingingo wifuza kwigaho, ai.rw igutegurire imfashanyigisho irambuye.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl">
                  {exampleTopics.map((ex, i) => (
                    <button key={i} onClick={() => handleCreateCourse(ex.label)} className="group p-8 bg-white rounded-[40px] border-2 border-stone-50 hover:border-emerald-200 hover:shadow-xl transition-all text-left flex items-start gap-4">
                       <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
                          <ex.icon className="w-6 h-6" />
                       </div>
                       <div>
                         <span className="font-black text-emerald-950 uppercase text-sm block mb-1 tracking-tight">{ex.label}</span>
                         <span className="text-xs text-stone-400 font-medium">Kanda utangire kwiga</span>
                       </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {isLoading && !courseContent && (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <ProgressBar isLoading={true} label="Isomo ririmo gutegurwa..." duration={15000} />
                  </div>
                )}
                
                {courseContent && (
                  <>
                    <header className="bg-emerald-950 rounded-[48px] p-10 md:p-20 text-white shadow-2xl relative overflow-hidden">
                       <div className="relative z-10 space-y-8">
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                             <GraduationCap className="w-4 h-4 text-emerald-400" />
                             Isomo rya ai.rw
                          </div>
                          <h2 className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-none">{topic}</h2>
                       </div>
                    </header>

                    <div className="space-y-12">
                      {parsedSections.map((section) => (
                        <div key={section.id} id={section.id} className="bg-white rounded-[48px] p-10 md:p-16 shadow-sm border border-stone-100 relative group hover:shadow-md transition-shadow">
                           <h3 className="text-3xl font-black text-emerald-900 mb-8 uppercase tracking-tighter border-b border-emerald-50 pb-6">
                              {section.title}
                           </h3>
                           <div className="prose prose-emerald prose-lg max-w-none">
                              <FormattedText text={section.content} className="text-stone-700" />
                           </div>
                        </div>
                      ))}
                    </div>

                    {!isLoading && (
                      <div className="bg-emerald-50 rounded-[48px] p-12 text-center space-y-6 border border-emerald-100">
                        <h4 className="text-2xl font-black text-emerald-950 uppercase tracking-tighter">Isomo Ryarangiye!</h4>
                        <Button onClick={() => setCourseContent('')} variant="primary" className="px-10 h-14 rounded-2xl">Tangira Irishya</Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
