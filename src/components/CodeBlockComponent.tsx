import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { LanguageSelector } from './LanguageSelector';

export default ({ node, updateAttributes }: any) => {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCopy = () => {
    const code = node.textContent;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <NodeViewWrapper
      className="code-block-wrapper relative group my-6 rounded-lg overflow-hidden"
      style={{ backgroundColor: 'var(--code-block-bg)', border: '1px solid var(--window-border)' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Language Selector - Top Left */}
      <div
        className="absolute top-2.5 left-3 z-10 transition-opacity duration-200"
        style={{ opacity: isHovered ? 1 : 0, pointerEvents: isHovered ? 'auto' : 'none' }}
      >
        <LanguageSelector
          language={node.attrs.language}
          onChange={(lang) => updateAttributes({ language: lang === 'auto' ? null : lang })}
        />
      </div>

      {/* Copy Button - Top Right */}
      <button
        onClick={handleCopy}
        className="absolute top-2.5 right-3 z-10 transition-opacity duration-200 p-1.5 rounded-md hover:bg-white/20 text-gray-400 hover:text-gray-200"
        style={{ opacity: isHovered ? 1 : 0, pointerEvents: isHovered ? 'auto' : 'none' }}
        title="Copy code"
      >
        {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
      </button>

      <pre
        spellCheck={false}
        className="m-0 font-mono text-sm overflow-x-auto"
        style={{
          padding: isHovered ? '48px 16px 12px 16px' : '12px 16px',
          transition: 'padding 200ms ease',
          background: 'transparent'
        }}
      >
        <NodeViewContent {...({ as: 'code', spellCheck: false } as any)} />
      </pre>
    </NodeViewWrapper>
  );
};
