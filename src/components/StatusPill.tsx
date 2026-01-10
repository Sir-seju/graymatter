import React from 'react';

interface StatusPillProps {
  themeName: string;
  wordCount: number;
  lineCount?: number;
  cursorPosition?: { line: number; col: number };
  selectionStats?: { words: number; chars: number } | null;
  onThemeClick: () => void;
  onSourceClick: () => void;
}

const StatusPill: React.FC<StatusPillProps> = ({
  themeName,
  wordCount,
  lineCount = 0,
  cursorPosition,
  selectionStats,
  onThemeClick,
  onSourceClick
}) => {
  const hasSelection = selectionStats && (selectionStats.words > 0 || selectionStats.chars > 0);

  return (
    <div
      className="fixed bottom-3 right-3 flex items-center rounded-md px-2 py-1 text-[11px] font-medium z-[100] select-none gap-1"
      style={{
        backgroundColor: 'var(--side-bar-bg-color)',
        color: 'var(--control-text-color)',
        border: '1px solid var(--window-border)',
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onThemeClick(); }}
        className="px-2 py-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors uppercase tracking-wide cursor-pointer bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
        title="Click to change theme"
      >
        {themeName}
      </button>
      <span style={{ color: 'var(--window-border)' }}>|</span>
      <button
        onClick={(e) => { e.stopPropagation(); onSourceClick(); }}
        className="px-2 py-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-mono text-xs font-bold"
        title="Toggle source mode"
      >
        ⌘/
      </button>
      <span style={{ color: 'var(--window-border)' }}>|</span>
      {hasSelection ? (
        <span
          className="opacity-90 px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: 'var(--item-hover-bg-color)',
            color: 'var(--text-color)'
          }}
        >
          {selectionStats.words} words selected ({selectionStats.chars} chars)
        </span>
      ) : (
        <>
          <span className="opacity-70">{wordCount} words</span>
          <span style={{ color: 'var(--window-border)' }}>|</span>
          <span className="opacity-70">{lineCount} lines</span>
        </>
      )}
      {cursorPosition && !hasSelection && (
        <>
          <span style={{ color: 'var(--window-border)' }}>|</span>
          <span className="opacity-70">Ln {cursorPosition.line}, Col {cursorPosition.col}</span>
        </>
      )}
    </div>
  );
};

export default StatusPill;
