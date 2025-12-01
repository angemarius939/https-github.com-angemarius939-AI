import React from 'react';

interface FormattedTextProps {
  text: string;
  className?: string;
  searchQuery?: string;
}

export const FormattedText: React.FC<FormattedTextProps> = ({ text, className = '', searchQuery = '' }) => {
  if (!text) return null;

  // Helper to highlight text within HTML string
  const highlightText = (htmlContent: string) => {
    if (!searchQuery) return htmlContent;
    // Escape regex special chars
    const safeQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${safeQuery})`, 'gi');
    return htmlContent.replace(regex, '<mark class="bg-yellow-200 text-stone-900 rounded-sm px-0.5">$1</mark>');
  };

  // Inline formatting parser (Bold, Italic, Inline Code)
  const parseInline = (line: string) => {
    let formatted = line
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      // Bold **text**
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-emerald-900">$1</strong>')
      // Italic *text*
      .replace(/\*(.*?)\*/g, '<em class="italic text-stone-700">$1</em>')
      // Inline Code `text`
      .replace(/`([^`]+)`/g, '<code class="bg-stone-100 px-1.5 py-0.5 rounded text-emerald-700 font-mono text-xs border border-stone-200">$1</code>');
    
    return highlightText(formatted);
  };

  // Split content by code blocks first to protect them
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className={`space-y-3 text-stone-800 leading-relaxed ${className}`}>
      {parts.map((part, index) => {
        // Render Code Block
        if (part.startsWith('```')) {
          const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
          const lang = match ? match[1] : '';
          const code = match ? match[2] : part.replace(/```/g, '');
          return (
            <div key={index} className="my-4 rounded-xl overflow-hidden border border-emerald-900/10 shadow-sm bg-[#1e1e1e]">
              <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-white/10">
                 <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">{lang || 'Code'}</span>
                 <div className="flex gap-1.5">
                   <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
                   <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20"></div>
                 </div>
              </div>
              <pre className="p-4 overflow-x-auto text-sm font-mono leading-relaxed text-emerald-50">
                <code>{code.trim()}</code>
              </pre>
            </div>
          );
        }

        // Process other blocks (Paragraphs, Lists, Tables, Headers)
        // Split by double newline to separate paragraphs/blocks
        const blocks = part.split(/\n\n+/);

        return blocks.map((block, bIndex) => {
          const trimmed = block.trim();
          if (!trimmed) return null;

          // Headers (### or ##)
          if (trimmed.match(/^#{1,3}\s/)) {
             const level = trimmed.match(/^(#{1,3})\s/)?.[1].length || 1;
             const content = trimmed.replace(/^#{1,3}\s/, '');
             const HeaderTag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4';
             const classes = level === 1 ? 'text-2xl font-extrabold text-emerald-950 mt-6 mb-3 tracking-tight' 
                           : level === 2 ? 'text-xl font-bold text-emerald-900 mt-5 mb-2.5'
                           : 'text-lg font-bold text-emerald-800 mt-4 mb-2';
             
             return React.createElement(HeaderTag, {
                key: `${index}-${bIndex}`,
                className: classes,
                dangerouslySetInnerHTML: { __html: parseInline(content) }
             });
          }

          // Lists (Unordered) - starts with - or *
          if (trimmed.match(/^[\*\-]\s/m)) {
            const items = trimmed.split(/\n/).filter(l => l.trim().match(/^[\*\-]\s/));
            return (
              <ul key={`${index}-${bIndex}`} className="space-y-2 my-3 pl-2">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start text-stone-700">
                    <span className="mt-1.5 mr-2.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span dangerouslySetInnerHTML={{ __html: parseInline(item.replace(/^[\*\-]\s/, '')) }} />
                  </li>
                ))}
              </ul>
            );
          }

          // Lists (Ordered) - starts with 1.
          if (trimmed.match(/^\d+\.\s/m)) {
            const items = trimmed.split(/\n/).filter(l => l.trim().match(/^\d+\.\s/));
            return (
              <ol key={`${index}-${bIndex}`} className="list-decimal ml-5 space-y-2 my-3 marker:text-emerald-600 marker:font-bold font-medium">
                {items.map((item, i) => (
                  <li key={i} className="pl-2 text-stone-700" dangerouslySetInnerHTML={{ __html: parseInline(item.replace(/^\d+\.\s/, '')) }} />
                ))}
              </ol>
            );
          }

          // Tables (lines containing |)
          if (trimmed.includes('|') && trimmed.split('\n').length > 1) {
             const allRows = trimmed.split('\n').filter(r => r.trim());
             
             // Extract Headers
             const headerRowString = allRows[0];
             const headerCols = headerRowString.split('|').filter(c => c.trim() !== '');
             
             // Identify Separator Row to skip it
             const separatorIndex = allRows.findIndex((r, i) => i > 0 && r.match(/^\|?[\s-]+\|?$/));
             
             // Extract Body
             const bodyRows = allRows.filter((r, i) => {
                if (i === 0) return false; // Skip header
                if (i === separatorIndex) return false; // Skip separator
                // Skip lines that look like separators even if regex failed slightly
                if (r.replace(/[\s\|-]/g, '') === '') return false;
                return true;
             });

             return (
               <div key={`${index}-${bIndex}`} className="my-6 w-full overflow-hidden rounded-xl border border-stone-200 shadow-sm bg-white">
                 <div className="overflow-x-auto custom-scrollbar">
                   <table className="min-w-full text-left text-sm divide-y divide-stone-100">
                     <thead>
                       <tr className="bg-emerald-50/80">
                         {headerCols.map((c, hIdx) => (
                           <th key={hIdx} className="px-6 py-3.5 text-xs font-bold text-emerald-900 uppercase tracking-wider whitespace-nowrap">
                             <span dangerouslySetInnerHTML={{ __html: parseInline(c.trim()) }} />
                           </th>
                         ))}
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-stone-100 bg-white">
                       {bodyRows.map((row, rIdx) => {
                         const cols = row.split('|').filter((c, i, arr) => {
                            // Basic logic to filter leading/trailing pipes if empty
                            if (i === 0 && c.trim() === '') return false;
                            if (i === arr.length - 1 && c.trim() === '') return false;
                            return true;
                         });
                         
                         return (
                           <tr key={rIdx} className="group hover:bg-emerald-50/20 transition-colors duration-150 even:bg-stone-50/30">
                             {cols.map((c, cIdx) => (
                               <td key={cIdx} className="px-6 py-4 text-stone-600 font-medium whitespace-nowrap md:whitespace-normal">
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

          // Regular Paragraph
          return (
            <p key={`${index}-${bIndex}`} className="mb-3 text-base" dangerouslySetInnerHTML={{ __html: parseInline(trimmed) }} />
          );
        });
      })}
    </div>
  );
};