import React, { useState } from 'react';
import { GraduationCap, BookOpen, Clock, BarChart, ListChecks, Lightbulb } from 'lucide-react';
import { generateCourse } from '../services/geminiService';
import { Button } from './Button';
import { CourseLevel } from '../types';
import { useToast } from './ToastProvider';

export const CourseGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<CourseLevel>('beginner');
  const [duration, setDuration] = useState('');
  const [prerequisites, setPrerequisites] = useState('');
  const [courseContent, setCourseContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
    setCourseContent('');
    try {
      const result = await generateCourse(topic, level, duration, prerequisites);
      setCourseContent(result);
      showToast('Isomo ryateguwe!', 'success');
    } catch (error) {
      setCourseContent("Habaye ikibazo gutegura isomo.");
      showToast('Habaye ikibazo.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-6 max-w-4xl mx-auto w-full space-y-6 overflow-y-auto">
      <div className="text-center p-4 bg-white/90 backdrop-blur rounded-2xl shadow-sm border border-emerald-100">
        <h2 className="text-2xl font-bold text-emerald-900">Tegura Amasomo</h2>
        <p className="text-emerald-700 mt-2">
          Waba ushaka kwiga wowe ubwawe, cyangwa gutegura isomo ryo kwigisha abandi (facilitator)? 
          <br/>
          Koresha ai.rw utegure imfashanyigisho, ibitabo byo gusoma, n'ibibazo byo kwisuzuma (quizzes).
        </p>
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