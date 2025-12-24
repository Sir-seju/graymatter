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

// Icon Mapping
const getIcon = (lang: string) => {
  const l = lang?.toLowerCase() || '';
  if (['bash', 'shell', 'zsh', 'sh', 'powershell', 'dockerfile', 'makefile'].includes(l)) return <Terminal size={14} className="text-gray-500" />;
  if (['javascript', 'js', 'typescript', 'ts', 'jsx', 'tsx', 'vue', 'svelte'].includes(l)) return <FileCode size={14} className="text-yellow-500" />;
  if (['html', 'xml', 'svg'].includes(l)) return <Globe size={14} className="text-orange-500" />;
  if (['css', 'scss', 'less', 'sass'].includes(l)) return <Layout size={14} className="text-blue-500" />;
  if (['json', 'yaml', 'yml', 'toml'].includes(l)) return <FileJson size={14} className="text-green-500" />;
  if (['python', 'py'].includes(l)) return <FileType2 size={14} className="text-blue-400" />;
  if (['java', 'kotlin', 'c', 'cpp', 'csharp', 'go', 'rust', 'swift'].includes(l)) return <Code size={14} className="text-purple-500" />;
  if (['sql', 'mysql', 'postgres'].includes(l)) return <Database size={14} className="text-indigo-400" />;
  if (['php', 'ruby', 'perl', 'lua'].includes(l)) return <Server size={14} className="text-red-400" />;
  if (['markdown', 'md'].includes(l)) return <Hash size={14} className="text-gray-400" />;
  if (['ini', 'conf', 'config'].includes(l)) return <Settings size={14} className="text-gray-400" />;
  return <FileCode size={14} className="text-gray-400" />;
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
      {/* Trigger Button */}
      <button
        contentEditable={false} // Crucial: Prevent Tiptap from treating this as editable text content
        onClick={toggle}
        className="flex items-center gap-2 px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm text-xs text-gray-700 dark:text-gray-200"
        title="Change Language"
      >
        {getIcon(displayLang)}
        <span className="font-medium min-w-[3ch]">{displayLang}</span>
        <ChevronDown size={10} className="opacity-50" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          contentEditable={false}
          className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Search Box */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="relative flex items-center">
              <Search size={12} className="absolute left-2 text-gray-400" />
              <input
                ref={inputRef}
                className="w-full pl-7 pr-2 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded outline-none focus:border-blue-400 transition-colors text-gray-800 dark:text-gray-200"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.stopPropagation()} // Stop Tiptap from catching keystrokes
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-48 overflow-y-auto overflow-x-hidden p-1">
            {/* Auto Option */}
            <div
              className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs ${language === null ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              onClick={() => { onChange('auto'); setIsOpen(false); }}
            >
              <Terminal size={14} className="opacity-50" />
              <span className="flex-1">auto</span>
              {language === null && <Check size={12} />}
            </div>

            {filtered.map(lang => (
              <div
                key={lang}
                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs ${language === lang ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                onClick={() => { onChange(lang); setIsOpen(false); }}
              >
                {getIcon(lang)}
                <span className="flex-1 truncate">{lang}</span>
                {language === lang && <Check size={12} />}
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="px-2 py-4 text-center text-xs text-gray-400 italic">No matches</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
