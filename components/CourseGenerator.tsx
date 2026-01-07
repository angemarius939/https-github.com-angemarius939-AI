
import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, BookOpen, Clock, Search, History, BrainCircuit, 
  ArrowRight, Layout, Book, Target, ChevronRight, Copy, Check, Menu, X, Sparkles, Map
} from 'lucide-react';
import { generateCourse } from '../services/geminiService';
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
  const [copied, setCopied] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [history, setHistory] = useState<CourseHistoryItem[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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

    // Advanced splitting to handle various Markdown header styles
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
    if (sections.length > 0) setActiveSection(sections[0].id);
  }, [courseContent]);

  const handleCreateCourse = async (customTopic?: string) => {
    const finalTopic = customTopic || topic;
    if (!finalTopic.trim()) return;
    setTopic(finalTopic);
    setIsLoading(true);
    setCourseContent('');
    try {
      const result = await generateCourse(finalTopic, level, duration, prerequisites);
      setCourseContent(result.text);
      setSources(result.sources);
      setHistory(prev => [{ id: Date.now().toString(), topic: finalTopic, level, duration, content: result.text, sources: result.sources, timestamp: Date.now() }, ...prev]);
      showToast('Isomo ryateguwe!', 'success');
    } catch (error) {
      showToast('Habaye ikibazo gutegura isomo.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-slate-50/50">
      <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
        <aside className={`absolute md:relative z-40 w-full md:w-[320px] flex flex-col h-full bg-white border-r border-emerald-100 transition-transform ${isMobileSidebarOpen || !courseContent ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="p-8 space-y-8 overflow-y-auto h-full scrollbar-hide">
            <h2 className="text-2xl font-black text-emerald-950 uppercase tracking-tighter">Amasomo</h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block px-1">Tegura Isomo Ryihariye</label>
                <input 
                  value={topic} 
                  onChange={(e) => setTopic(e.target.value)} 
                  placeholder="Andika ingingo..." 
                  className="w-full p-4 bg-emerald-50/30 border-2 border-emerald-50 rounded-2xl outline-none font-bold focus:border-emerald-500 transition-colors" 
                />
              </div>
              <Button onClick={() => handleCreateCourse()} isLoading={isLoading} disabled={!topic.trim()} className="w-full h-14 rounded-2xl">Tegura Isomo</Button>
              <ProgressBar isLoading={isLoading} label="Irimo gutegura..." duration={10000} />
            </div>
            {history.length > 0 && (
              <div className="pt-8 space-y-4">
                <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Amateka</h3>
                {history.map((item) => (
                  <button key={item.id} onClick={() => { setCourseContent(item.content); setTopic(item.topic); }} className="w-full text-left p-4 rounded-xl border border-stone-100 bg-white hover:border-emerald-200 transition-all">
                    <div className="font-bold text-sm truncate uppercase">{item.topic}</div>
                    <div className="text-[10px] text-stone-400 uppercase">{item.level}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-12 space-y-8 custom-scrollbar">
            {!courseContent ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
                <GraduationCap className="w-20 h-20 text-emerald-200" />
                <h3 className="text-3xl font-black text-emerald-950 uppercase tracking-tighter">Kwiga ni Ubuzima</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                  {exampleTopics.map((ex, i) => (
                    <button key={i} onClick={() => handleCreateCourse(ex.label)} className="p-6 bg-white rounded-3xl border border-stone-100 hover:border-emerald-300 transition-all text-left">
                       <span className="font-bold text-emerald-950 uppercase text-sm block">{ex.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-12">
                <header className="bg-emerald-950 rounded-[48px] p-10 md:p-16 text-white shadow-xl relative overflow-hidden">
                   <div className="relative z-10 space-y-6">
                      <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">{topic}</h2>
                      {sources.length > 0 && <SourcesToggle sources={sources} variant="dark" />}
                   </div>
                </header>
                <div className="space-y-12">
                  {parsedSections.map((section) => (
                    <div key={section.id} id={section.id} className="bg-white rounded-[32px] p-8 md:p-12 shadow-sm border border-stone-100 animate-in fade-in slide-in-from-bottom-4">
                       <h3 className="text-2xl font-black text-emerald-900 mb-6 uppercase tracking-tighter border-b border-emerald-50 pb-4">{section.title}</h3>
                       <div className="prose prose-emerald max-w-none">
                          <FormattedText text={section.content} />
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
