
import React from 'react';

interface FormattedTextProps {
  text: string;
  className?: string;
  searchQuery?: string;
}

export const FormattedText: React.FC<FormattedTextProps> = ({ text, className = '', searchQuery = '' }) => {
  if (!text) return null;

  const highlightText = (htmlContent: string) => {
    if (!searchQuery || searchQuery.trim() === '') return htmlContent;
    const safeQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${safeQuery})(?![^<]*>)`, 'gi');
    return htmlContent.replace(regex, '<mark class="bg-emerald-400 text-emerald-950 rounded px-1.5 py-0.5 font-black ring-2 ring-emerald-500/30 shadow-[0_0_12px_rgba(52,211,153,0.4)] transition-all animate-pulse-subtle">$1</mark>');
  };

  const parseInline = (line: string) => {
    let formatted = line
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\$([^\$]+)\$/g, '<code class="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-mono text-xs border border-emerald-100">$1</code>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-stone-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic opacity-90">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-stone-100 px-1.5 py-0.5 rounded text-emerald-700 font-mono text-xs border border-stone-200">$1</code>');
    return highlightText(formatted);
  };

  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className={`space-y-4 leading-relaxed ${className}`}>
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
          const lang = match ? match[1] : '';
          const code = match ? match[2] : part.replace(/```/g, '');
          const escapedCode = code.trim().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          const highlightedCode = highlightText(escapedCode);
          return (
            <div key={index} className="my-6 rounded-2xl overflow-hidden border border-emerald-950 shadow-2xl bg-[#0d1117]">
              <div className="flex items-center justify-between px-5 py-3 bg-[#161b22] border-b border-white/5">
                 <span className="text-[10px] text-stone-500 font-black uppercase tracking-widest">{lang || 'Code'}</span>
              </div>
              <pre className="p-6 overflow-x-auto text-sm font-mono leading-relaxed text-emerald-100 custom-scrollbar">
                <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
              </pre>
            </div>
          );
        }
        const blocks = part.split(/\n\n+/);
        return blocks.map((block, bIndex) => {
          const trimmed = block.trim();
          if (!trimmed) return null;
          if (trimmed.match(/^#{1,3}\s/)) {
             const level = trimmed.match(/^(#{1,3})\s/)?.[1].length || 1;
             const content = trimmed.replace(/^#{1,3}\s/, '');
             const HeaderTag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4';
             const classes = level === 1 ? 'text-3xl font-black mt-10 mb-5 tracking-tight text-emerald-950' 
                           : level === 2 ? 'text-2xl font-bold mt-8 mb-4 text-emerald-900' : 'text-xl font-bold mt-6 mb-3 text-emerald-800';
             return React.createElement(HeaderTag, { key: `${index}-${bIndex}`, className: classes, dangerouslySetInnerHTML: { __html: parseInline(content) } });
          }
          if (trimmed.match(/^[\*\-]\s/m)) {
            const items = trimmed.split(/\n/).filter(l => l.trim().match(/^[\*\-]\s/));
            return (
              <ul key={`${index}-${bIndex}`} className="space-y-3 my-4 pl-4">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start group">
                    <span className="mt-2.5 mr-4 flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform"></span>
                    <span className="text-base" dangerouslySetInnerHTML={{ __html: parseInline(item.replace(/^[\*\-]\s/, '')) }} />
                  </li>
                ))}
              </ul>
            );
          }
          return (
            <p key={`${index}-${bIndex}`} className="mb-4 text-base md:text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: parseInline(trimmed) }} />
          );
        });
      })}
    </div>
  );
};
