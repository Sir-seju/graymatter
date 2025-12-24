import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { LanguageSelector } from './LanguageSelector';

export default ({ node, updateAttributes }: any) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const code = node.textContent;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <NodeViewWrapper className="code-block-wrapper relative group my-4 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      {/* Language Selector - Top Left */}
      <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <LanguageSelector
          language={node.attrs.language}
          onChange={(lang) => updateAttributes({ language: lang === 'auto' ? null : lang })}
        />
      </div>

      {/* Copy Button - Top Right */}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-gray-200 dark:bg-gray-800 text-gray-500 hover:text-gray-800 dark:text-gray-300 rounded-md shadow-sm border border-gray-300 dark:border-gray-600"
        title="Copy code"
      >
        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
      </button>

      <pre spellCheck={false} className="m-0 p-4 font-mono text-sm overflow-x-auto">
        <NodeViewContent {...({ as: 'code', spellCheck: false } as any)} />
      </pre>
    </NodeViewWrapper>
  );
};
