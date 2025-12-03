import React, { useState, useEffect } from 'react';
import { GraduationCap, BookOpen, Clock, ListChecks, Search, History, Target, Layers, Book, BrainCircuit, ArrowRight, Printer, Layout, FileText } from 'lucide-react';
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
          return {
            title: match[2].trim(),
            content: match[3].trim(),
            id: match[2].toLowerCase().replace(/[^a-z0-9]/g, '')
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

  const getSectionIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('ibikubiye') || t.includes('toc')) return <Layout className="w-5 h-5 text-emerald-600" />;
    if (t.includes('intangiriro') || t.includes('intro')) return <Target className="w-5 h-5 text-emerald-600" />;
    if (t.includes('incamake') || t.includes('outline')) return <ListChecks className="w-5 h-5 text-emerald-600" />;
    if (t.includes('birambuye') || t.includes('detailed')) return <FileText className="w-5 h-5 text-emerald-600" />;
    if (t.includes('ingero') || t.includes('example')) return <Layers className="w-5 h-5 text-emerald-600" />;
    if (t.includes('ibitabo') || t.includes('resource')) return <Book className="w-5 h-5 text-emerald-600" />;
    if (t.includes('ibibazo') || t.includes('quiz')) return <BrainCircuit className="w-5 h-5 text-emerald-600" />;
    return <ArrowRight className="w-5 h-5 text-emerald-600" />;
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
                Tegura isomo ryuzuye, rirambuye kandi rifite imyitozo.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Ingingo</label>
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
                  <label className="text-sm font-medium text-slate-700">Urwego</label>
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
                   <label className="text-sm font-medium text-slate-700">Igihe</label>
                   <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Urugero: Icyumweru 1"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Ibisabwa</label>
                  <input
                  type="text"
                  value={prerequisites}
                  onChange={(e) => setPrerequisites(e.target.value)}
                  placeholder="Urugero: Kumenya gusoma..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={handleCreateCourse} 
                  isLoading={isLoading} 
                  disabled={!topic.trim()}
                  className="w-full"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
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

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
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
                      className={`w-full text-left p-3 rounded-lg border transition-all text-xs ${
                        courseContent === item.content 
                          ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' 
                          : 'bg-white border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                      }`}
                    >
                      <div className="font-bold text-emerald-900 truncate">{item.topic}</div>
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
              <GraduationCap className="w-20 h-20 text-emerald-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-emerald-900">Nta somo rirahari</h3>
              <p className="text-stone-500 mt-2">
                Uzuzanya ibisabwa ibumoso, maze ukande "Tegura Isomo" kugira ngo utangire.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="bg-white border-b border-emerald-100 p-4 flex justify-between items-center shadow-sm z-10">
                 <div>
                   <h1 className="text-xl font-bold text-emerald-950 line-clamp-1">{topic}</h1>
                   <div className="flex gap-2 text-xs mt-1">
                     <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{level}</span>
                     {duration && <span className="text-stone-500 flex items-center"><Clock className="w-3 h-3 mr-1"/> {duration}</span>}
                   </div>
                 </div>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => {
                         const printContent = document.getElementById('printable-course');
                         if(printContent) {
                            const win = window.open('', '', 'height=700,width=800');
                            if(win) {
                              win.document.write('<html><head><title>Isomo</title>');
                              win.document.write('<style>body { font-family: sans-serif; padding: 20px; line-height: 1.6; } h2 { color: #064e3b; border-bottom: 2px solid #ecfdf5; padding-bottom: 5px; margin-top: 30px; } ul { margin-left: 20px; } </style>');
                              win.document.write('</head><body>');
                              win.document.write(printContent.innerHTML);
                              win.document.write('</body></html>');
                              win.document.close();
                              win.print();
                            }
                         }
                      }}
                      className="p-2 text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Print / PDF"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                    {/* Mobile Back Button */}
                    <button 
                       className="md:hidden p-2 text-stone-500 hover:text-emerald-700 bg-stone-100 rounded-lg"
                       onClick={() => setCourseContent('')}
                    >
                       Funga
                    </button>
                 </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* TOC Sidebar (Desktop) */}
                <div className="hidden lg:block w-64 bg-white border-r border-stone-100 overflow-y-auto p-4">
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">Ibikubiye mu Isomo</h4>
                  <nav className="space-y-1">
                    {parsedSections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                          activeSection === section.id 
                            ? 'bg-emerald-50 text-emerald-700 font-medium' 
                            : 'text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                         {getSectionIcon(section.title)}
                         <span className="truncate">{section.title}</span>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Content Area */}
                <div id="printable-course" className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth bg-stone-50/50">
                  <div className="max-w-3xl mx-auto space-y-8 pb-20">
                    
                    {/* Sources (if any) displayed at the top or can be bottom */}
                    {sources && sources.length > 0 && (
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100 mb-6">
                        <SourcesToggle sources={sources} />
                      </div>
                    )}

                    {parsedSections.length > 0 ? (
                      parsedSections.map((section) => (
                        <div 
                          key={section.id} 
                          id={section.id} 
                          className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden scroll-mt-6"
                        >
                          <div className="bg-emerald-50/50 px-6 py-4 border-b border-emerald-100 flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm text-emerald-600">
                              {getSectionIcon(section.title)}
                            </div>
                            <h2 className="text-lg font-bold text-emerald-900">{section.title}</h2>
                          </div>
                          <div className="p-6">
                            <FormattedText text={section.content} />
                          </div>
                        </div>
                      ))
                    ) : (
                      // Fallback for unparsed content
                      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-8 text-slate-800 leading-relaxed whitespace-pre-wrap">
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