import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import katex from 'katex';
import { useEffect, useState } from 'react';

export default ({ node, selected, getPos, editor }: any) => {
  const latex = node.textContent || '';
  const [html, setHtml] = useState('');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    try {
      const rendered = katex.renderToString(latex, {
        throwOnError: false,
        displayMode: false,
      });
      setHtml(rendered);
      setHasError(false);
    } catch (e) {
      setHasError(true);
      setHtml('');
    }
  }, [latex]);

  const isEditing = selected;

  const handleClick = (e: React.MouseEvent) => {
    // If clicking preview, switch to edit mode
    if (!isEditing && typeof getPos === 'function') {
      // Set selection inside the node to trigger isEditing=true
      editor.commands.setTextSelection(getPos() + 1);
    }
  };

  return (
    <NodeViewWrapper as="span" className={`inline-math-node rounded px-0.5 transition-colors ${selected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>

      {/* SOURCE VIEW: $ content $ */}
      <span className={isEditing ? 'inline font-mono text-blue-600 dark:text-blue-400' : 'hidden'}>
        <span>$</span>
        <NodeViewContent as="span" className="outline-none" />
        <span>$</span>
      </span>

      {/* PREVIEW VIEW: Rendered Math */}
      <span
        className={`${!isEditing ? 'inline' : 'hidden'} cursor-pointer`}
        onClick={handleClick}
        contentEditable={false} // Important so Tiptap treats it as a single unit when navigating
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Error View */}
      {hasError && !isEditing && (
        <span className="text-red-500 text-xs">&lt;Invalid Math&gt;</span>
      )}
    </NodeViewWrapper>
  );
};
