import {
  Check, ChevronDown,
  Search
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface LanguageSelectorProps {
  language: string | null;
  onChange: (lang: string) => void;
}

// Vibrant SVG Icons for each language category
const LanguageIcon = ({ lang, size = 12 }: { lang: string; size?: number }) => {
  const l = lang?.toLowerCase() || '';

  // JavaScript/TypeScript - Yellow/Blue
  if (['javascript', 'js'].includes(l)) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#F7DF1E"/>
        <path d="M12 17.5c0-1.5.9-2.3 2.2-2.3.8 0 1.4.4 1.7 1l-1 .6c-.2-.3-.4-.5-.7-.5-.4 0-.7.3-.7 1v2.7h-1.5V17.5z" fill="#323330"/>
        <path d="M17.2 19.8c-.5.5-1.2.7-2 .7-1.6 0-2.6-1-2.6-2.3 0-1.2.7-2 1.6-2.4l.9.8c-.6.3-.9.7-.9 1.3 0 .6.4 1 1 1 .4 0 .7-.1 1-.4l1 1.3z" fill="#323330"/>
      </svg>
    );
  }
  if (['typescript', 'ts', 'tsx'].includes(l)) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#3178C6"/>
        <path d="M6 12h5v1.5H9.5v5H8v-5H6V12zm6.5 0h2.2c.8 0 1.4.2 1.8.5.4.4.6.9.6 1.5 0 .5-.2 1-.5 1.3-.3.3-.8.5-1.4.6l2.3 2.6h-2l-2-2.3v2.3h-1.5V12h.5z" fill="white"/>
      </svg>
    );
  }

  // Python - Blue/Yellow
  if (['python', 'py'].includes(l)) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2C8.1 2 8.5 3.6 8.5 3.6v3.1h3.7v1H5.9S2 7.2 2 12c0 4.8 3.4 4.6 3.4 4.6h2v-2.2s-.1-3.4 3.4-3.4h3.7s3.3.1 3.3-3.2V4.3S18.4 2 12 2zm-2.2 1.3a1 1 0 110 2 1 1 0 010-2z" fill="#3776AB"/>
        <path d="M12 22c3.9 0 3.5-1.6 3.5-1.6v-3.1h-3.7v-1h6.3S22 16.8 22 12c0-4.8-3.4-4.6-3.4-4.6h-2v2.2s.1 3.4-3.4 3.4H9.5s-3.3-.1-3.3 3.2v3.5S5.6 22 12 22zm2.2-1.3a1 1 0 110-2 1 1 0 010 2z" fill="#FFD43B"/>
      </svg>
    );
  }

  // HTML - Orange
  if (['html', 'xml', 'svg'].includes(l)) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M3 2l1.6 18L12 22l7.4-2L21 2H3z" fill="#E44D26"/>
        <path d="M12 4v16l5.5-1.5L19 4H12z" fill="#F16529"/>
        <path d="M7 7h10l-.3 3H10l.2 2h6.2l-.5 5-3.9 1-3.9-1-.2-3h2l.1 1.5 2 .5 2-.5.2-2H7.3L7 7z" fill="white"/>
      </svg>
    );
  }

  // CSS - Blue
  if (['css', 'scss', 'less', 'sass'].includes(l)) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M3 2l1.6 18L12 22l7.4-2L21 2H3z" fill="#1572B6"/>
        <path d="M12 4v16l5.5-1.5L19 4H12z" fill="#33A9DC"/>
        <path d="M7 7h10l-.2 2H9.3l.2 2h7l-.6 6-3.9 1-3.9-1-.2-2h2l.1 1 2 .5 2-.5.2-2H7.5L7 7z" fill="white"/>
      </svg>
    );
  }

  // JSON/YAML - Green
  if (['json', 'yaml', 'yml', 'toml'].includes(l)) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="3" fill="#6B8E23"/>
        <path d="M7 8c0-1.7 1.3-2 2-2v1c-.4 0-1 .2-1 1v2c0 .8-.5 1.2-1 1.5.5.3 1 .7 1 1.5v2c0 .8.6 1 1 1v1c-.7 0-2-.3-2-2v-2c0-.6-.4-1-1-1v-1c.6 0 1-.4 1-1V8z" fill="white"/>
        <path d="M17 8c0-1.7-1.3-2-2-2v1c.4 0 1 .2 1 1v2c0 .8.5 1.2 1 1.5-.5.3-1 .7-1 1.5v2c0 .8-.6 1-1 1v1c.7 0 2-.3 2-2v-2c0-.6.4-1 1-1v-1c-.6 0-1-.4-1-1V8z" fill="white"/>
      </svg>
    );
  }

  // Shell/Bash - Green Terminal
  if (['bash', 'shell', 'zsh', 'sh', 'powershell'].includes(l)) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="3" width="20" height="18" rx="2" fill="#2E3436"/>
        <path d="M6 9l3 3-3 3" stroke="#4EC9B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M11 15h6" stroke="#4EC9B0" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
  }

  // Docker - Blue
  if (l === 'dockerfile') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M13.98 11.08h2.12v1.93h-2.12v-1.93zm-2.6 0h2.12v1.93h-2.12v-1.93zm-2.6 0h2.12v1.93H8.78v-1.93zm-2.6 0h2.12v1.93H6.18v-1.93zm2.6-2.4h2.12v1.93H8.78V8.68zm2.6 0h2.12v1.93h-2.12V8.68zm2.6 0h2.12v1.93h-2.12V8.68zm-2.6-2.4h2.12v1.93h-2.12V6.28zm2.6 0h2.12v1.93h-2.12V6.28z" fill="#0db7ed"/>
        <path d="M23.18 11.3c-.53-.36-1.74-.49-2.67-.31-.12-.88-.62-1.64-1.52-2.33l-.52-.36-.36.52c-.46.7-.73 1.66-.65 2.6.03.35.15.98.52 1.53-.36.2-1.08.47-2.03.45H.69l-.03.23c-.17 1.19.05 4.18 2.05 6.6 1.52 1.85 3.79 2.79 6.74 2.79 6.42 0 11.18-2.96 13.42-8.34.88.02 2.77.01 3.74-1.85.03-.05.1-.17.29-.57l.11-.24-.52-.36z" fill="#0db7ed"/>
      </svg>
    );
  }

  // Java - Red/Blue
  if (['java', 'kotlin'].includes(l)) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M8.9 18.6s-1 .6.7.8c2 .2 3.1.2 5.3-.2 0 0 .6.4 1.4.7-5 2.1-11.3-.1-7.4-1.3z" fill="#E76F00"/>
        <path d="M8.2 16s-1.1.8.6.9c2.2.2 3.9.2 6.9-.3 0 0 .4.4 1 .6-6 1.8-12.7.1-8.5-1.2z" fill="#E76F00"/>
        <path d="M13.5 11.5c1.2 1.4-.3 2.6-.3 2.6s3.1-1.6 1.7-3.6c-1.3-1.9-2.4-2.8 3.2-6 0 0-8.6 2.2-4.6 7z" fill="#E76F00"/>
        <path d="M19 19.9s.7.6-.8 1.1c-2.9.9-12 1.2-14.5 0-.9-.4.8-1 1.3-1.1.6-.1.9-.1.9-.1-1-.7-6.7 1.4-2.9 2 10.5 1.7 19.2-.7 16-1.9z" fill="#5382A1"/>
        <path d="M9.3 13s-4.8 1.1-1.7 1.5c1.3.2 3.9.1 6.3-.1 2-.1 4-.4 4-.4s-.7.3-1.2.6c-4.9 1.3-14.3.7-11.6-.6 2.3-1.1 4.2-1 4.2-1z" fill="#5382A1"/>
        <path d="M17.2 17.5c5-2.6 2.7-5.1 1.1-4.8-.4.1-.6.2-.6.2s.2-.2.5-.3c3.5-1.2 6.2 3.7-1 5.6 0 0 .1-.1 0-.7z" fill="#5382A1"/>
      </svg>
    );
  }

  // Go - Cyan
  if (l === 'go') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M2.8 10.5s-.1 0-.1-.1c0-.1 0-.1.1-.1h3.8c.1 0 .1 0 .1.1s0 .1-.1.1H2.8z" fill="#00ACD7"/>
        <path d="M4.3 9.2s-.1 0 0-.1l1.6-1.3c.1-.1.2-.1.2 0 .1 0 .1.1 0 .2L4.5 9.3c-.1 0-.2 0-.2-.1z" fill="#00ACD7"/>
        <path d="M6.2 10.5s-.1 0 0-.1l1.4-1.1c.1-.1.2-.1.2 0 .1 0 .1.1 0 .2l-1.4 1.1c-.1 0-.2 0-.2-.1z" fill="#00ACD7"/>
        <path d="M18.5 7.3c-.2-.1-.3-.2-.5-.2H9.4c-.3 0-.5.2-.5.5v8.8c0 .3.2.5.5.5h8.6c.2 0 .3-.1.5-.2.1-.1.2-.3.2-.5V7.8c0-.2-.1-.4-.2-.5zm-7.4 6.5c-.7 0-1.3-.6-1.3-1.3s.6-1.3 1.3-1.3 1.3.6 1.3 1.3-.6 1.3-1.3 1.3zm5.4 0c-.7 0-1.3-.6-1.3-1.3s.6-1.3 1.3-1.3 1.3.6 1.3 1.3-.6 1.3-1.3 1.3z" fill="#00ACD7"/>
      </svg>
    );
  }

  // Rust - Orange/Black
  if (l === 'rust') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#DEA584"/>
        <path d="M12 4a8 8 0 100 16 8 8 0 000-16zm0 14.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13z" fill="#000"/>
        <circle cx="12" cy="5" r="1" fill="#000"/>
        <path d="M8 9h8M8 12h8M8 15h5" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    );
  }

  // C/C++ - Blue
  if (['c', 'cpp', 'csharp'].includes(l)) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#00599C"/>
        <path d="M15.5 8.5L12 5l-3.5 3.5M8.5 8.5L12 12l3.5-3.5" stroke="white" strokeWidth="2"/>
        <text x="12" y="18" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
          {l === 'cpp' ? '++' : l === 'csharp' ? '#' : 'C'}
        </text>
      </svg>
    );
  }

  // Ruby - Red
  if (['ruby', 'rb'].includes(l)) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M20.2 18.8L7.6 21.6 3 3.8l4.8-.6L20.2 18.8z" fill="#CC342D"/>
        <path d="M20.2 18.8L7.6 21.6l8-8.6 4.6 5.8z" fill="#B22A24"/>
        <path d="M7.6 21.6L3 3.8 15.6 13l-8 8.6z" fill="#E35B4E"/>
      </svg>
    );
  }

  // PHP - Purple
  if (l === 'php') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <ellipse cx="12" cy="12" rx="10" ry="6" fill="#777BB4"/>
        <path d="M7 10h1.5l.5 2h1l-.5-2h1l.7 3.5h-1l-.2-1h-1l-.2 1H7.5L7 10z" fill="white"/>
        <path d="M12 10h1.5c1 0 1.5.5 1.5 1.2 0 .7-.5 1.3-1.5 1.3h-.5l-.2 1H12l.2-1-.2-2.5zm.8 1l.2 1h.5c.3 0 .5-.2.5-.5s-.2-.5-.5-.5h-.7z" fill="white"/>
      </svg>
    );
  }

  // SQL - Orange Database
  if (['sql', 'mysql', 'postgres', 'postgresql'].includes(l)) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <ellipse cx="12" cy="6" rx="8" ry="3" fill="#F29111"/>
        <path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" stroke="#F29111" strokeWidth="2"/>
        <ellipse cx="12" cy="12" rx="8" ry="3" fill="none" stroke="#F29111" strokeWidth="2"/>
      </svg>
    );
  }

  // Swift - Orange
  if (l === 'swift') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="5.5" fill="#F05138"/>
        <path d="M16.5 17c-3-1-5.5-4-7.5-6.5 3 2 5.5 3 7 3.5-2.5-2.5-4.5-5.5-5.5-8 2 2.5 4.5 4.5 7 6-1.5-2-2-4.5-2-6 2 3 3.5 6 4 8 .5-1 1-2 1-3.5 0 3.5-1.5 5.5-4 6.5z" fill="white"/>
      </svg>
    );
  }

  // Markdown - Gray
  if (['markdown', 'md'].includes(l)) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="4" width="20" height="16" rx="2" fill="#083FA1"/>
        <path d="M5 16V8h2l2 3 2-3h2v8h-2v-4l-2 3-2-3v4H5z" fill="white"/>
        <path d="M15 12v4h2l2.5-3v3h2v-8h-2v4l-2.5-3H15v3z" fill="white"/>
      </svg>
    );
  }

  // GraphQL - Pink
  if (l === 'graphql') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" fill="#E535AB" fillOpacity="0.2"/>
        <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" stroke="#E535AB" strokeWidth="1.5"/>
        <circle cx="12" cy="3" r="1.5" fill="#E535AB"/>
        <circle cx="20" cy="7.5" r="1.5" fill="#E535AB"/>
        <circle cx="20" cy="16.5" r="1.5" fill="#E535AB"/>
        <circle cx="12" cy="21" r="1.5" fill="#E535AB"/>
        <circle cx="4" cy="16.5" r="1.5" fill="#E535AB"/>
        <circle cx="4" cy="7.5" r="1.5" fill="#E535AB"/>
      </svg>
    );
  }

  // Vue - Green
  if (l === 'vue') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M2 3h4l6 10 6-10h4L12 21 2 3z" fill="#41B883"/>
        <path d="M7 3h3l2 3.5L14 3h3l-5 8.5L7 3z" fill="#35495E"/>
      </svg>
    );
  }

  // React/JSX - Cyan
  if (['jsx', 'react'].includes(l)) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="2" fill="#61DAFB"/>
        <ellipse cx="12" cy="12" rx="10" ry="4" stroke="#61DAFB" strokeWidth="1" fill="none"/>
        <ellipse cx="12" cy="12" rx="10" ry="4" stroke="#61DAFB" strokeWidth="1" fill="none" transform="rotate(60 12 12)"/>
        <ellipse cx="12" cy="12" rx="10" ry="4" stroke="#61DAFB" strokeWidth="1" fill="none" transform="rotate(120 12 12)"/>
      </svg>
    );
  }

  // Default - Generic code icon
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="3" fill="#6B7280"/>
      <path d="M8 8l-3 4 3 4M16 8l3 4-3 4M13 6l-2 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

