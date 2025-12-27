import {
  Check, ChevronDown,
  Code, Database,
  FileCode, FileJson, FileType2,
  Globe,
  Hash,
  Layout,
  Search,
  Server, Settings,
  Terminal
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface LanguageSelectorProps {
  language: string | null;
  onChange: (lang: string) => void;
}

// Icon Mapping - Vibrant Colors
const getIcon = (lang: string) => {
  const l = lang?.toLowerCase() || '';
  if (['bash', 'shell', 'zsh', 'sh', 'powershell', 'dockerfile', 'makefile'].includes(l)) return <Terminal size={14} className="text-gray-500 dark:text-gray-400" />;
  if (['javascript', 'js', 'typescript', 'ts', 'jsx', 'tsx', 'vue', 'svelte'].includes(l)) return <FileCode size={14} className="text-yellow-500 dark:text-yellow-400" />;
  if (['html', 'xml', 'svg'].includes(l)) return <Globe size={14} className="text-orange-500 dark:text-orange-400" />;
  if (['css', 'scss', 'less', 'sass'].includes(l)) return <Layout size={14} className="text-blue-500 dark:text-blue-400" />;
  if (['json', 'yaml', 'yml', 'toml'].includes(l)) return <FileJson size={14} className="text-green-500 dark:text-green-400" />;
  if (['python', 'py'].includes(l)) return <FileType2 size={14} className="text-blue-400 dark:text-blue-300" />;
  if (['java', 'kotlin', 'c', 'cpp', 'csharp', 'go', 'rust', 'swift'].includes(l)) return <Code size={14} className="text-purple-500 dark:text-purple-400" />;
  if (['sql', 'mysql', 'postgres'].includes(l)) return <Database size={14} className="text-indigo-400 dark:text-indigo-300" />;
  if (['php', 'ruby', 'perl', 'lua'].includes(l)) return <Server size={14} className="text-red-400 dark:text-red-300" />;
  if (['markdown', 'md'].includes(l)) return <Hash size={14} className="text-gray-400 dark:text-gray-300" />;
  if (['ini', 'conf', 'config'].includes(l)) return <Settings size={14} className="text-gray-400 dark:text-gray-300" />;
  return <FileCode size={14} className="text-gray-400 dark:text-gray-500" />;
};

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
      {/* Trigger Button - Clean Look */}
      <button
        contentEditable={false}
        onClick={toggle}
        className="flex items-center gap-2 px-2 py-1 rounded bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-700 backdrop-blur border border-gray-200 dark:border-gray-600 transition-all shadow-sm text-xs text-gray-700 dark:text-gray-200"
        title="Change Language"
      >
        {getIcon(displayLang)}
        <span className="font-medium min-w-[3ch]">{displayLang}</span>
        <ChevronDown size={10} className="opacity-50" />
      </button>

      {/* Dropdown Menu - Increased Height & Better Styling */}
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

          {/* List - Larger Height (250px) */}
          <div className="max-h-[250px] overflow-y-auto overflow-x-hidden p-1 custom-scrollbar">
            {/* Auto Option */}
            <div
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded cursor-pointer text-xs transition-colors ${language === null ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'}`}
              onClick={() => { onChange('auto'); setIsOpen(false); }}
            >
              <Terminal size={14} className="opacity-50" />
              <span className="flex-1">auto</span>
              {language === null && <Check size={12} className="text-blue-500" />}
            </div>

            {filtered.map(lang => (
              <div
                key={lang}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded cursor-pointer text-xs transition-colors ${language === lang ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'}`}
                onClick={() => { onChange(lang); setIsOpen(false); }}
              >
                {getIcon(lang)}
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
