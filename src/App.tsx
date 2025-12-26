import { useEffect, useRef, useState } from 'react';
import Editor, { EditorHandle } from './components/Editor';
import PreferencesModal from './components/PreferencesModal';
import SearchBox from './components/SearchBox';
import Sidebar from './components/Sidebar';
import StatusPill from './components/StatusPill';
import { applyTheme, themeNames } from './utils/themeDefinitions';

const STORAGE_KEYS = {
  theme: 'typora-theme',
  fontSize: 'typora-font-size',
};

interface Tab {
  id: string;
  path: string | null;
  content: string;
  isDirty: boolean;
  scrollTop?: number;
}

function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [tabs, setTabs] = useState<Tab[]>([{ id: crypto.randomUUID(), path: null, content: '', isDirty: false }]);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);

  // Renaming State
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sidebar Width (fixed)
  const sidebarWidth = 280;

  // Tab bar auto-hide (start hidden for clean look)
  const [isTitleBarVisible, setIsTitleBarVisible] = useState(false);

  // Preferences State (load from localStorage)
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.theme) || 'system';
  });
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.fontSize);
    return saved ? parseInt(saved, 10) : 16;
  });

  // Editor ref for search commands
  const editorRef = useRef<EditorHandle>(null);

  // Stats State
  const [stats, setStats] = useState({ words: 0, characters: 0, blockType: 'paragraph' });

  // Refs to access latest state in event listeners without re-binding
  const tabsRef = useRef(tabs);
  const activeTabIdRef = useRef(activeTabId);

  useEffect(() => {
    tabsRef.current = tabs;
    activeTabIdRef.current = activeTabId;
  }, [tabs, activeTabId]);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const handleFileSelect = async (path: string, searchTerm?: string) => {
    // If searchTerm provided, set it for editor highlighting
    if (searchTerm) {
      setSearchQuery(searchTerm);
    }

    // Check if file is already open
    const existingTab = tabs.find(t => t.path === path);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    // Open in new tab
    const content = await window.electron.readFile(path);
    const newTab: Tab = {
      id: crypto.randomUUID(),
      path,
      content,
      isDirty: false
    };

    // If current tab is empty (Untitled) and not dirty, replace it? 
    if (tabs.length === 1 && !tabs[0].path && !tabs[0].content && !tabs[0].isDirty) {
      setTabs([newTab]);
    } else {
      setTabs(prev => [...prev, newTab]);
    }
    setActiveTabId(newTab.id);
  };

  const handleContentUpdate = (newContent: string) => {
    setTabs(prev => prev.map(tab =>
      tab.id === activeTabId
        ? { ...tab, content: newContent, isDirty: true }
        : tab
    ));
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    const newTabs = tabs.filter(t => t.id !== tabId);
    if (newTabs.length === 0) {
      const newTab = { id: crypto.randomUUID(), path: null, content: '', isDirty: false };
      setTabs([newTab]);
      setActiveTabId(newTab.id);
    } else {
      setTabs(newTabs);
      if (activeTabId === tabId) {
        // Switch to the previous one or next one
        const index = tabs.findIndex(t => t.id === tabId);
        const newActive = newTabs[Math.max(0, index - 1)];
        setActiveTabId(newActive.id);
      }
    }
  };

  const handleNewTab = () => {
    const newTab = { id: crypto.randomUUID(), path: null, content: '', isDirty: false };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }

  const startRenaming = () => {
    console.log("startRenaming called", activeTab);
    if (activeTab.path) {
      console.log("Setting isRenaming to true");
      setIsRenaming(true);
      setRenameValue(activeTab.path.split('/').pop() || '');
    } else {
      console.log("No path for active tab, cannot rename (should trigger save)");
    }
  };

  const finishRenaming = async () => {
    if (isRenaming && activeTab.path && renameValue) {
      const oldPath = activeTab.path;
      const parentIndent = oldPath.lastIndexOf('/');
      const parentDir = oldPath.substring(0, parentIndent);
      const newPath = `${parentDir}/${renameValue}`;

      if (oldPath !== newPath) {
        try {
          await window.electron.renamePath(oldPath, newPath);
          setTabs(prev => prev.map(t => t.id === activeTab.id ? { ...t, path: newPath } : t));
        } catch (error) {
          console.error("Renaming failed", error);
        }
      }
    }
    setIsRenaming(false);
  };

  const handleStatsUpdate = (newStats: { words: number; characters: number; blockType: string }) => {
    setStats(newStats);
  };

  // Save Logic
  const saveFile = async () => {
    const currentTab = tabsRef.current.find(t => t.id === activeTabIdRef.current);
    if (!currentTab) return;

    let path = currentTab.path;

    // If no path (Untitled), ask where to save
    if (!path) {
      const filePath = await window.electron.showSaveDialog();
      if (!filePath) return; // User canceled
      path = filePath;
      // Update tab path immediately so subsequent saves work
      setTabs(prev => prev.map(t =>
        t.id === currentTab.id ? { ...t, path: filePath } : t
      ));
    }

    if (path) {
      try {
        await window.electron.writeFile(path, currentTab.content);
        // Mark as clean
        setTabs(prev => prev.map(t =>
          t.id === currentTab.id ? { ...t, isDirty: false, path: path } : t
        ));
      } catch (error) {
        console.error("Save failed", error);
      }
    }
  };

  // Tab bar auto-hide on mouse position (only over editor area)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Only auto-hide when mouse is over editor area (X > sidebar width)
      const isOverEditor = e.clientX > (isSidebarOpen ? sidebarWidth : 0);

      if (isOverEditor) {
        // Show tab bar when mouse is in top 50px of editor area
        if (e.clientY <= 50) {
          setIsTitleBarVisible(true);
        } else if (e.clientY > 80) {
          setIsTitleBarVisible(false);
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [isSidebarOpen, sidebarWidth]);

  // Handle Menu Actions
  useEffect(() => {
    const removeListener = window.electron.on('menu-action', (_: any, action: string) => {
      if (action === 'toggle-sidebar') {
        setSidebarOpen(prev => !prev);
      }
      if (action === 'find') {
        setIsSearchOpen(prev => !prev); // Toggle
        // If opening, focus is handled by SearchBox autoFocus
      }
      if (action === 'open-preferences') {
        setIsPreferencesOpen(true);
      }
      if (action === 'save') {
        saveFile();
      }
      if (action === 'toggle-source-mode') {
        editorRef.current?.toggleSourceMode();
      }
      // Format actions
      if (action === 'format-bold') {
        editorRef.current?.toggleBold();
      }
      if (action === 'format-italic') {
        editorRef.current?.toggleItalic();
      }
      if (action === 'format-underline') {
        editorRef.current?.toggleUnderline();
      }
      if (action === 'format-strike') {
        editorRef.current?.toggleStrike();
      }
      if (action === 'format-highlight') {
        editorRef.current?.toggleHighlight();
      }
      if (action === 'format-code') {
        editorRef.current?.toggleCode();
      }
      // Paragraph actions
      if (action === 'heading-1') editorRef.current?.setHeading(1);
      if (action === 'heading-2') editorRef.current?.setHeading(2);
      if (action === 'heading-3') editorRef.current?.setHeading(3);
      if (action === 'heading-4') editorRef.current?.setHeading(4);
      if (action === 'heading-5') editorRef.current?.setHeading(5);
      if (action === 'heading-6') editorRef.current?.setHeading(6);
      if (action === 'paragraph') editorRef.current?.setParagraph();
      if (action === 'blockquote') editorRef.current?.toggleBlockquote();
      if (action === 'ordered-list') editorRef.current?.toggleOrderedList();
      if (action === 'bullet-list') editorRef.current?.toggleBulletList();
      if (action === 'task-list') editorRef.current?.toggleTaskList();
      if (action === 'horizontal-rule') editorRef.current?.insertHorizontalRule();
      if (action === 'code-block') editorRef.current?.toggleCodeBlock();
      // Export actions
      if (action === 'export-pdf') {
        (window.electron as any).exportPdf();
      }
      if (action === 'export-html') {
        // Get HTML from the editor content
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${activeTab.path ? activeTab.path.split('/').pop() : 'Document'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
    code { background: #f5f5f5; padding: 2px 5px; border-radius: 3px; }
    blockquote { border-left: 4px solid #ddd; padding-left: 16px; margin-left: 0; color: #666; }
  </style>
</head>
<body>
${activeTab.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
</body>
</html>`;
        (window.electron as any).exportHtml(htmlContent);
      }
    });

    // Global Keyboard Listeners (Backup for reliability)
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key === 's') {
        e.preventDefault();
        saveFile();
      }
      // Format shortcuts backup
      if (isMod && e.shiftKey && e.key === 'u') {
        e.preventDefault();
        editorRef.current?.toggleSourceMode();
      }
      if (isMod && !e.shiftKey && e.key === 'b') {
        e.preventDefault();
        editorRef.current?.toggleBold();
      }
      if (isMod && !e.shiftKey && e.key === 'i') {
        e.preventDefault();
        editorRef.current?.toggleItalic();
      }
      if (isMod && !e.shiftKey && e.key === 'u') {
        e.preventDefault();
        editorRef.current?.toggleUnderline();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      removeListener();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Handle Theme Selection using CSS variables
  const handleThemeSelect = (themeName: string) => {
    setTheme(themeName);
    localStorage.setItem(STORAGE_KEYS.theme, themeName);
    applyTheme(themeName);
  };

  // Save fontSize to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.fontSize, fontSize.toString());
  }, [fontSize]);

  const cycleTheme = () => {
    const currentIndex = themeNames.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeNames.length;
    const nextTheme = themeNames[nextIndex];
    handleThemeSelect(nextTheme);
  };

  // Apply initial theme on mount
  useEffect(() => {
    applyTheme(theme);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col" style={{ backgroundColor: 'var(--bg-color, #fff)' }}>
      {/* Main Content Area - Full Screen */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Sidebar with integrated drag bar */}
        <div
          className="h-full flex-shrink-0 relative"
          style={{
            display: isSidebarOpen ? 'flex' : 'none',
            width: `${sidebarWidth}px`
          }}
        >
          <Sidebar
            currentPath={activeTab.path}
            onFileSelect={handleFileSelect}
            onClose={() => setSidebarOpen(false)}
            onRename={(oldPath, newPath) => {
              setTabs(prev => prev.map(t => {
                if (t.path === oldPath) return { ...t, path: newPath };
                // Also handle cleaning up children paths if folder rename? 
                // For now just file rename.
                if (t.path?.startsWith(oldPath + '/')) {
                  return { ...t, path: t.path.replace(oldPath, newPath) };
                }
                return t;
              }));
            }}
            onScrollToLine={(line) => editorRef.current?.scrollToLine(line)}
            activeContent={activeTab.content}
          />
        </div>

        {/* Status Pill */}
        <StatusPill
          themeName={theme}
          wordCount={stats.words}
          lineCount={activeTab.content.split('\n').length}
          onThemeClick={cycleTheme}
          onSourceClick={() => editorRef.current?.toggleSourceMode()}
        />

        {/* Editor Area with Tabs */}
        <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ backgroundColor: 'var(--bg-color, #fff)' }}>

          {/* Tab Bar - Auto-hide with draggable area */}
          {isTitleBarVisible && (
            <div
              className="flex items-center overflow-x-auto no-scrollbar h-[35px]"
              style={{
                backgroundColor: 'var(--side-bar-bg-color)',
                borderBottom: '1px solid var(--window-border)',
                WebkitAppRegion: 'drag'
              } as any}
            >
              {tabs.map(tab => {
                const fileName = tab.path ? tab.path.split('/').pop() : 'Untitled-1';
                const isActive = tab.id === activeTabId;
                return (
                  <div
                    key={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    className="group flex items-center px-4 py-1.5 cursor-pointer text-sm select-none transition-colors"
                    style={{
                      WebkitAppRegion: 'no-drag',
                      backgroundColor: isActive ? 'var(--bg-color)' : 'transparent',
                      color: isActive ? 'var(--text-color)' : 'var(--control-text-color)',
                      borderRight: '1px solid var(--window-border)',
                      borderTop: isActive ? '2px solid var(--primary-color)' : '2px solid transparent'
                    } as any}
                  >
                    <span className="whitespace-nowrap">{fileName}</span>
                    {tab.isDirty && <span className="w-2 h-2 rounded-full ml-2 group-hover:hidden" style={{ backgroundColor: 'var(--primary-color)' }}></span>}
                    <span
                      onClick={(e) => handleCloseTab(e, tab.id)}
                      className={`ml-2 opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-black/10 dark:hover:bg-white/10 ${tab.isDirty ? 'hidden group-hover:block' : ''}`}
                      style={{ color: 'var(--control-text-color)' }}
                    >
                      ✕
                    </span>
                  </div>
                );
              })}
              {/* New Tab Button */}
              <div
                onClick={handleNewTab}
                className="px-3 py-1.5 cursor-pointer text-lg hover:opacity-100 opacity-60 transition-opacity"
                style={{
                  color: 'var(--control-text-color)',
                  WebkitAppRegion: 'no-drag'
                } as any}
                title="New Tab"
              >
                +
              </div>
            </div>
          )}

          {/* Editor Instance */}
          <main className="flex-1 h-full overflow-hidden relative group/editor">

            {/* Search Box */}
            {isSearchOpen && (
              <SearchBox
                onSearch={setSearchQuery}
                onClose={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                onNext={() => editorRef.current?.findNext()}
                onPrev={() => editorRef.current?.findPrev()}
                onReplace={(replacement) => editorRef.current?.replaceCurrent(replacement)}
                onReplaceAll={(search, replacement) => editorRef.current?.replaceAll(search, replacement)}
              />
            )}

            {/* Preferences Modal */}
            <PreferencesModal
              isOpen={isPreferencesOpen}
              onClose={() => setIsPreferencesOpen(false)}
              theme={theme}
              setTheme={setTheme}
              fontSize={fontSize}
              setFontSize={setFontSize}
            />



            <Editor
              ref={editorRef}
              key={activeTabId}
              initialContent={activeTab.content}
              basePath={activeTab.path ? activeTab.path.substring(0, activeTab.path.lastIndexOf('/')) : null}
              searchQuery={searchQuery}
              onSave={handleContentUpdate}
              onStatsUpdate={handleStatsUpdate}
              theme={theme}
              fontSize={fontSize}
            />
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
