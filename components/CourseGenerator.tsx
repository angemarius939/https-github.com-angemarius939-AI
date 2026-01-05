import React, { useState, useEffect } from 'react';
import { GraduationCap, BookOpen, Clock, ListChecks, Search, History, Target, Layers, Book, BrainCircuit, ArrowRight, Printer, Layout, FileText, Link, ChevronRight, HelpCircle, Download, Lightbulb, Bookmark, Copy, Check } from 'lucide-react';
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
  
  // History and Search State
  const [history, setHistory] = useState<CourseHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { showToast } = useToast();

  const exampleTopics = [
    "Ubuhinzi bwa Kijyambere",
    "Imicungire y'Imari",
    "Ikoranabuhanga ry'Ibanze", 
    "Kwiga Icyongereza"
  ];

  const getSectionTheme = (title: string): ParsedSection['theme'] => {
    const t = title.toLowerCase();
    if (t.includes('ibibazo') || t.includes('quiz') || t.includes('imyitozo')) return 'amber';
    if (t.includes('mfashanyigisho') || t.includes('resource') || t.includes('ibitabo') || t.includes('books')) return 'blue';
    if (t.includes('intangiriro') || t.includes('intro')) return 'indigo';
    if (t.includes('incamake') || t.includes('outline')) return 'violet';
    if (t.includes('ingero') || t.includes('example')) return 'rose';
    return 'emerald';
  };

  const getThemeStyles = (theme: ParsedSection['theme']) => {
    switch (theme) {
      case 'amber':
        return {
          border: 'border-amber-200',
          headerBg: 'bg-gradient-to-r from-amber-50 to-white',
          iconBg: 'bg-amber-100 text-amber-700',
          title: 'text-amber-900',
          accent: 'bg-amber-500',
          sidebarHover: 'hover:bg-amber-50',
          sidebarActive: 'bg-amber-50 text-amber-900 border-amber-200'
        };
      case 'blue':
        return {
          border: 'border-blue-200',
          headerBg: 'bg-gradient-to-r from-blue-50 to-white',
          iconBg: 'bg-blue-100 text-blue-700',
          title: 'text-blue-900',
          accent: 'bg-blue-500',
          sidebarHover: 'hover:bg-blue-50',
          sidebarActive: 'bg-blue-50 text-blue-900 border-blue-200'
        };
      case 'indigo':
        return {
          border: 'border-indigo-200',
          headerBg: 'bg-gradient-to-r from-indigo-50 to-white',
          iconBg: 'bg-indigo-100 text-indigo-700',
          title: 'text-indigo-900',
          accent: 'bg-indigo-500',
          sidebarHover: 'hover:bg-indigo-50',
          sidebarActive: 'bg-indigo-50 text-indigo-900 border-indigo-200'
        };
      case 'violet':
        return {
          border: 'border-violet-200',
          headerBg: 'bg-gradient-to-r from-violet-50 to-white',
          iconBg: 'bg-violet-100 text-violet-700',
          title: 'text-violet-900',
          accent: 'bg-violet-500',
          sidebarHover: 'hover:bg-violet-50',
          sidebarActive: 'bg-violet-50 text-violet-900 border-violet-200'
        };
      case 'rose':
        return {
          border: 'border-rose-200',
          headerBg: 'bg-gradient-to-r from-rose-50 to-white',
          iconBg: 'bg-rose-100 text-rose-700',
          title: 'text-rose-900',
          accent: 'bg-rose-500',
          sidebarHover: 'hover:bg-rose-50',
          sidebarActive: 'bg-rose-50 text-rose-900 border-rose-200'
        };
      default: // emerald
        return {
          border: 'border-emerald-200',
          headerBg: 'bg-gradient-to-r from-emerald-50 to-white',
          iconBg: 'bg-emerald-100 text-emerald-700',
          title: 'text-emerald-900',
          accent: 'bg-emerald-500',
          sidebarHover: 'hover:bg-emerald-50',
          sidebarActive: 'bg-emerald-50 text-emerald-900 border-emerald-200'
        };
    }
  };

  // Parse course content when it updates
  useEffect(() => {
    if (!courseContent) {
      setParsedSections([]);
      return;
    }

    const rawSections = courseContent.split(/(?=## \d+\.|## )/g);
    
    const sections: ParsedSection[] = rawSections
      .map(section => {
        const match = section.match(/## (?:(\d+\.)\s*)?(.*?)\n([\s\S]*)/);
        if (match) {
          const title = match[2].trim();
          return {
            title: title,
            content: match[3].trim(),
            id: title.toLowerCase().replace(/[^a-z0-9]/g, ''),
            theme: getSectionTheme(title)
          };
        }
        return null;
      })
      .filter((s): s is ParsedSection => s !== null);

    setParsedSections(sections);
    if (sections.length > 0) setActiveSection(sections[0].id);

  }, [courseContent]);

  const handleCreateCourse = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setSources([]);
    setCopied(false);
    try {
      const result = await generateCourse(topic, level, duration, prerequisites);
      setCourseContent(result.text);
      setSources(result.sources);
      
      const newItem: CourseHistoryItem = {
        id: Date.now().toString(),
        topic,
        level,
        duration,
        content: result.text,
        sources: result.sources,
        timestamp: Date.now()
      };
      setHistory(prev => [newItem, ...prev]);
      
      showToast('Isomo ryateguwe!', 'success');
    } catch (error) {
      setCourseContent("Habaye ikibazo gutegura isomo.");
      showToast('Habaye ikibazo.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!courseContent) return;
    navigator.clipboard.writeText(courseContent);
    setCopied(true);
    showToast('Byakoporowe!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredHistory = history.filter(item => 
    item.topic.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.level.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getSectionIcon = (title: string, className: string = "w-5 h-5") => {
    const t = title.toLowerCase();
    if (t.includes('ibikubiye') || t.includes('toc')) return <Layout className={className} />;
    if (t.includes('intangiriro') || t.includes('intro')) return <Target className={className} />;
    if (t.includes('incamake') || t.includes('outline')) return <ListChecks className={className} />;
    if (t.includes('birambuye') || t.includes('detailed')) return <BookOpen className={className} />;
    if (t.includes('ingero') || t.includes('example')) return <Lightbulb className={className} />;
    if (t.includes('ibitabo') || t.includes('book')) return <Book className={className} />;
    if (t.includes('mfashanyigisho') || t.includes('resource') || t.includes('amakuru')) return <Bookmark className={className} />;
    if (t.includes('ibibazo') || t.includes('quiz')) return <HelpCircle className={className} />;
    return <ArrowRight className={className} />;
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto w-full overflow-hidden">
      <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
        
        {/* Left Column: Input & History (Scrollable) */}
        <div className={`w-full md:w-[400px] lg:w-[450px] flex flex-col h-full bg-white border-r border-emerald-100 overflow-y-auto ${courseContent ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 space-y-6">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-emerald-900">Tegura Amasomo</h2>
              <p className="text-emerald-700 mt-2 text-sm">
                Tegura isomo ryuzuye, rirambuye rifite imyitozo, ibitabo n'imfashanyigisho.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Ingingo (Topic)</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Urugero: Ubuhinzi bwa Kijyambere..."
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {exampleTopics.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setTopic(ex)}
                      className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100 hover:bg-emerald-100 transition-colors"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Urwego (Level)</label>
                  <select 
                    value={level} 
                    onChange={(e) => setLevel(e.target.value as CourseLevel)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="beginner">Intangiriro</option>
                    <option value="intermediate">Hagati</option>
                    <option value="advanced">Icyisumbuye</option>
                  </select>
                </div>
                <div className="space-y-2">
                   <label className="text-sm font-medium text-slate-700">Igihe (Duration)</label>
                   <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Ex: Icyumweru 1"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Ibisabwa (Prerequisites)</label>
                  <input
                  type="text"
                  value={prerequisites}
                  onChange={(e) => setPrerequisites(e.target.value)}
                  placeholder="Ex: Kumenya gusoma..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={handleCreateCourse} 
                  isLoading={isLoading} 
                  disabled={!topic.trim()}
                  className="w-full h-12"
                >
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Tegura Isomo
                </Button>
                <ProgressBar isLoading={isLoading} label="Irimo gutegura isomo... (Bishobora gutinda)" duration={8000} />
              </div>
            </div>

            {/* History Section */}
            {history.length > 0 && (
              <div className="pt-6 border-t border-emerald-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-emerald-900 flex items-center">
                    <History className="w-4 h-4 mr-2" />
                    Amateka
                  </h3>
                  <div className="relative">
                     <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Shakisha..."
                      className="w-32 px-2 py-1 text-xs border border-emerald-200 rounded-md focus:outline-none bg-emerald-50"
                    />
                    <Search className="w-3 h-3 text-emerald-400 absolute right-2 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {filteredHistory.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCourseContent(item.content);
                        setSources(item.sources || []);
                        setTopic(item.topic);
                        setLevel(item.level as CourseLevel);
                        setDuration(item.duration || '');
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-all text-xs group ${
                        courseContent === item.content 
                          ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 shadow-sm' 
                          : 'bg-white border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                      }`}
                    >
                      <div className="font-bold text-emerald-900 truncate flex items-center justify-between">
                        {item.topic}
                        {courseContent === item.content && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                      </div>
                      <div className="flex justify-between items-center mt-1 text-stone-500">
                        <span>{item.level}</span>
                        <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Course Content Display */}
        <div className={`flex-1 flex flex-col h-full bg-stone-50 overflow-hidden ${!courseContent && 'hidden md:flex items-center justify-center'}`}>
          {!courseContent ? (
            <div className="text-center p-8 max-w-md opacity-60">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-12 h-12 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-emerald-900">Nta somo rirahari</h3>
              <p className="text-stone-500 mt-3 text-lg">
                Uzuzanya ibisabwa ibumoso, maze ukande "Tegura Isomo" kugira ngo utangire urugendo rwo kwiga.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="bg-white border-b border-emerald-100 p-4 px-6 flex justify-between items-center shadow-sm z-10 shrink-0">
                 <div>
                   <h1 className="text-xl md:text-2xl font-bold text-emerald-950 line-clamp-1">{topic}</h1>
                   <div className="flex flex-wrap gap-2 text-xs mt-1.5">
                     <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full font-medium border border-emerald-200 uppercase tracking-wide text-[10px]">
                       {level}
                     </span>
                     {duration && (
                       <span className="bg-stone-100 text-stone-600 px-2.5 py-0.5 rounded-full font-medium border border-stone-200 flex items-center">
                         <Clock className="w-3 h-3 mr-1" /> 
                         {duration}
                       </span>
                     )}
                   </div>
                 </div>
                 <div className="flex gap-2">
                    <button 
                      onClick={handleCopy}
                      className="p-2.5 text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                      title="Koporora"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={() => {
                         const printContent = document.getElementById('printable-course');
                         if(printContent) {
                            const win = window.open('', '', 'height=700,width=800');
                            if(win) {
                              win.document.write('<html><head><title>Isomo - ' + topic + '</title>');
                              win.document.write('<style>body { font-family: sans-serif; padding: 40px; line-height: 1.6; color: #333; } h1 { text-align: center; color: #064e3b; margin-bottom: 20px; } .section { margin-bottom: 30px; border: 1px solid #eee; border-radius: 8px; overflow: hidden; } .header { background: #f0fdf4; padding: 10px 20px; font-weight: bold; color: #065f46; border-bottom: 1px solid #eee; } .content { padding: 20px; } ul { margin-left: 20px; } </style>');
                              win.document.write('</head><body>');
                              win.document.write('<h1>' + topic + '</h1>');
                              win.document.write(printContent.innerHTML);
                              win.document.write('</body></html>');
                              win.document.close();
                              win.print();
                            }
                         }
                      }}
                      className="p-2.5 text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                      title="Print / PDF"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                    {/* Mobile Back Button */}
                    <button 
                       className="md:hidden p-2.5 text-stone-500 hover:text-emerald-700 bg-stone-100 rounded-lg"
                       onClick={() => setCourseContent('')}
                    >
                       Funga
                    </button>
                 </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* TOC Sidebar (Desktop) */}
                <div className="hidden lg:flex w-72 bg-white border-r border-stone-100 flex-col overflow-hidden">
                  <div className="p-4 border-b border-stone-50 bg-stone-50/30">
                    <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Ibikubiye mu Isomo</h4>
                  </div>
                  <nav className="flex-1 overflow-y-auto p-4 space-y-1 relative">
                    {/* Vertical line track */}
                    <div className="absolute left-[26px] top-6 bottom-6 w-0.5 bg-stone-100 -z-10"></div>
                    
                    {parsedSections.map((section, idx) => {
                      const isActive = activeSection === section.id;
                      const styles = getThemeStyles(section.theme);
                      
                      return (
                        <button
                          key={section.id}
                          onClick={() => scrollToSection(section.id)}
                          className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-all flex items-center gap-3 group relative border border-transparent ${
                            isActive ? `${styles.sidebarActive} shadow-sm font-semibold` : `text-stone-600 ${styles.sidebarHover}`
                          }`}
                        >
                           <div className={`flex items-center justify-center w-6 h-6 rounded-md bg-white border shadow-sm shrink-0 transition-colors ${isActive ? 'border-transparent' : 'border-stone-200'}`}>
                              {getSectionIcon(section.title, `w-3.5 h-3.5 ${isActive ? styles.iconBg.split(' ')[1] : 'text-stone-400'}`)}
                           </div>
                           <span className="truncate">{section.title}</span>
                           {isActive && <div className={`absolute right-2 w-1.5 h-1.5 rounded-full ${styles.accent}`}></div>}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Content Area */}
                <div id="printable-course" className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth bg-stone-50/50">
                  <div className="max-w-4xl mx-auto space-y-8 pb-24">
                    
                    {/* Intro Banner with Sources */}
                    <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-32 bg-white opacity-5 rounded-full transform translate-x-10 -translate-y-10 blur-3xl"></div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2 opacity-80">
                          <GraduationCap className="w-5 h-5" />
                          <span className="text-sm font-medium uppercase tracking-wide">Isomo Ryateguwe</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold mb-4">{topic}</h2>
                        <div className="flex flex-wrap gap-4 text-emerald-100 text-sm">
                           <div className="flex items-center"><Layers className="w-4 h-4 mr-2" /> {parsedSections.length} Sections</div>
                           {duration && <div className="flex items-center"><Clock className="w-4 h-4 mr-2" /> {duration}</div>}
                        </div>
                        
                        {sources && sources.length > 0 && (
                          <div className="mt-6 pt-4 border-t border-emerald-700/50">
                            <SourcesToggle sources={sources} variant="dark" />
                          </div>
                        )}
                      </div>
                    </div>

                    {parsedSections.length > 0 ? (
                      parsedSections.map((section) => {
                        const styles = getThemeStyles(section.theme);

                        return (
                          <div 
                            key={section.id} 
                            id={section.id} 
                            className={`bg-white rounded-2xl shadow-sm border ${styles.border} overflow-hidden scroll-mt-6 transition-all duration-300 hover:shadow-md group`}
                          >
                            <div className={`${styles.headerBg} px-6 py-5 border-b ${styles.border} flex items-center gap-4`}>
                              <div className={`p-2.5 rounded-xl shadow-sm ${styles.iconBg} border border-white/50 group-hover:scale-110 transition-transform`}>
                                {getSectionIcon(section.title)}
                              </div>
                              <h2 className={`text-xl font-bold ${styles.title}`}>
                                {section.title}
                              </h2>
                            </div>
                            <div className="p-6 md:p-8 text-lg">
                              <FormattedText text={section.content} className="text-stone-800" />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      // Fallback for unparsed content
                      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-8 text-slate-800 leading-relaxed whitespace-pre-wrap text-lg">
                        <FormattedText text={courseContent} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};