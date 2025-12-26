
import { ArrowDown, ArrowUp, Replace, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface SearchBoxProps {
  onSearch: (term: string) => void;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onReplace?: (replacement: string) => void;
  onReplaceAll?: (search: string, replacement: string) => void;
}

export default function SearchBox({ onSearch, onClose, onNext, onPrev, onReplace, onReplaceAll }: SearchBoxProps) {
  const [term, setTerm] = useState('');
  const [replacement, setReplacement] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTerm(val);
    onSearch(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
    if (e.key === 'Enter' && !e.shiftKey && !showReplace) {
      onNext?.();
    }
    if (e.key === 'Enter' && e.shiftKey) {
      onPrev?.();
    }
  };

  const handleReplace = () => {
    onReplace?.(replacement);
    onNext?.();
  };

  const handleReplaceAll = () => {
    onReplaceAll?.(term, replacement);
  };

  return (
    <div
      className="absolute top-1 right-20 z-30 flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md p-2 min-w-[280px]"
      style={{ backgroundColor: 'var(--side-bar-bg-color)', borderColor: 'var(--window-border)' }}
    >
      {/* Search row */}
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          className="flex-1 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded outline-none px-2 py-1"
          style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--window-border)' }}
          placeholder="Find..."
          value={term}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        <button onClick={onPrev} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Previous (Shift+Enter)">
          <ArrowUp size={14} />
        </button>
        <button onClick={onNext} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Next (Enter)">
          <ArrowDown size={14} />
        </button>
        <button
          onClick={() => setShowReplace(!showReplace)}
          className={`p-1 rounded ${showReplace ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          title="Toggle Replace"
        >
          <Replace size={14} />
        </button>
        <button onClick={onClose} className="p-1 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-500 rounded" title="Close (Esc)">
          <X size={14} />
        </button>
      </div>

      {/* Replace row */}
      {showReplace && (
        <div className="flex items-center gap-1 mt-2">
          <input
            className="flex-1 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded outline-none px-2 py-1"
            style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--window-border)' }}
            placeholder="Replace with..."
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleReplace();
              if (e.key === 'Escape') onClose();
            }}
          />
          <button
            onClick={handleReplace}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            title="Replace current match"
          >
            Replace
          </button>
          <button
            onClick={handleReplaceAll}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            title="Replace all matches"
          >
            All
          </button>
        </div>
      )}
    </div>
  );
}
