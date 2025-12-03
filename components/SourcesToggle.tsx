import React, { useState } from 'react';
import { Globe, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Source } from '../types';
import { Button } from './Button';

interface SourcesToggleProps {
  sources: Source[];
  className?: string;
  variant?: 'light' | 'dark';
}

export const SourcesToggle: React.FC<SourcesToggleProps> = ({ sources, className = '', variant = 'light' }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  const textColor = variant === 'dark' ? 'text-emerald-100' : 'text-emerald-700';
  const bgColor = variant === 'dark' ? 'bg-emerald-800' : 'bg-emerald-50';
  const hoverColor = variant === 'dark' ? 'hover:bg-emerald-700' : 'hover:bg-emerald-100';
  const borderColor = variant === 'dark' ? 'border-emerald-700' : 'border-emerald-100';

  return (
    <div className={`mt-4 pt-2 border-t ${borderColor} ${className}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${bgColor} ${textColor} ${hoverColor}`}
      >
         <Globe className="w-3.5 h-3.5" />
         <span>Inkomoko ({sources.length})</span>
         {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      
      {isOpen && (
        <div className={`mt-3 space-y-2 animate-in fade-in slide-in-from-top-1 ${variant === 'dark' ? 'text-emerald-100' : 'text-stone-600'}`}>
          <p className="text-[10px] uppercase font-bold tracking-wider opacity-70 mb-2">Aho byakuwe:</p>
          {sources.map((source, idx) => (
            <a 
              key={idx}
              href={source.uri}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-start text-xs leading-tight hover:underline gap-2 p-2 rounded-lg transition-colors ${
                 variant === 'dark' ? 'hover:bg-white/10' : 'hover:bg-stone-100'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-70" />
              <div className="flex flex-col">
                 <span className="font-medium">{source.title}</span>
                 <span className="text-[10px] opacity-60 break-all">{source.uri}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
