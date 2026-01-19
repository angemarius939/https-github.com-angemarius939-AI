
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

  const renderTable = (lines: string[]) => {
    const rows = lines.map(line => {
      const cells = line.split('|').filter((c, i, arr) => {
        if (i === 0 && c.trim() === '') return false;
        if (i === arr.length - 1 && c.trim() === '') return false;
        return true;
      });
      return cells.map(c => c.trim());
    });

    if (rows.length < 2) return null;

    // Filter out separator row (e.g., |---|---|)
    const headerRow = rows[0];
    const dataRows = rows.slice(2);

    return (
      <div className="my-6 overflow-x-auto rounded-xl border border-emerald-100 shadow-sm">
        <table className="min-w-full divide-y divide-emerald-100">
          <thead className="bg-emerald-50">
            <tr>
              {headerRow.map((cell, i) => (
                <th key={i} className="px-4 py-3 text-left text-xs font-black text-emerald-900 uppercase tracking-widest">
                  <span dangerouslySetInnerHTML={{ __html: parseInline(cell) }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-stone-50">
            {dataRows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-3 text-sm text-stone-700 font-medium">
                    <span dangerouslySetInnerHTML={{ __html: parseInline(cell) }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
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

        // Process line by line to detect tables
        const lines = part.split('\n');
        const finalElements: React.ReactNode[] = [];
        let tableBuffer: string[] = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.includes('|') && (line.startsWith('|') || line.endsWith('|') || (lines[i+1] && lines[i+1].includes('|--')))) {
            tableBuffer.push(lines[i]);
          } else {
            if (tableBuffer.length > 0) {
              finalElements.push(renderTable(tableBuffer));
              tableBuffer = [];
            }
            if (line) {
              const trimmed = line;
              if (trimmed.match(/^#{1,3}\s/)) {
                 const level = trimmed.match(/^(#{1,3})\s/)?.[1].length || 1;
                 const content = trimmed.replace(/^#{1,3}\s/, '');
                 const HeaderTag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4';
                 const classes = level === 1 ? 'text-3xl font-black mt-10 mb-5 tracking-tight text-emerald-950' 
                               : level === 2 ? 'text-2xl font-bold mt-8 mb-4 text-emerald-900' : 'text-xl font-bold mt-6 mb-3 text-emerald-800';
                 finalElements.push(React.createElement(HeaderTag, { key: `h-${i}`, className: classes, dangerouslySetInnerHTML: { __html: parseInline(content) } }));
              } else if (trimmed.match(/^[\*\-]\s/)) {
                 finalElements.push(
                  <div key={`li-${i}`} className="flex items-start group my-1 ml-4">
                    <span className="mt-2.5 mr-4 flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform"></span>
                    <span className="text-base" dangerouslySetInnerHTML={{ __html: parseInline(trimmed.replace(/^[\*\-]\s/, '')) }} />
                  </div>
                 );
              } else {
                finalElements.push(<p key={`p-${i}`} className="mb-4 text-base md:text-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: parseInline(trimmed) }} />);
              }
            }
          }
        }
        if (tableBuffer.length > 0) {
          finalElements.push(renderTable(tableBuffer));
        }

        return <React.Fragment key={index}>{finalElements}</React.Fragment>;
      })}
    </div>
  );
};
