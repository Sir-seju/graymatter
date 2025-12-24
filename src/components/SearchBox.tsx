
import { ArrowDown, ArrowUp, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface SearchBoxProps {
  onSearch: (term: string) => void;
  onClose: () => void;
  onNext?: () => void; // Placeholder
  onPrev?: () => void; // Placeholder
}

export default function SearchBox({ onSearch, onClose, onNext, onPrev }: SearchBoxProps) {
  const [term, setTerm] = useState('');
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
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        onPrev?.();
      } else {
        onNext?.();
      }
    }
  };

  return (
    <div className="absolute top-1 right-20 z-30 flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md rounded-md p-1">
      <input
        ref={inputRef}
        className="text-sm bg-transparent border-none outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 px-2 py-1 min-w-[150px]"
        placeholder="Find..."
        value={term}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <div className="flex items-center text-gray-500 border-l border-gray-200 dark:border-gray-700 pl-1 ml-1">
        <button onClick={onPrev} className="p-1 hover:text-gray-800 dark:hover:text-gray-200" title="Previous (Shift+Enter)">
          <ArrowUp size={14} />
        </button>
        <button onClick={onNext} className="p-1 hover:text-gray-800 dark:hover:text-gray-200" title="Next (Enter)">
          <ArrowDown size={14} />
        </button>
        <button onClick={onClose} className="p-1 hover:text-red-500 ml-1" title="Close (Esc)">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
