import { NodeViewWrapper } from '@tiptap/react';
import katex from 'katex';
import { useEffect, useRef, useState } from 'react';

export default ({ node, selected, updateAttributes, editor, getPos }: any) => {
  const latex = node.attrs.latex || '';
  const [html, setHtml] = useState('');
  const [hasError, setHasError] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [internalMode, setInternalMode] = useState<'view' | 'edit'>('view');

  // Logic: 
  // If selected via keyboard/click, we might want to enter edit mode? 
  // MarkText behavior: Click -> Edit. Ctrl+Enter or Blur -> View.

  // Effect: Render KaTeX
  useEffect(() => {
    try {
      if (!latex.trim()) {
        setHtml('');
        setHasError(false);
        return;
      }
      const rendered = katex.renderToString(latex, {
        throwOnError: false,
        displayMode: true,
      });
      setHtml(rendered);
      setHasError(false);
    } catch (e) {
      setHasError(true);
      setHtml('');
    }
  }, [latex]);

  // Effect: Focus textarea when entering edit mode
  useEffect(() => {
    if (internalMode === 'edit' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [internalMode]);

  // Handle Updates
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateAttributes({ latex: e.target.value });
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Close edit mode on blur if not related to internal elements
    // We check relatedTarget to see if we clicked something else inside (unlikely here but good practice)
    // Actually, if we click outside the textarea, we want to close.
    setInternalMode('view');
  };

  const handleClick = () => {
    setInternalMode('edit');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow escaping with Ctrl+Enter or Esc
    if (e.key === 'Escape' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
      setInternalMode('view');
      // Important: Return focus to editor properly so we can keep typing
      // We need to find the position *after* this node.
      // node.nodeSize should be 1 for an atom node? No, usually 1.
      if (typeof getPos === 'function') {
        editor.commands.focus(getPos() + 1);
      }
    }
  };

  const isEditing = internalMode === 'edit';

  return (
    <NodeViewWrapper className={`math-block my-4 select-none group relative rounded transition-all duration-200 ${isEditing
        ? 'border border-blue-400 bg-white dark:bg-[#333] shadow-sm z-10'
        : 'border border-transparent hover:bg-gray-50/50 dark:hover:bg-white/5'
      }`}>

      {/* --- EDITING MODE --- */}
      <div className={`${isEditing ? 'block' : 'hidden'}`}>
        {/* Header: "$$" label */}
        <div className="px-3 pt-2 pb-1 text-xs font-mono text-gray-400 dark:text-gray-500 select-none flex justify-between">
          <span>$$</span>
          <span className="text-[10px] uppercase opacity-50">Tex Source</span>
        </div>

        {/* Source: Controlled Textarea */}
        <div className="px-3 pb-2">
          <textarea
            ref={textareaRef}
            className="block w-full font-mono text-sm bg-gray-50 dark:bg-black/20 p-2 rounded outline-none text-gray-800 dark:text-gray-200 resize-none h-24"
            value={latex}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Type your formula here..."
          />
        </div>

        {/* Rendered Preview (Always visible in edit mode for context) */}
        <div className="px-3 pb-4 overflow-x-auto min-h-[2rem] flex justify-center border-t border-gray-100 dark:border-gray-700/50 pt-4">
          {!latex.trim() ? (
            <span className="text-gray-400 dark:text-gray-500 text-sm italic select-none">
              &lt; Empty Mathematical Formula &gt;
            </span>
          ) : hasError ? (
            <span className="text-red-500 text-sm">
              &lt; Invalid Mathematical Formula &gt;
            </span>
          ) : (
            <div
              className="katex-render"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>
      </div>


      {/* --- VIEW MODE --- */}
      <div
        className={`${!isEditing ? 'block' : 'hidden'} relative group/view`}
        onClick={handleClick}
      >
        {/* Just the rendered content */}
        <div className="py-2 overflow-x-auto flex justify-center cursor-pointer min-h-[2em]">
          {!latex.trim() ? (
            <span className="text-gray-400 dark:text-gray-500 text-sm italic select-none px-4 py-2 border border-dashed border-gray-300 rounded opacity-50 hover:opacity-100 transition-opacity">
              $$ Click to add math...
            </span>
          ) : hasError ? (
            <span className="text-red-500 text-sm px-4 py-2 border border-red-200 rounded">
              &lt; Invalid Mathematical Formula &gt;
            </span>
          ) : (
            <div
              className="katex-render pointer-events-none"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>

        {/* Hover Edit Hint (Top Right) */}
        <div className="absolute top-0 right-0 p-1 opacity-0 group-hover/view:opacity-100 transition-opacity">
          <div className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded shadow-sm">
            Edit
          </div>
        </div>
      </div>

    </NodeViewWrapper>
  );
};
