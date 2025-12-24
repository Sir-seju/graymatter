import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import React from 'react';

const HeadingComponent = ({ node, editor, getPos }: any) => {
  const level = node.attrs.level;
  const hashes = '#'.repeat(level);

  // We need to know if the cursor is inside this node
  // Tiptap doesn't pass this prop by default. We can use a hook or simple checking.
  // Actually, for performance, we might want to rely on the parent editor updating us?
  // Or checking editor.state.selection?

  // Let's rely on a custom check. 
  // We can subscribe to editor updates.

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

  // Dynamic class based on level to reuse Tailwind styles (if possible) or just standard styles
  // Typora usually has simpler headings.
  const fontSize = level === 1 ? 'rx-3xl' : level === 2 ? 'rx-2xl' : level === 3 ? 'rx-xl' : 'rx-lg';
  // actually let's just let the prose styles handle sizing if we can, 
  // but NodeViewWrapper might isolate us? 
  // NodeViewWrapper should be transparent if we set `as`.

  // Actually, we want to render a proper H tag?
  // NodeViewWrapper as={`h${level}`} might work but we need the hashes separate.

  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <NodeViewWrapper className={`heading-node relative group flex items-baseline`}>
      <span
        className={`font-mono text-blue-500 mr-2 select-none transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0'}`}
        contentEditable={false}
      >
        {hashes}
      </span>
      <NodeViewContent as={Tag} className="outline-none" />
    </NodeViewWrapper>
  );
};

export default HeadingComponent;
