import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import { EditorContent, ReactNodeViewRenderer, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { common, createLowlight } from 'lowlight';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Markdown } from 'tiptap-markdown';
import CodeBlockComponent from './CodeBlockComponent';
import { HeadingExtension } from './extensions/HeadingExtension';
import { InlineMathExtension } from './extensions/InlineMathExtension';
import { MathExtension } from './extensions/MathExtension';
import { Search } from './extensions/SearchExtension';

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
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockComponent)
        },
      }).configure({
        lowlight: createLowlight(common),
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
      Search,
      CharacterCount,
      TaskItem.configure({
        nested: true,
      }),
      TaskList,
      Markdown.configure({
        html: true, // Enable HTML
        breaks: false,
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
          <div className="max-w-5xl mx-auto p-8 h-full">
            <textarea
              className="w-full h-full resize-none outline-none border-none source-mode-textarea bg-transparent text-gray-800 dark:text-gray-200 font-mono"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                onSave && onSave(e.target.value);
              }}
              placeholder="Type your markdown source here..."
              spellCheck={false}
              style={{ fontSize: `${fontSize}px` }}
            />
          </div>
        )}
      </div>
    </div>
  );
});

export default Editor;
