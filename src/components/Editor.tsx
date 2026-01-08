import CharacterCount from '@tiptap/extension-character-count';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
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

// Source Mode Editor Component - Typora-style with syntax highlighting
const SourceModeEditor: React.FC<{
  content: string;
  onChange: (value: string) => void;
  fontSize: number;
}> = ({ content, onChange, fontSize }) => {
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
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Handle tab key for indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = content.substring(0, start) + '  ' + content.substring(end);
      onChange(newValue);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const baseLineHeight = fontSize * 1.6;

  // Render highlighted content with markdown syntax styling
  const renderHighlightedContent = () => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      // Detect line type and apply styling
      const h1Match = line.match(/^(# )(.*)$/);
      const h2Match = line.match(/^(## )(.*)$/);
      const h3Match = line.match(/^(### )(.*)$/);
      const h4Match = line.match(/^(#### )(.*)$/);
      const h5Match = line.match(/^(##### )(.*)$/);
      const h6Match = line.match(/^(###### )(.*)$/);
      const blockquoteMatch = line.match(/^(> )(.*)$/);
      const listMatch = line.match(/^(\s*[-*+] )(.*)$/);
      const orderedListMatch = line.match(/^(\s*\d+\. )(.*)$/);

      let lineStyle: React.CSSProperties = {
        minHeight: `${baseLineHeight}px`,
        lineHeight: `${baseLineHeight}px`,
      };
      let content: React.ReactNode = line || '\u200B';

      // Headers - larger font sizes like Typora
      if (h1Match) {
        lineStyle = { ...lineStyle, fontSize: `${fontSize * 1.8}px`, lineHeight: `${fontSize * 2.2}px`, minHeight: `${fontSize * 2.2}px`, fontWeight: 600 };
        content = <><span className="source-syntax">{h1Match[1]}</span>{renderInlineStyles(h1Match[2])}</>;
      } else if (h2Match) {
        lineStyle = { ...lineStyle, fontSize: `${fontSize * 1.5}px`, lineHeight: `${fontSize * 1.9}px`, minHeight: `${fontSize * 1.9}px`, fontWeight: 600 };
        content = <><span className="source-syntax">{h2Match[1]}</span>{renderInlineStyles(h2Match[2])}</>;
      } else if (h3Match) {
        lineStyle = { ...lineStyle, fontSize: `${fontSize * 1.3}px`, lineHeight: `${fontSize * 1.7}px`, minHeight: `${fontSize * 1.7}px`, fontWeight: 600 };
        content = <><span className="source-syntax">{h3Match[1]}</span>{renderInlineStyles(h3Match[2])}</>;
      } else if (h4Match) {
        lineStyle = { ...lineStyle, fontSize: `${fontSize * 1.15}px`, lineHeight: `${fontSize * 1.5}px`, minHeight: `${fontSize * 1.5}px`, fontWeight: 500 };
        content = <><span className="source-syntax">{h4Match[1]}</span>{renderInlineStyles(h4Match[2])}</>;
      } else if (h5Match) {
        lineStyle = { ...lineStyle, fontSize: `${fontSize * 1.05}px`, fontWeight: 500 };
        content = <><span className="source-syntax">{h5Match[1]}</span>{renderInlineStyles(h5Match[2])}</>;
      } else if (h6Match) {
        lineStyle = { ...lineStyle, fontSize: `${fontSize}px`, fontWeight: 500, opacity: 0.85 };
        content = <><span className="source-syntax">{h6Match[1]}</span>{renderInlineStyles(h6Match[2])}</>;
      } else if (blockquoteMatch) {
        content = <><span className="source-syntax source-blockquote">{blockquoteMatch[1]}</span>{renderInlineStyles(blockquoteMatch[2])}</>;
      } else if (listMatch) {
        content = <><span className="source-syntax">{listMatch[1]}</span>{renderInlineStyles(listMatch[2])}</>;
      } else if (orderedListMatch) {
        content = <><span className="source-syntax">{orderedListMatch[1]}</span>{renderInlineStyles(orderedListMatch[2])}</>;
      } else {
        content = renderInlineStyles(line) || '\u200B';
      }

      return (
        <div key={i} className="source-line" style={lineStyle}>
          {content}
        </div>
      );
    });
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
    <div className="source-mode-container h-full overflow-auto flex justify-center" ref={containerRef} style={{ backgroundColor: 'var(--bg-color)' }}>
      {/* Centered content wrapper with line numbers inside */}
      <div className="relative" style={{ maxWidth: '900px', width: '100%' }}>
        {/* Line Numbers - positioned inside the centered area, to the left of content */}
        <div
          ref={lineNumbersRef}
          className="source-mode-line-numbers select-none absolute text-right pointer-events-none"
          style={{
            fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace',
            fontSize: `${fontSize * 0.8}px`,
            color: 'var(--control-text-color)',
            opacity: 0.3,
            width: '40px',
            left: '8px',
            top: '60px',
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

        {/* Syntax highlighted background layer */}
        <div
          ref={highlightRef}
          className="overflow-hidden pointer-events-none whitespace-pre-wrap break-words"
          style={{
            fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace',
            fontSize: `${fontSize}px`,
            lineHeight: `${baseLineHeight}px`,
            color: 'var(--text-color)',
            padding: '60px 60px 100px 60px',
          }}
          aria-hidden="true"
        >
          {renderHighlightedContent()}
        </div>

        {/* Transparent textarea for editing */}
        <textarea
          ref={textareaRef}
          className="absolute inset-0 w-full h-full resize-none outline-none border-none"
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          placeholder="Type your markdown source here..."
          spellCheck={false}
          style={{
            fontFamily: 'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, monospace',
            fontSize: `${fontSize}px`,
            lineHeight: `${baseLineHeight}px`,
            color: 'transparent',
            backgroundColor: 'transparent',
            caretColor: 'var(--primary-color)',
            padding: '60px 60px 100px 60px',
            WebkitTextFillColor: 'transparent',
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
  onStatsUpdate?: (stats: { words: number; characters: number; blockType: string }) => void;
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
      onStatsUpdate({ words, characters, blockType });
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
      Markdown.configure({
        html: true, // Enable HTML
        breaks: true, // Treat newlines as hard breaks
        transformPastedText: true,
        transformCopiedText: true,
        bulletListMarker: '-',
        extensions: [
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



  useEffect(() => {
    const removeListener = window.electron.on('menu-action', (_: any, action: string) => {
      if (action === 'toggle-source-mode') {
        toggleMode();
      }
    });
    return () => removeListener?.();
  }, [viewMode, editor, content]);


  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto w-full" id="typora-content-area">
        {viewMode === 'preview' ? (
          <EditorContent editor={editor} className="min-h-full" />
        ) : (
          <SourceModeEditor
            content={content}
            onChange={(value) => {
              setContent(value);
              onSave && onSave(value);
            }}
            fontSize={fontSize}
          />
        )}
      </div>
    </div>
  );
});

export default Editor;