// Wrapper function for icon (keeps similar API)
const getIcon = (lang: string, size = 12) => <LanguageIcon lang={lang} size={size} />;

const LANGUAGES = [
  'apache', 'bash', 'c', 'cpp', 'csharp', 'css', 'coffeescript', 'diff', 'dockerfile',
  'go', 'graphql', 'haskell', 'html', 'http', 'ini', 'java', 'javascript', 'json',
  'kotlin', 'latex', 'less', 'lua', 'makefile', 'markdown', 'matlab', 'nginx',
  'objectivec', 'perl', 'php', 'powershell', 'python', 'r', 'ruby', 'rust', 'scala',
  'scheme', 'scss', 'shell', 'sql', 'swift', 'terraform', 'typescript', 'vbnet',
  'vue', 'xml', 'yaml'
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ language, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayLang = language || 'auto';

  // Toggle dropdown
  const toggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearch('');
    }
  };

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Filter languages
  const filtered = LANGUAGES.filter(l => l.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        contentEditable={false}
        onClick={toggle}
        className="flex items-center gap-2 px-2 py-1 rounded bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 backdrop-blur border border-gray-200 dark:border-gray-600 transition-all shadow-sm text-xs text-gray-700 dark:text-gray-200"
        title="Change Language"
      >
        {getIcon(displayLang, 14)}
        <span className="font-medium min-w-[3ch]">{displayLang}</span>
        <ChevronDown size={10} className="opacity-50" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          contentEditable={false}
          className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black/5"
        >
          {/* Search Box */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="relative flex items-center">
              <Search size={12} className="absolute left-2.5 text-gray-400" />
              <input
                ref={inputRef}
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-gray-700 rounded outline-none focus:border-blue-500/50 transition-colors text-gray-800 dark:text-gray-200"
                placeholder="Find language..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.stopPropagation()}
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-[250px] overflow-y-auto overflow-x-hidden p-1 custom-scrollbar">
            {/* Auto Option */}
            <div
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded cursor-pointer text-xs transition-colors ${language === null ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'}`}
              onClick={() => { onChange('auto'); setIsOpen(false); }}
            >
              {getIcon('auto', 14)}
              <span className="flex-1">auto</span>
              {language === null && <Check size={12} className="text-blue-500" />}
            </div>

            {filtered.map(lang => (
              <div
                key={lang}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded cursor-pointer text-xs transition-colors ${language === lang ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'}`}
                onClick={() => { onChange(lang); setIsOpen(false); }}
              >
                {getIcon(lang, 14)}
                <span className="flex-1 truncate">{lang}</span>
                {language === lang && <Check size={12} className="text-blue-500" />}
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="px-2 py-8 text-center text-xs text-gray-400 italic">No matches found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
