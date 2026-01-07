
import React, { useState, useEffect } from 'react';
import { X, ChevronRight, MessageSquare, Sparkles, GraduationCap, Sprout, ArrowRight } from 'lucide-react';
import { Button } from './Button';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Murakaza neza kuri ai.rw!",
      description: "Iyi ni porogaramu ya AI yubakiye ku muco n'ururimi rw'Ikinyarwanda. Twagufasha mu mirimo yawe ya buri munsi.",
      icon: <Sparkles className="w-12 h-12 text-emerald-500" />,
      color: "bg-emerald-50"
    },
    {
      title: "Ikiganiro Cyihuse",
      description: "Andika mu Kinyarwanda cyangwa izindi ndimi, ai.rw izagusubiza vuba kandi igufashe gushaka amakuru mashya kuri internet.",
      icon: <MessageSquare className="w-12 h-12 text-blue-500" />,
      color: "bg-blue-50"
    },
    {
      title: "Ibikoresho by'Iterambere",
      description: "Koresha 'Iterambere' ku nama z'ubuhinzi, cyangwa 'Umujyanama' ku isesengurwa ry'imibare n'ubucuruzi bwawe.",
      icon: <Sprout className="w-12 h-12 text-green-500" />,
      color: "bg-green-50"
    },
    {
      title: "Kugera ku Ntego",
      description: "Tegura amasomo, kora amafoto, cyangwa uhindure imyandikire binyuze mu bikoresho biri mu ruhande rw'ibumoso.",
      icon: <GraduationCap className="w-12 h-12 text-indigo-500" />,
      color: "bg-indigo-50"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const currentStep = steps[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-emerald-950/40 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="bg-white w-full max-w-lg rounded-[48px] shadow-2xl border border-white/50 overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-500">
        
        <button 
          onClick={onComplete}
          className="absolute top-8 right-8 p-2 text-stone-300 hover:text-stone-500 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className={`p-12 pb-8 flex flex-col items-center text-center space-y-8 ${currentStep.color} transition-colors duration-500`}>
          <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-black/5 animate-bounce-slow">
            {currentStep.icon}
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-emerald-950 uppercase tracking-tighter leading-none">
              {currentStep.title}
            </h2>
            <p className="text-stone-600 font-medium leading-relaxed">
              {currentStep.description}
            </p>
          </div>
        </div>

        <div className="p-8 px-12 bg-white flex flex-col space-y-6">
          <div className="flex justify-center gap-2">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-emerald-500' : 'w-2 bg-stone-200'}`}
              />
            ))}
          </div>

          <div className="flex gap-4">
            {step > 0 && (
              <Button variant="secondary" onClick={() => setStep(step - 1)} className="flex-1 h-16 rounded-2xl font-bold">
                Inyuma
              </Button>
            )}
            <Button onClick={handleNext} className="flex-[2] h-16 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20">
              {step === steps.length - 1 ? 'Tangira' : 'Komeza'}
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
