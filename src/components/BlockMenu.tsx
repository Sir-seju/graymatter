import { Editor } from '@tiptap/react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface BlockMenuProps {
  editor: Editor | null;
}

interface MenuPosition {
  top: number;
  left: number;
  blockType: 'list' | 'paragraph' | 'heading' | null;
  nodePos: number;
}

const BlockMenu: React.FC<BlockMenuProps> = ({ editor }) => {
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const [showSubmenu, setShowSubmenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getBlockType = useCallback((node: any): 'list' | 'paragraph' | 'heading' | null => {
    if (!node) return null;
    if (node.type.name === 'bulletList' || node.type.name === 'orderedList' || node.type.name === 'taskList') {
      return 'list';
    }
    if (node.type.name === 'listItem') {
      return 'list';
    }
    if (node.type.name === 'heading') {
      return 'heading';
    }
    if (node.type.name === 'paragraph') {
      return 'paragraph';
    }
    return null;
  }, []);

  const updatePosition = useCallback(() => {
    if (!editor) return;

    const { state } = editor;
    const { selection } = state;
    const { $from } = selection;

    // Find the parent block node
    let depth = $from.depth;
    let node = $from.parent;
    let nodePos = $from.before($from.depth);

    // Walk up to find a meaningful block
    while (depth > 0) {
      const parentNode = $from.node(depth);
      const blockType = getBlockType(parentNode);
      if (blockType === 'list') {
        // For lists, find the list container
        node = parentNode;
        nodePos = $from.before(depth);
        break;
      }
      if (blockType === 'paragraph' || blockType === 'heading') {
        node = parentNode;
        nodePos = $from.before(depth);
        break;
      }
      depth--;
    }

    const blockType = getBlockType(node);
    if (!blockType) {
      setPosition(null);
      return;
    }

    // Get the DOM element for this node
    const domNode = editor.view.nodeDOM(nodePos) as HTMLElement;
    if (!domNode) {
      setPosition(null);
      return;
    }

    const editorRect = editor.view.dom.getBoundingClientRect();
    const nodeRect = domNode.getBoundingClientRect();

    setPosition({
      top: nodeRect.top - editorRect.top + editor.view.dom.scrollTop,
      left: -40, // Position to the left of the content
      blockType,
      nodePos,
    });
  }, [editor, getBlockType]);

  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      updatePosition();
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    editor.on('focus', handleSelectionUpdate);

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
      editor.off('focus', handleSelectionUpdate);
    };
  }, [editor, updatePosition]);

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
      setShowSubmenu(false);
    }, 300);
  };

  const handleDuplicate = () => {
    if (!editor || !position) return;
    const { state } = editor;
    const node = state.doc.nodeAt(position.nodePos);
    if (node) {
      const endPos = position.nodePos + node.nodeSize;
      editor.chain().focus().insertContentAt(endPos, node.toJSON()).run();
    }
    setShowSubmenu(false);
  };

  const handleDelete = () => {
    if (!editor || !position) return;
    const { state } = editor;
    const node = state.doc.nodeAt(position.nodePos);
    if (node) {
      editor.chain().focus().deleteRange({ from: position.nodePos, to: position.nodePos + node.nodeSize }).run();
    }
    setShowSubmenu(false);
  };

  const handleNewParagraph = () => {
    if (!editor || !position) return;
    const { state } = editor;
    const node = state.doc.nodeAt(position.nodePos);
    if (node) {
      const endPos = position.nodePos + node.nodeSize;
      editor.chain().focus().insertContentAt(endPos, { type: 'paragraph' }).run();
    }
    setShowSubmenu(false);
  };

  const handleTurnInto = (type: string) => {
    if (!editor) return;

    switch (type) {
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'orderedList':
        editor.chain().focus().toggleOrderedList().run();
        break;
      case 'taskList':
        editor.chain().focus().toggleTaskList().run();
        break;
      case 'paragraph':
        editor.chain().focus().setParagraph().run();
        break;
      case 'heading1':
        editor.chain().focus().setHeading({ level: 1 }).run();
        break;
      case 'heading2':
        editor.chain().focus().setHeading({ level: 2 }).run();
        break;
      case 'heading3':
        editor.chain().focus().setHeading({ level: 3 }).run();
        break;
    }
    setShowSubmenu(false);
  };

  if (!position || !editor?.isFocused) return null;

  const getIcon = () => {
    switch (position.blockType) {
      case 'list':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
        );
      case 'paragraph':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 4v16" />
            <path d="M17 4v16" />
            <path d="M19 4H9.5a4.5 4.5 0 0 0 0 9H13" />
          </svg>
        );
      case 'heading':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12h8" />
            <path d="M4 18V6" />
            <path d="M12 18V6" />
            <path d="m17 12 3-2v8" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={menuRef}
      className={`absolute z-50 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
      style={{
        top: position.top,
        left: position.left,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main icon button */}
      <button
        onClick={() => setShowSubmenu(!showSubmenu)}
        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-grab active:cursor-grabbing"
        style={{ color: 'var(--control-text-color)' }}
        title="Block options"
      >
        {getIcon()}
      </button>

      {/* Dropdown menu */}
      {showSubmenu && (
        <div
          className="absolute left-0 mt-1 w-48 rounded-lg shadow-lg border py-1 z-50"
          style={{
            backgroundColor: 'var(--side-bar-bg-color)',
            borderColor: 'var(--window-border)',
          }}
        >
          {/* Duplicate */}
          <button
            onClick={handleDuplicate}
            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            style={{ color: 'var(--text-color)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Duplicate
            <span className="ml-auto text-xs opacity-50">⇧⌘P</span>
          </button>

          {/* Turn Into submenu */}
          <div className="relative group">
            <button
              className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              style={{ color: 'var(--text-color)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
              Turn Into
              <span className="ml-auto">›</span>
            </button>

            {/* Turn Into submenu */}
            <div
              className="absolute left-full top-0 w-44 rounded-lg shadow-lg border py-1 hidden group-hover:block"
              style={{
                backgroundColor: 'var(--side-bar-bg-color)',
                borderColor: 'var(--window-border)',
              }}
            >
              <button
                onClick={() => handleTurnInto('orderedList')}
                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                style={{ color: 'var(--text-color)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="10" y1="6" x2="21" y2="6" />
                  <line x1="10" y1="12" x2="21" y2="12" />
                  <line x1="10" y1="18" x2="21" y2="18" />
                  <path d="M4 6h1v4" />
                  <path d="M4 10h2" />
                  <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
                </svg>
                Order List
                <span className="ml-auto text-xs opacity-50">⌥⌘O</span>
              </button>
              <button
                onClick={() => handleTurnInto('bulletList')}
                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                style={{ color: 'var(--text-color)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <circle cx="3" cy="6" r="1" fill="currentColor" />
                  <circle cx="3" cy="12" r="1" fill="currentColor" />
                  <circle cx="3" cy="18" r="1" fill="currentColor" />
                </svg>
                Bullet List
                <span className="ml-auto text-xs opacity-50">⌥⌘U</span>
              </button>
              <button
                onClick={() => handleTurnInto('taskList')}
                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                style={{ color: 'var(--text-color)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="5" width="6" height="6" rx="1" />
                  <path d="m3 17 2 2 4-4" />
                  <path d="M13 6h8" />
                  <path d="M13 12h8" />
                  <path d="M13 18h8" />
                </svg>
                To-do List
                <span className="ml-auto text-xs opacity-50">⌥⌘X</span>
              </button>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t my-1" style={{ borderColor: 'var(--window-border)' }} />

          {/* New Paragraph */}
          <button
            onClick={handleNewParagraph}
            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            style={{ color: 'var(--text-color)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 4v16" />
              <path d="M17 4v16" />
              <path d="M19 4H9.5a4.5 4.5 0 0 0 0 9H13" />
            </svg>
            New Paragraph
            <span className="ml-auto text-xs opacity-50">⇧⌘N</span>
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            style={{ color: '#ef4444' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
            Delete
            <span className="ml-auto text-xs opacity-50">⇧⌘D</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default BlockMenu;
