import React from 'react';

interface StatusPillProps {
  themeName: string;
  wordCount: number;
  lineCount?: number;
  cursorPosition?: { line: number; col: number };
  onThemeClick: () => void;
  onSourceClick: () => void;
}

const StatusPill: React.FC<StatusPillProps> = ({
  themeName,
  wordCount,
  lineCount = 0,
  cursorPosition,
  onThemeClick,
  onSourceClick
}) => {
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
        className="px-2 py-0.5 rounded hover:opacity-100 opacity-70 transition-opacity uppercase tracking-wide cursor-pointer"
        style={{ backgroundColor: 'var(--primary-color)', color: '#fff' }}
        title="Click to change theme"
      >
        {themeName}
      </button>
      <span style={{ color: 'var(--window-border)' }}>|</span>
      <button
        onClick={(e) => { e.stopPropagation(); onSourceClick(); }}
        className="px-2 py-0.5 rounded hover:opacity-100 opacity-70 transition-opacity cursor-pointer"
        style={{ backgroundColor: 'var(--primary-color)', color: '#fff' }}
        title="Toggle source mode"
      >
        ⌘⇧U
      </button>
      <span style={{ color: 'var(--window-border)' }}>|</span>
      <span className="opacity-70">{wordCount} words</span>
      <span style={{ color: 'var(--window-border)' }}>|</span>
      <span className="opacity-70">{lineCount} lines</span>
      {cursorPosition && (
        <>
          <span style={{ color: 'var(--window-border)' }}>|</span>
          <span className="opacity-70">Ln {cursorPosition.line}, Col {cursorPosition.col}</span>
        </>
      )}
    </div>
  );
};

export default StatusPill;
