import CharacterCount from '@tiptap/extension-character-count';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import { EditorContent, ReactNodeViewRenderer, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Markdown } from 'tiptap-markdown';
import CodeBlockComponent from './CodeBlockComponent';
import { CodeBlockPrism } from './extensions/CodeBlockPrism';
import { HeadingExtension } from './extensions/HeadingExtension';
import { InlineMathExtension } from './extensions/InlineMathExtension';
import { MathExtension } from './extensions/MathExtension';
import { Search } from './extensions/SearchExtension';
import BlockMenu from './BlockMenu';

// Source Mode Editor Component - Typora-style with syntax highlighting
const SourceModeEditor: React.FC<{
  content: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  fontSize: number;
}> = ({ content, onChange, onBlur, fontSize }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [lineCount, setLineCount] = useState(1);

  // Update line count when content changes
  useEffect(() => {
    const lines = content.split('\n').length;
    setLineCount(lines);
  }, [content]);

  // Sync scroll between all elements
  const handleScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current && lineNumbersRef.current) {
      const scrollTop = textareaRef.current.scrollTop;
      const scrollLeft = textareaRef.current.scrollLeft;
      highlightRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollLeft = scrollLeft;
      lineNumbersRef.current.scrollTop = scrollTop;
    }
  }, []);

  // Handle tab key for indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = content.substring(0, start) + '    ' + content.substring(end);
      onChange(newValue);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  };

  const baseLineHeight = fontSize * 1.6;

  // Render highlighted content - simple approach that matches textarea exactly
  // Just colorize syntax markers without changing font sizes
  const renderHighlightedContent = () => {
    // Apply syntax highlighting via regex replacements
    let highlighted = content;

    // Escape HTML
    highlighted = highlighted
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headers (# ## ### etc) - color the hash marks
    highlighted = highlighted.replace(
      /^(#{1,6} )(.*)$/gm,
      '<span class="source-syntax">$1</span><span class="source-heading">$2</span>'
    );

    // Blockquotes
    highlighted = highlighted.replace(
      /^(&gt; )(.*)$/gm,
      '<span class="source-syntax source-blockquote">$1</span>$2'
    );

    // Bold **text**
    highlighted = highlighted.replace(
      /(\*\*|__)(.+?)\1/g,
      '<span class="source-syntax">$1</span><span class="source-bold">$2</span><span class="source-syntax">$1</span>'
    );

    // Inline code `code`
    highlighted = highlighted.replace(
      /`([^`\n]+)`/g,
      '<span class="source-syntax">`</span><span class="source-code">$1</span><span class="source-syntax">`</span>'
    );

    // Code blocks ```
    highlighted = highlighted.replace(
      /^(```\w*)$/gm,
      '<span class="source-syntax">$1</span>'
    );

    // List markers
    highlighted = highlighted.replace(
      /^(\s*[-*+] )/gm,
      '<span class="source-syntax">$1</span>'
    );

    // Ordered list markers
    highlighted = highlighted.replace(
      /^(\s*\d+\. )/gm,
      '<span class="source-syntax">$1</span>'
    );

    // Links [text](url)
    highlighted = highlighted.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<span class="source-syntax">[</span><span class="source-link-text">$1</span><span class="source-syntax">](</span><span class="source-link-url">$2</span><span class="source-syntax">)</span>'
    );

    return <div dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  // Render inline styles (bold, italic, code, links)
  const renderInlineStyles = (text: string): React.ReactNode => {
    if (!text) return null;

    // Split by markdown patterns and style them
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    // Process bold **text** or __text__
    const boldRegex = /(\*\*|__)(.+?)\1/g;
    // Process italic *text* or _text_
    const italicRegex = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)|(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g;
    // Process inline code `code`
    const codeRegex = /`([^`]+)`/g;

    // Simple approach: render with markers visible but styled
    let lastIndex = 0;
    const allMatches: Array<{start: number, end: number, type: string, full: string, content: string}> = [];

    // Find bold matches
    let match;
    const boldRegex2 = /(\*\*|__)(.+?)\1/g;
    while ((match = boldRegex2.exec(text)) !== null) {
      allMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'bold',
        full: match[0],
        content: match[2]
      });
    }

    // Find code matches
    const codeRegex2 = /`([^`]+)`/g;
    while ((match = codeRegex2.exec(text)) !== null) {
      allMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'code',
        full: match[0],
        content: match[1]
      });
    }

    // Sort by start position
    allMatches.sort((a, b) => a.start - b.start);

    // Build result
    let pos = 0;
    for (const m of allMatches) {
      if (m.start > pos) {
        parts.push(<span key={key++}>{text.slice(pos, m.start)}</span>);
      }
      if (m.type === 'bold') {
        parts.push(
          <span key={key++} className="source-bold">
            <span className="source-syntax">**</span>
            {m.content}
            <span className="source-syntax">**</span>
          </span>
        );
      } else if (m.type === 'code') {
        parts.push(
          <span key={key++} className="source-code">
            <span className="source-syntax">`</span>
            {m.content}
            <span className="source-syntax">`</span>
          </span>
        );
      }
      pos = m.end;
    }
    if (pos < text.length) {
      parts.push(<span key={key++}>{text.slice(pos)}</span>);
    }

    return parts.length > 0 ? parts : text;
  };

  // Calculate line heights for each line (headers have larger heights)
  const getLineHeights = () => {
    const lines = content.split('\n');
    return lines.map(line => {
      if (line.match(/^# /)) return fontSize * 2.2;
      if (line.match(/^## /)) return fontSize * 1.9;
      if (line.match(/^### /)) return fontSize * 1.7;
      if (line.match(/^#### /)) return fontSize * 1.5;
      return baseLineHeight;
    });
  };

  const lineHeights = getLineHeights();

  return (
    <div className="source-mode-container h-full overflow-hidden flex justify-center" ref={containerRef} style={{ backgroundColor: 'var(--bg-color)' }}>
      {/* Centered content wrapper with line numbers inside */}
      <div className="relative h-full" style={{ maxWidth: '900px', width: '100%' }}>
        {/* Line Numbers - positioned inside the centered area, to the left of content */}
        <div
          ref={lineNumbersRef}
          className="source-mode-line-numbers select-none absolute text-right pointer-events-none overflow-auto"
          style={{
            fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace',
            fontSize: `${fontSize * 0.8}px`,
            color: 'var(--control-text-color)',
            opacity: 0.3,
            width: '40px',
            left: '8px',
            top: '0',
            paddingTop: '60px',
            height: '100%',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {lineHeights.map((height, i) => {
            const lineNum = i + 1;
            const showNumber = lineNum % 10 === 0;
            return (
              <div key={lineNum} style={{ height: `${height}px`, lineHeight: `${height}px` }}>
                {showNumber ? lineNum : ''}
              </div>
            );
          })}
        </div>

        {/* Syntax highlighted background layer - scrollable, synced with textarea */}
        <div
          ref={highlightRef}
          className="absolute inset-0 overflow-auto pointer-events-none"
          style={{
            fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace',
            fontSize: `${fontSize}px`,
            lineHeight: `${baseLineHeight}px`,
            color: 'var(--text-color)',
            padding: '60px 60px 100px 60px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}
          aria-hidden="true"
        >
          {renderHighlightedContent()}
        </div>

        {/* Transparent textarea for editing - this is the scrollable element */}
        <textarea
          ref={textareaRef}
          className="absolute inset-0 w-full h-full resize-none outline-none border-none overflow-auto"
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          placeholder="Type your markdown source here..."
          spellCheck={false}
          wrap="soft"
          style={{
            fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace',
            fontSize: `${fontSize}px`,
            lineHeight: `${baseLineHeight}px`,
            color: 'transparent',
            backgroundColor: 'transparent',
            caretColor: 'var(--text-color)',
            padding: '60px 60px 100px 60px',
            WebkitTextFillColor: 'transparent',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}
        />
      </div>
    </div>
  );
};

export interface EditorHandle {
  findNext: () => void;
  findPrev: () => void;
  toggleSourceMode: () => void;
  scrollToLine: (line: number) => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  toggleStrike: () => void;
  toggleHighlight: () => void;
  toggleCode: () => void;
  // Paragraph formatting
  setHeading: (level: 1 | 2 | 3 | 4 | 5 | 6) => void;
  setParagraph: () => void;
  toggleBlockquote: () => void;
  toggleOrderedList: () => void;
  toggleBulletList: () => void;
  toggleTaskList: () => void;
  insertHorizontalRule: () => void;
  toggleCodeBlock: () => void;
  // Replace functionality
  replaceCurrent: (replacement: string) => void;
  replaceAll: (search: string, replacement: string) => void;
}

interface EditorProps {
  initialContent?: string;
  basePath?: string | null;
  searchQuery?: string;
  onSave?: (content: string) => void;
  onStatsUpdate?: (stats: { words: number; characters: number; blockType: string; selection?: { words: number; chars: number } | null }) => void;
  theme: string;
  fontSize: number;
}

const Editor = forwardRef<EditorHandle, EditorProps>(({
  initialContent = '# Welcome to Typora Clone',
  basePath,
  searchQuery = '',
  onSave,
  onStatsUpdate,
  theme,
  fontSize,
}, ref) => {
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview');
  const [content, setContent] = useState(() => hydrateMath(initialContent));

  // Hydrate Math: Convert raw Markdown $$...$$ to Tiptap-compatible HTML for loading (Base64 encoded)
  function hydrateMath(markdown: string) {
    if (!markdown) return '';
    // Block Math: $$ ... $$
    let hydrated = markdown.replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, (match, latex) => {
      try {
        const encoded = window.btoa(unescape(encodeURIComponent(latex))); // base64
        return `<div data-katex="${encoded}"></div>`;
      } catch (e) {
        return match;
      }
    });
    // Inline Math: $ ... $
    hydrated = hydrated.replace(/(?<!\\)\$(.+?)(?<!\\)\$/g, (match, latex) => {
      try {
        const encoded = window.btoa(unescape(encodeURIComponent(latex))); // base64
        return `<span data-katex="${encoded}">${latex}</span>`;
      } catch (e) {
        return match;
      }
    });
    return hydrated;
  };

  const updateStats = (editor: any) => {
    if (onStatsUpdate) {
      const words = editor.storage.characterCount?.words() || 0;
      const characters = editor.storage.characterCount?.characters() || 0;
      const selection = editor.state.selection;
      const blockType = selection.$head.parent.type.name;

      // Calculate selection stats
      let selectionStats: { words: number; chars: number } | null = null;
      if (!selection.empty) {
        const selectedText = editor.state.doc.textBetween(selection.from, selection.to, ' ');
        if (selectedText.length > 0) {
          const selWords = selectedText.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
          selectionStats = {
            words: selWords,
            chars: selectedText.length
          };
        }
      }

      onStatsUpdate({ words, characters, blockType, selection: selectionStats });
    }
  };

  const handleDrop = (view: any, event: any, slice: any, moved: boolean) => {
    if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      event.preventDefault();
      const files = Array.from(event.dataTransfer.files);
      files.forEach(async (file: any) => {
        if (file.type.startsWith('image/')) {
          // It's an image
          if (basePath) {
            // Save to assets
            const assetsDir = `${basePath}/assets`;
            await window.electron.createFolder(assetsDir);

            const reader = new FileReader();
            reader.onload = async (e) => {
              const base64 = e.target?.result?.toString().split(',')[1];
              if (base64) {
                const dest = `${assetsDir}/${file.name}`;
                // Check if file exists to avoid overwrite? For now overwrite is fine or append timestamp.
                const result = await window.electron.saveAsset(dest, base64);
                if (result.success) {
                  const relPath = `./assets/${file.name}`;
                  view.dispatch(view.state.tr.replaceSelectionWith(
                    view.state.schema.nodes.image.create({ src: relPath })
                  ));
                } else {
                  console.error("Failed to save asset", result);
                  alert("Failed to save image");
                }
              }
            };
            reader.readAsDataURL(file);

          } else {
            // Unsaved file - use Base64
            const reader = new FileReader();
            reader.onload = (e) => {
              const src = e.target?.result as string;
              view.dispatch(view.state.tr.replaceSelectionWith(
                view.state.schema.nodes.image.create({ src })
              ));
            };
            reader.readAsDataURL(file);
          }
        }
      });
      return true; // handled
    }
    return false;
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: false, // Disable default heading
      }),
      HeadingExtension, // Add our custom heading
      CodeBlockPrism.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockComponent)
        },
      }),
      MathExtension,
      InlineMathExtension,
      Highlight,
      Typography,
      Underline,
      Superscript,
      Subscript,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false, // We'll handle click manually for better UX
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
        emptyEditorClass: 'is-editor-empty',
      }),
      Search,
      CharacterCount,
      TaskItem.configure({
        nested: true,
      }),
      TaskList,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'prose-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      Markdown.configure({
        html: true, // Enable HTML
        breaks: true, // Treat newlines as hard breaks
        transformPastedText: true,
        transformCopiedText: true,
        bulletListMarker: '-',
        extensions: [
          // Disable indented code blocks (4-space indent should NOT create code blocks)
          {
            name: 'disableIndentedCodeBlock',
            parse: {
              setup(md: any) {
                // Disable the 'code' rule which handles indented code blocks
                md.block.ruler.disable('code');
              }
            }
          },
          // Serializers: Tiptap Nodes -> Markdown
          {
            name: 'math',
            toMarkdown: {
              block(state: any, node: any) {
                // node.attrs.latex is ALREADY the clear text (parsed by extension)
                state.write('$$\n' + (node.attrs.latex || '') + '\n$$');
                state.closeBlock(node);
              }
            }
          },
          {
            name: 'inlineMath',
            toMarkdown: {
              inline(state: any, node: any) {
                state.write('$' + node.textContent + '$');
              }
            }
          }
        ]
      } as any),
    ],
    // Let Markdown extension handle the initial content parsing
    content: initialContent,
    editorProps: {
      attributes: {
        id: 'write',
        class: 'focus:outline-none min-h-screen',
        spellcheck: 'false',
        autocorrect: 'off',
        autocapitalize: 'off',
      },
      handleDrop: handleDrop as any,
      handleClick: (view, pos, event) => {
        // Handle Cmd/Ctrl+click on links to open in external browser
        const target = event.target as HTMLElement;
        if (target.tagName === 'A' && (event.metaKey || event.ctrlKey)) {
          const href = target.getAttribute('href');
          if (href) {
            event.preventDefault();
            window.electron?.openExternal?.(href);
            return true;
          }
        }
        return false;
      },
      handleKeyDown: (view, event) => {
        const TAB_SIZE = 8; // Tab size (8 spaces)
        const TAB_CHARS = '        '; // 8 spaces

        // Handle Tab key - insert tab (8 spaces)
        if (event.key === 'Tab' && !event.shiftKey) {
          event.preventDefault();
          const { state, dispatch } = view;
          const { tr } = state;
          dispatch(tr.insertText(TAB_CHARS));
          return true;
        }

        // Handle Backspace - smart delete for indentation
        if (event.key === 'Backspace') {
          const { state } = view;
          const { $from, empty } = state.selection;

          // Only handle if selection is collapsed (no text selected)
          if (empty) {
            const pos = $from.pos;
            const start = $from.start(); // Start of current text block
            const textBefore = state.doc.textBetween(start, pos, '\0', '\0');

            // Check if text before cursor ends with spaces
            if (textBefore.length > 0) {
              const trailingSpaces = textBefore.match(/( +)$/);
              if (trailingSpaces) {
                const spacesCount = trailingSpaces[1].length;
                // Delete to the previous tab stop (8 spaces)
                const deleteCount = spacesCount % TAB_SIZE === 0 ? TAB_SIZE : spacesCount % TAB_SIZE;

                if (spacesCount >= deleteCount) {
                  event.preventDefault();
                  view.dispatch(state.tr.delete(pos - deleteCount, pos));
                  return true;
                }
              }
            }
          }
        }

        // Handle Enter on empty list item to exit list
        if (event.key === 'Enter' && !event.shiftKey) {
          const { state } = view;
          const { $from } = state.selection;
          const parent = $from.parent;

          // Check if we're in an empty list item
          if (parent.type.name === 'paragraph' && parent.content.size === 0) {
            const listItem = $from.node(-1);
            if (listItem && listItem.type.name === 'listItem') {
              // Check if list item only contains this empty paragraph
              if (listItem.childCount === 1 && listItem.firstChild?.content.size === 0) {
                // Use TipTap's liftListItem to exit the list
                const { tr } = state;
                const listItemPos = $from.before(-1);

                // Try to lift the list item out
                view.dispatch(
                  tr.delete(listItemPos, listItemPos + listItem.nodeSize)
                    .insert(listItemPos, state.schema.nodes.paragraph.create())
                );
                return true;
              }
            }
          }
        }

        // We let the extensions (Math, InlineMath) handle standard input rules.
        // This avoids conflicts where custom logic fights with Tiptap's transaction system.
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      // Get Markdown content instead of HTML for saving
      const markdown = editor.storage.markdown.getMarkdown();
      if (viewMode === 'preview') {
        setContent(markdown);
        onSave && onSave(markdown);
      }
      updateStats(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      updateStats(editor);
    },
    onBlur: ({ editor }) => {
      // Autosave when editor loses focus
      const markdown = editor.storage.markdown.getMarkdown();
      if (viewMode === 'preview' && onSave) {
        onSave(markdown);
      }
    },
  });

  // Toggle Mode Function (Moved up for useImperativeHandle)
  const toggleMode = async () => {
    if (viewMode === 'preview') {
      setViewMode('source');
    } else {
      editor?.commands.setContent(hydrateMath(content));
      setViewMode('preview');
    }
  };

  // Expose search methods to parent via ref
  useImperativeHandle(ref, () => ({
    findNext: () => {
      editor?.commands.findNext();
    },
    findPrev: () => {
      editor?.commands.findPrev();
    },
    toggleSourceMode: () => {
      toggleMode();
    },
    scrollToLine: (line: number) => {
      if (!editor) return;
      // Get doc content and find position of the nth line
      const doc = editor.state.doc;
      let pos = 0;
      let currentLine = 0;
      doc.descendants((node, nodePos) => {
        if (currentLine === line) {
          pos = nodePos;
          return false; // stop iteration
        }
        if (node.isBlock) currentLine++;
        return true;
      });
      // Scroll to the position
      editor.commands.setTextSelection(pos);
      editor.commands.scrollIntoView();
    },
    toggleBold: () => {
      editor?.chain().focus().toggleBold().run();
    },
    toggleItalic: () => {
      editor?.chain().focus().toggleItalic().run();
    },
    toggleUnderline: () => {
      editor?.chain().focus().toggleUnderline().run();
    },
    toggleStrike: () => {
      editor?.chain().focus().toggleStrike().run();
    },
    toggleHighlight: () => {
      editor?.chain().focus().toggleHighlight().run();
    },
    toggleCode: () => {
      editor?.chain().focus().toggleCode().run();
    },
    // Paragraph formatting
    setHeading: (level: 1 | 2 | 3 | 4 | 5 | 6) => {
      editor?.chain().focus().toggleHeading({ level }).run();
    },
    setParagraph: () => {
      editor?.chain().focus().setParagraph().run();
    },
    toggleBlockquote: () => {
      editor?.chain().focus().toggleBlockquote().run();
    },
    toggleOrderedList: () => {
      editor?.chain().focus().toggleOrderedList().run();
    },
    toggleBulletList: () => {
      editor?.chain().focus().toggleBulletList().run();
    },
    toggleTaskList: () => {
      editor?.chain().focus().toggleTaskList().run();
    },
    insertHorizontalRule: () => {
      editor?.chain().focus().setHorizontalRule().run();
    },
    toggleCodeBlock: () => {
      editor?.chain().focus().toggleCodeBlock().run();
    },
    replaceCurrent: (replacement: string) => {
      if (!editor) return;
      // Get current selection and replace with the replacement text
      const { from, to } = editor.state.selection;
      if (from !== to) {
        editor.chain().focus().deleteRange({ from, to }).insertContent(replacement).run();
      }
    },
    replaceAll: (search: string, replacement: string) => {
      if (!editor || !search) return;
      // Get current content and replace all occurrences
      const content = editor.getHTML();
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const newContent = content.replace(regex, replacement);
      editor.commands.setContent(newContent);
    }
  }), [editor, toggleMode]);

  // Handle search query changes
  useEffect(() => {
    if (editor) {
      editor.commands.setSearchTerm(searchQuery);
    }
  }, [editor, searchQuery]);


  // Sync editor content when initialContent prop changes (e.g. file switch)
  useEffect(() => {
    if (editor && initialContent !== undefined) {
      // If the content is different from what we have, update it.
      // But avoid overwriting if we are typing (unsaved changes handled by onUpdate)
      // Actually, when switching files, initialContent changes completely.
      // When typing, initialContent doesn't change unless saved and reloaded.
      // We generally trust initialContent to be the source of truth on mount/change.

      // Check if content matches to avoid cursor jump?
      // For file switching, always setContent.
      if (editor.storage.markdown.getMarkdown() !== initialContent) {
        editor.commands.setContent(initialContent);
        setContent(initialContent);
      }
    }
  }, [initialContent, editor]);

  // Handle Theme and Font Size
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      // System
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    }

    // Apply font size to editor
    if (editor) {
      const editorElement = document.querySelector('.ProseMirror') as HTMLElement;
      if (editorElement) {
        editorElement.style.fontSize = `${fontSize}px`;
      }
    }
  }, [theme, fontSize, editor]);


  // Autosave Logic
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (content) {
        const tempPath = '/tmp/typora-autosave.md'; // Changed to .md
        window.electron.writeFile(tempPath, content).catch(console.error);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(saveTimeout);
  }, [content]);



  // Handle keyboard shortcuts directly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editor || viewMode !== 'preview') return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      // Helper to get word boundaries at cursor position
      const getWordAtCursor = (): { from: number; to: number } | null => {
        const { from, to } = editor.state.selection;
        if (from !== to) return null; // Already has selection

        const $pos = editor.state.doc.resolve(from);
        const start = $pos.start();
        const text = $pos.parent.textContent;
        const offsetInNode = from - start;

        // Find word boundaries
        let wordStart = offsetInNode;
        let wordEnd = offsetInNode;

        // Go backwards to find start of word
        while (wordStart > 0 && /\w/.test(text[wordStart - 1])) {
          wordStart--;
        }

        // Go forwards to find end of word
        while (wordEnd < text.length && /\w/.test(text[wordEnd])) {
          wordEnd++;
        }

        if (wordStart !== wordEnd) {
          return { from: start + wordStart, to: start + wordEnd };
        }
        return null;
      };

      if (cmdKey && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            const wordRangeB = getWordAtCursor();
            if (wordRangeB) {
              editor.chain().focus().setTextSelection(wordRangeB).toggleBold().run();
            } else {
              editor.chain().focus().toggleBold().run();
            }
            break;
          case 'i':
            e.preventDefault();
            const wordRangeI = getWordAtCursor();
            if (wordRangeI) {
              editor.chain().focus().setTextSelection(wordRangeI).toggleItalic().run();
            } else {
              editor.chain().focus().toggleItalic().run();
            }
            break;
          case 'u':
            e.preventDefault();
            const wordRangeU = getWordAtCursor();
            if (wordRangeU) {
              editor.chain().focus().setTextSelection(wordRangeU).toggleUnderline().run();
            } else {
              editor.chain().focus().toggleUnderline().run();
            }
            break;
          case 'k':
            e.preventDefault();
            const url = prompt('Enter URL:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
            break;
          case '1':
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 1 }).run();
            break;
          case '2':
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 2 }).run();
            break;
          case '3':
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 3 }).run();
            break;
          case '4':
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 4 }).run();
            break;
          case '5':
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 5 }).run();
            break;
          case '6':
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 6 }).run();
            break;
          case '0':
            e.preventDefault();
            editor.chain().focus().setParagraph().run();
            break;
        }
      }

      // Cmd + / - for header level (increase/decrease)
      if (cmdKey && !e.shiftKey && !e.altKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          // Increase heading level (H6 -> H5 -> ... -> H1)
          const { $from } = editor.state.selection;
          const node = $from.parent;
          if (node.type.name === 'heading') {
            const currentLevel = node.attrs.level;
            if (currentLevel > 1) {
              editor.chain().focus().setHeading({ level: (currentLevel - 1) as 1|2|3|4|5|6 }).run();
            }
          } else {
            editor.chain().focus().setHeading({ level: 6 }).run();
          }
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          // Decrease heading level (H1 -> H2 -> ... -> H6 -> paragraph)
          const { $from } = editor.state.selection;
          const node = $from.parent;
          if (node.type.name === 'heading') {
            const currentLevel = node.attrs.level;
            if (currentLevel < 6) {
              editor.chain().focus().setHeading({ level: (currentLevel + 1) as 1|2|3|4|5|6 }).run();
            } else {
              editor.chain().focus().setParagraph().run();
            }
          }
        }
      }

      // Cmd+Shift combinations
      if (cmdKey && e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'h':
            e.preventDefault();
            editor.chain().focus().toggleHighlight().run();
            break;
          case 'k':
            e.preventDefault();
            editor.chain().focus().toggleCodeBlock().run();
            break;
          case 'q':
            e.preventDefault();
            editor.chain().focus().toggleBlockquote().run();
            break;
          case 'x':
            e.preventDefault();
            editor.chain().focus().toggleTaskList().run();
            break;
          case 'm':
            e.preventDefault();
            editor.chain().focus().insertContent({ type: 'math', attrs: { latex: '' } }).run();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor, viewMode]);

  useEffect(() => {
    const removeListener = window.electron.on('menu-action', (_: any, action: string) => {
      if (action === 'toggle-source-mode') {
        toggleMode();
      }
      // Handle formatting actions
      if (editor && viewMode === 'preview') {
        switch (action) {
          case 'format-bold':
            editor.chain().focus().toggleBold().run();
            break;
          case 'format-italic':
            editor.chain().focus().toggleItalic().run();
            break;
          case 'format-underline':
            editor.chain().focus().toggleUnderline().run();
            break;
          case 'format-strike':
            editor.chain().focus().toggleStrike().run();
            break;
          case 'format-highlight':
            editor.chain().focus().toggleHighlight().run();
            break;
          case 'format-code':
            editor.chain().focus().toggleCode().run();
            break;
          case 'heading-1':
            editor.chain().focus().toggleHeading({ level: 1 }).run();
            break;
          case 'heading-2':
            editor.chain().focus().toggleHeading({ level: 2 }).run();
            break;
          case 'heading-3':
            editor.chain().focus().toggleHeading({ level: 3 }).run();
            break;
          case 'heading-4':
            editor.chain().focus().toggleHeading({ level: 4 }).run();
            break;
          case 'heading-5':
            editor.chain().focus().toggleHeading({ level: 5 }).run();
            break;
          case 'heading-6':
            editor.chain().focus().toggleHeading({ level: 6 }).run();
            break;
          case 'paragraph':
            editor.chain().focus().setParagraph().run();
            break;
          case 'blockquote':
            editor.chain().focus().toggleBlockquote().run();
            break;
          case 'ordered-list':
            editor.chain().focus().toggleOrderedList().run();
            break;
          case 'bullet-list':
            editor.chain().focus().toggleBulletList().run();
            break;
          case 'task-list':
            editor.chain().focus().toggleTaskList().run();
            break;
          case 'horizontal-rule':
            editor.chain().focus().setHorizontalRule().run();
            break;
          case 'code-block':
            editor.chain().focus().toggleCodeBlock().run();
            break;
          case 'insert-link':
            {
              const url = prompt('Enter URL:');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }
            break;
          case 'insert-image':
            {
              const imageUrl = prompt('Enter image URL:');
              if (imageUrl) {
                editor.chain().focus().setImage({ src: imageUrl }).run();
              }
            }
            break;
          case 'clear-format':
            editor.chain().focus().unsetAllMarks().run();
            break;
          case 'math-block':
            editor.chain().focus().insertContent({ type: 'math', attrs: { latex: '' } }).run();
            break;
          case 'format-inline-math':
            editor.chain().focus().insertContent({ type: 'inlineMath', attrs: { latex: '' } }).run();
            break;
          case 'increase-heading':
            {
              const { $from } = editor.state.selection;
              const node = $from.parent;
              if (node.type.name === 'heading') {
                const currentLevel = node.attrs.level as number;
                if (currentLevel > 1) {
                  editor.chain().focus().setHeading({ level: (currentLevel - 1) as 1 | 2 | 3 | 4 | 5 | 6 }).run();
                }
              } else {
                editor.chain().focus().setHeading({ level: 6 }).run();
              }
            }
            break;
          case 'decrease-heading':
            {
              const { $from } = editor.state.selection;
              const node = $from.parent;
              if (node.type.name === 'heading') {
                const currentLevel = node.attrs.level as number;
                if (currentLevel < 6) {
                  editor.chain().focus().setHeading({ level: (currentLevel + 1) as 1 | 2 | 3 | 4 | 5 | 6 }).run();
                } else {
                  editor.chain().focus().setParagraph().run();
                }
              }
            }
            break;
          case 'paste-plain-text':
            {
              navigator.clipboard.readText().then((text) => {
                if (text) {
                  editor.chain().focus().insertContent(text).run();
                }
              });
            }
            break;
        }
      }
    });
    return () => removeListener?.();
  }, [viewMode, editor, content]);


  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto w-full relative" id="typora-content-area">
        {viewMode === 'preview' ? (
          <>
            <EditorContent editor={editor} className="min-h-full" />
            <BlockMenu editor={editor} />
          </>
        ) : (
          <SourceModeEditor
            content={content}
            onChange={(value) => {
              setContent(value);
              onSave && onSave(value);
            }}
            onBlur={() => {
              // Autosave when source mode editor loses focus
              if (onSave) {
                onSave(content);
              }
            }}
            fontSize={fontSize}
          />
        )}
      </div>
    </div>
  );
});

export default Editor;
