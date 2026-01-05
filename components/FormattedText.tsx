
import React from 'react';

interface FormattedTextProps {
  text: string;
  className?: string;
  searchQuery?: string;
}

export const FormattedText: React.FC<FormattedTextProps> = ({ text, className = '', searchQuery = '' }) => {
  if (!text) return null;

  const highlightText = (htmlContent: string) => {
    if (!searchQuery) return htmlContent;
    const safeQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${safeQuery})`, 'gi');
    return htmlContent.replace(regex, '<mark class="bg-yellow-200 text-stone-900 rounded-sm px-0.5">$1</mark>');
  };

  const parseInline = (line: string) => {
    let formatted = line
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      // LaTeX Math support: Inline $math$
      .replace(/\$([^\$]+)\$/g, '<code class="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-mono text-xs border border-emerald-100">$1</code>')
      // Bold **text**
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-emerald-900">$1</strong>')
      // Italic *text*
      .replace(/\*(.*?)\*/g, '<em class="italic text-stone-700">$1</em>')
      // Inline Code `text`
      .replace(/`([^`]+)`/g, '<code class="bg-stone-100 px-1.5 py-0.5 rounded text-emerald-700 font-mono text-xs border border-stone-200">$1</code>');
    
    return highlightText(formatted);
  };

  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className={`space-y-4 text-stone-800 leading-relaxed ${className}`}>
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
          const lang = match ? match[1] : '';
          const code = match ? match[2] : part.replace(/```/g, '');
          return (
            <div key={index} className="my-6 rounded-2xl overflow-hidden border border-emerald-950 shadow-2xl bg-[#0d1117]">
              <div className="flex items-center justify-between px-5 py-3 bg-[#161b22] border-b border-white/5">
                 <span className="text-[10px] text-stone-500 font-black uppercase tracking-widest">{lang || 'Code'}</span>
                 <div className="flex gap-2">
                   <div className="w-3 h-3 rounded-full bg-red-500/30"></div>
                   <div className="w-3 h-3 rounded-full bg-yellow-500/30"></div>
                   <div className="w-3 h-3 rounded-full bg-emerald-500/30"></div>
                 </div>
              </div>
              <pre className="p-6 overflow-x-auto text-sm font-mono leading-relaxed text-emerald-100 custom-scrollbar">
                <code>{code.trim()}</code>
              </pre>
            </div>
          );
        }

        const blocks = part.split(/\n\n+/);

        return blocks.map((block, bIndex) => {
          const trimmed = block.trim();
          if (!trimmed) return null;

          // Math Block ($$ ... $$)
          if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
            const math = trimmed.slice(2, -2).trim();
            return (
              <div key={`${index}-${bIndex}`} className="my-6 p-6 bg-emerald-50 border-2 border-emerald-100 rounded-3xl text-center shadow-inner">
                <code className="text-lg md:text-xl font-mono text-emerald-900 font-bold block overflow-x-auto custom-scrollbar">
                  {math}
                </code>
                <p className="text-[10px] uppercase font-black tracking-widest text-emerald-600 mt-4 opacity-50">Scientific Logic</p>
              </div>
            );
          }

          if (trimmed.match(/^#{1,3}\s/)) {
             const level = trimmed.match(/^(#{1,3})\s/)?.[1].length || 1;
             const content = trimmed.replace(/^#{1,3}\s/, '');
             const HeaderTag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4';
             const classes = level === 1 ? 'text-3xl font-black text-emerald-950 mt-10 mb-5 tracking-tight' 
                           : level === 2 ? 'text-2xl font-bold text-emerald-900 mt-8 mb-4'
                           : 'text-xl font-bold text-emerald-800 mt-6 mb-3';
             
             return React.createElement(HeaderTag, {
                key: `${index}-${bIndex}`,
                className: classes,
                dangerouslySetInnerHTML: { __html: parseInline(content) }
             });
          }

          if (trimmed.match(/^[\*\-]\s/m)) {
            const items = trimmed.split(/\n/).filter(l => l.trim().match(/^[\*\-]\s/));
            return (
              <ul key={`${index}-${bIndex}`} className="space-y-3 my-4 pl-4">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start text-stone-700 group">
                    <span className="mt-2.5 mr-4 flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform"></span>
                    <span className="text-base" dangerouslySetInnerHTML={{ __html: parseInline(item.replace(/^[\*\-]\s/, '')) }} />
                  </li>
                ))}
              </ul>
            );
          }

          if (trimmed.match(/^\d+\.\s/m)) {
            const items = trimmed.split(/\n/).filter(l => l.trim().match(/^\d+\.\s/));
            return (
              <ol key={`${index}-${bIndex}`} className="list-decimal ml-8 space-y-3 my-4 marker:text-emerald-600 marker:font-black text-base">
                {items.map((item, i) => (
                  <li key={i} className="pl-2 text-stone-700" dangerouslySetInnerHTML={{ __html: parseInline(item.replace(/^\d+\.\s/, '')) }} />
                ))}
              </ol>
            );
          }

          if (trimmed.includes('|') && trimmed.split('\n').length > 1) {
             const allRows = trimmed.split('\n').filter(r => r.trim());
             const headerRowString = allRows[0];
             const headerCols = headerRowString.split('|').filter(c => c.trim() !== '');
             const separatorIndex = allRows.findIndex((r, i) => i > 0 && r.match(/^\|?[\s-]+\|?$/));
             const bodyRows = allRows.filter((r, i) => {
                if (i === 0 || i === separatorIndex) return false;
                if (r.replace(/[\s\|-]/g, '') === '') return false;
                return true;
             });

             return (
               <div key={`${index}-${bIndex}`} className="my-8 w-full overflow-hidden rounded-3xl border border-stone-200 shadow-xl bg-white">
                 <div className="overflow-x-auto custom-scrollbar">
                   <table className="min-w-full text-left text-sm">
                     <thead>
                       <tr className="bg-emerald-950">
                         {headerCols.map((c, hIdx) => (
                           <th key={hIdx} className="px-8 py-5 text-[10px] font-black text-emerald-100 uppercase tracking-widest whitespace-nowrap border-r border-emerald-900/50 last:border-0">
                             <span dangerouslySetInnerHTML={{ __html: parseInline(c.trim()) }} />
                           </th>
                         ))}
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-stone-100">
                       {bodyRows.map((row, rIdx) => {
                         const cols = row.split('|').filter((c, i, arr) => {
                            if (i === 0 && c.trim() === '') return false;
                            if (i === arr.length - 1 && c.trim() === '') return false;
                            return true;
                         });
                         return (
                           <tr key={rIdx} className="hover:bg-emerald-50/30 transition-colors even:bg-stone-50/50">
                             {cols.map((c, cIdx) => (
                               <td key={cIdx} className="px-8 py-5 text-stone-600 font-medium border-r border-stone-100/50 last:border-0">
                                 <span dangerouslySetInnerHTML={{ __html: parseInline(c.trim()) }} />
                               </td>
                             ))}
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                 </div>
               </div>
             );
          }

          return (
            <p key={`${index}-${bIndex}`} className="mb-4 text-base md:text-lg leading-relaxed text-stone-700" dangerouslySetInnerHTML={{ __html: parseInline(trimmed) }} />
          );
        });
      })}
    </div>
  );
};
