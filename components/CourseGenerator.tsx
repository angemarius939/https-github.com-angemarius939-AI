import React, { useState } from 'react';
import { GraduationCap, BookOpen, Clock, BarChart, ListChecks, Lightbulb, Search, History, Calendar } from 'lucide-react';
import { generateCourse } from '../services/geminiService';
import { Button } from './Button';
import { CourseLevel } from '../types';
import { useToast } from './ToastProvider';

interface CourseHistoryItem {
  id: string;
  topic: string;
  level: string;
  duration: string;
  content: string;
  timestamp: number;
}

export const CourseGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<CourseLevel>('beginner');
  const [duration, setDuration] = useState('');
  const [prerequisites, setPrerequisites] = useState('');
  const [courseContent, setCourseContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
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

  const handleCreateCourse = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    // Don't clear content immediately so user can see previous while loading if they want
    try {
      const result = await generateCourse(topic, level, duration, prerequisites);
      setCourseContent(result);
      
      // Add to history
      const newItem: CourseHistoryItem = {
        id: Date.now().toString(),
        topic,
        level,
        duration,
        content: result,
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

  return (
    <div className="flex flex-col h-full p-6 max-w-4xl mx-auto w-full space-y-6 overflow-y-auto">
      <div className="text-center p-6 bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-emerald-100">
        <h2 className="text-2xl font-bold text-emerald-900">Tegura Amasomo</h2>
        <p className="text-emerald-700 mt-2 mb-4">
          Waba ushaka kwiga wowe ubwawe, cyangwa gutegura isomo ryo kwigisha abandi (facilitator)? 
          <br/>
          Koresha ai.rw utegure isomo ryuzuye.
        </p>

        <div className="mt-4 bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 text-left max-w-2xl mx-auto">
          <h3 className="text-sm font-bold text-emerald-800 flex items-center mb-3">
            <ListChecks className="w-4 h-4 mr-2" />
            Ibikubiye mu Isomo (Course Sections):
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm text-emerald-700">
            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2"></span>Ibikubiye mu Isomo (TOC)</li>
            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2"></span>Intangiriro (Introduction)</li>
            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2"></span>Incamake y'Isomo (Outline)</li>
            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2"></span>Ingingo z'Ingenzi (Birambuye)</li>
            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2"></span>Ingero Zifatika (Examples)</li>
            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2"></span>Imfashanyigisho & Ibitabo</li>
            <li className="flex items-center"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2"></span>Ibibazo & Imyitozo (Quiz)</li>
          </ul>
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur p-6 rounded-2xl shadow-sm border border-emerald-100 space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Ingingo</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Urugero: Kwizigamira, Kubaka..."
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Lightbulb className="w-3 h-3 text-emerald-500" />
                <span className="text-xs text-emerald-600 font-medium">Gerageza:</span>
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Urwego</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setLevel('beginner')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm border transition-all ${
                    level === 'beginner' ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  Intangiriro
                </button>
                <button
                  onClick={() => setLevel('intermediate')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm border transition-all ${
                    level === 'intermediate' ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  Hagati
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                <Clock className="w-4 h-4 mr-1 text-slate-400" />
                Igihe
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Urugero: Iminota 30, Icyumweru 1..."
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center">
                <ListChecks className="w-4 h-4 mr-1 text-slate-400" />
                Ibisabwa
              </label>
              <input
                type="text"
                value={prerequisites}
                onChange={(e) => setPrerequisites(e.target.value)}
                placeholder="Urugero: Kumenya gusoma..."
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>
        </div>

        <Button 
          onClick={handleCreateCourse} 
          isLoading={isLoading} 
          disabled={!topic.trim()}
          className="w-full"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Tegura Isomo
        </Button>
      </div>
      
      {/* History / Search Section */}
      {history.length > 0 && (
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-sm border border-emerald-100 p-6 space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-emerald-900 flex items-center">
              <History className="w-5 h-5 mr-2" />
              Amateka y'Amasomo ({history.length})
            </h3>
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Shakisha isomo..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-emerald-50/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredHistory.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCourseContent(item.content);
                  setTopic(item.topic);
                  setLevel(item.level as CourseLevel);
                  setDuration(item.duration || '');
                  setPrerequisites(''); // Optional reset
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }}
                className={`text-left p-4 rounded-xl border transition-all relative group ${
                  courseContent === item.content 
                    ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 shadow-sm' 
                    : 'bg-white border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/30 hover:shadow-md'
                }`}
              >
                <div className="font-bold text-emerald-900 truncate pr-2">{item.topic}</div>
                <div className="flex justify-between items-center mt-2">
                   <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      item.level === 'beginner' ? 'bg-green-100 text-green-700' :
                      item.level === 'intermediate' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                   }`}>
                     {item.level}
                   </span>
                   <div className="flex items-center text-[10px] text-stone-400">
                     <Calendar className="w-3 h-3 mr-1" />
                     {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </div>
                </div>
              </button>
            ))}
            {filteredHistory.length === 0 && (
              <div className="col-span-full text-center py-4 text-stone-400 text-sm border-2 border-dashed border-stone-100 rounded-xl">
                Nta somo ribonetse rijyanye na "{searchQuery}".
              </div>
            )}
          </div>
        </div>
      )}

      {courseContent && (
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-lg border border-emerald-100 overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="bg-emerald-600 p-4 text-white flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="flex items-center">
              <GraduationCap className="w-6 h-6 mr-2" />
              <h3 className="font-bold text-lg">{topic}</h3>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-emerald-800 px-2 py-1 rounded-full uppercase tracking-wider">{level}</span>
              {duration && <span className="bg-emerald-700 px-2 py-1 rounded-full">{duration}</span>}
            </div>
          </div>
          <div className="p-6 bg-stone-50 prose prose-emerald max-w-none">
            <div className="whitespace-pre-wrap text-slate-800 leading-relaxed">
              {courseContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}