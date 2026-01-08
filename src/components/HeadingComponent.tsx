import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import React from 'react';

// Subscript numbers for heading levels
const subscriptNumbers: Record<number, string> = {
  1: '₁',
  2: '₂',
  3: '₃',
  4: '₄',
  5: '₅',
  6: '₆',
};

const HeadingComponent = ({ node, editor, getPos }: any) => {
  const level = node.attrs.level;
  const headingLabel = `H${subscriptNumbers[level] || level}`;

  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    const handleUpdate = () => {
      if (typeof getPos === 'function') {
        const { from, to } = editor.state.selection;
        const pos = getPos();
        // Check if selection is within this node
        const isSelected = from >= pos && to <= pos + node.nodeSize;
        setIsActive(isSelected);
      }
    };

    // Initial check
    handleUpdate();

    // Subscribe
    editor.on('selectionUpdate', handleUpdate);
    editor.on('update', handleUpdate);

    return () => {
      editor.off('selectionUpdate', handleUpdate);
      editor.off('update', handleUpdate);
    };
  }, [editor, getPos, node.nodeSize]);

  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <NodeViewWrapper className={`heading-node relative group`}>
      <span
        className={`heading-badge font-sans font-semibold select-none transition-opacity duration-200 px-2.5 py-1.5 rounded ${isActive ? 'opacity-100' : 'opacity-0'}`}
        style={{
          color: 'var(--control-text-color)',
          backgroundColor: 'var(--item-hover-bg-color)',
          fontSize: '1rem',
          position: 'absolute',
          right: '100%',
          marginRight: '14px',
          top: '0.2em',
          zIndex: 10,
        }}
        contentEditable={false}
      >
        {headingLabel}
      </span>
      <NodeViewContent as={Tag} className="outline-none" />
    </NodeViewWrapper>
  );
};

export default HeadingComponent;
