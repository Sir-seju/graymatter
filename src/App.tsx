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
  autoSave: 'typora-auto-save',
  autoSaveDelay: 'typora-auto-save-delay',
  hideScrollbars: 'typora-hide-scrollbars',
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

  // Sidebar Width (resizable)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('typora-sidebar-width');
    return saved ? parseInt(saved, 10) : 280;
  });

  // Tab bar auto-hide (start hidden for clean look)
  const [isTitleBarVisible, setIsTitleBarVisible] = useState(false);

  // Preferences State (load from localStorage)
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.theme) || 'night';
  });
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.fontSize);
    return saved ? parseInt(saved, 10) : 16;
  });
  const [autoSave, setAutoSave] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.autoSave);
    return saved !== null ? saved === 'true' : true;
  });
  const [autoSaveDelay, setAutoSaveDelay] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.autoSaveDelay);
    return saved ? parseInt(saved, 10) : 5000;
  });
  const [hideScrollbars, setHideScrollbars] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.hideScrollbars);
    return saved === 'true';
  });

  // Editor ref for search commands
  const editorRef = useRef<EditorHandle>(null);

  // Stats State
  const [stats, setStats] = useState<{ words: number; characters: number; blockType: string; selection?: { words: number; chars: number } | null }>({ words: 0, characters: 0, blockType: 'paragraph', selection: null });

  // Zoom State
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle sidebar width change
  const handleSidebarWidthChange = (newWidth: number) => {
    setSidebarWidth(newWidth);
    localStorage.setItem('typora-sidebar-width', String(newWidth));
  };

  // Refs to access latest state in event listeners without re-binding
  const tabsRef = useRef(tabs);
  const activeTabIdRef = useRef(activeTabId);
  // Track recently saved files to avoid reloading them from our own save
  const recentlySavedRef = useRef<Set<string>>(new Set());

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
      switchToTab(existingTab.id);
      return;
    }

    // Save current tab before opening new one
    const currentTab = tabsRef.current.find(t => t.id === activeTabIdRef.current);
    if (currentTab?.path && currentTab.isDirty) {
      saveTabSilently(currentTab);
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

  const handleStatsUpdate = (newStats: { words: number; characters: number; blockType: string; selection?: { words: number; chars: number } | null }) => {
    setStats(newStats);
  };

  // Silent save - saves a tab with an existing path without prompting
  const saveTabSilently = async (tab: typeof tabs[0]) => {
    if (!tab.path || !tab.isDirty) return;

    try {
      recentlySavedRef.current.add(tab.path);
      setTimeout(() => recentlySavedRef.current.delete(tab.path!), 500);

      await window.electron.writeFile(tab.path, tab.content);
      setTabs(prev => prev.map(t =>
        t.id === tab.id ? { ...t, isDirty: false } : t
      ));
    } catch (error) {
      console.error("Silent save failed", error);
      recentlySavedRef.current.delete(tab.path);
    }
  };

  // Switch tab with autosave of current tab
  const switchToTab = (newTabId: string) => {
    if (newTabId === activeTabId) return;

    // Save current tab before switching (if it has a path and is dirty)
    const currentTab = tabsRef.current.find(t => t.id === activeTabId);
    if (currentTab?.path && currentTab.isDirty) {
      // Save silently in background
      saveTabSilently(currentTab);
    }

    setActiveTabId(newTabId);
  };

  // Save Logic (with prompt for new files)
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
        // Mark as recently saved to ignore the file-changed event from our own save
        recentlySavedRef.current.add(path);
        setTimeout(() => recentlySavedRef.current.delete(path), 500); // Clear after 500ms

        await window.electron.writeFile(path, currentTab.content);
        // Mark as clean
        setTabs(prev => prev.map(t =>
          t.id === currentTab.id ? { ...t, isDirty: false, path: path } : t
        ));
      } catch (error) {
        console.error("Save failed", error);
        // Remove from recently saved on error
        recentlySavedRef.current.delete(path);
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
      // Toggle Source Mode: Cmd+/
      if (isMod && e.key === '/') {
        e.preventDefault();
        editorRef.current?.toggleSourceMode();
      }
      // Toggle Sidebar: Cmd+Shift+L (matches menu.ts)
      if (isMod && e.shiftKey && e.key === 'l') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
      // Open Folder: Cmd+Shift+O
      if (isMod && e.shiftKey && e.key === 'o') {
        e.preventDefault();
        // Dispatch event to open folder dialog
        window.electron.openFolder();
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

    // Set native theme for system UI (dictionary popup, etc.)
    const isLightTheme = themeName === 'solarizedLight';
    window.electron.setNativeTheme(isLightTheme ? 'light' : 'dark');
  };

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.fontSize, fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.autoSave, autoSave.toString());
  }, [autoSave]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.autoSaveDelay, autoSaveDelay.toString());
  }, [autoSaveDelay]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.hideScrollbars, hideScrollbars.toString());
    // Apply/remove hide-scrollbars class on html element
    if (hideScrollbars) {
      document.documentElement.classList.add('hide-scrollbars');
    } else {
      document.documentElement.classList.remove('hide-scrollbars');
    }
  }, [hideScrollbars]);

  const cycleTheme = () => {
    const currentIndex = themeNames.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeNames.length;
    const nextTheme = themeNames[nextIndex];
    handleThemeSelect(nextTheme);
  };

  // Apply initial theme on mount
  useEffect(() => {
    applyTheme(theme);
    // Set native theme for system UI
    const isLightTheme = theme === 'solarizedLight';
    window.electron.setNativeTheme(isLightTheme ? 'light' : 'dark');
  }, []);

  // Autosave when window loses focus (user switches apps)
  useEffect(() => {
    const handleWindowBlur = () => {
      // Save all dirty tabs that have paths when window loses focus
      tabsRef.current.forEach(tab => {
        if (tab.path && tab.isDirty) {
          saveTabSilently(tab);
        }
      });
    };

    window.addEventListener('blur', handleWindowBlur);
    return () => window.removeEventListener('blur', handleWindowBlur);
  }, []);

  // Listen for zoom changes
  useEffect(() => {
    const removeListener = window.electron.on('zoom-changed', (_: any, percentage: number) => {
      setZoomLevel(percentage);
      setShowZoomIndicator(true);

      // Clear existing timeout
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }

      // Always hide indicator after 3 seconds
      zoomTimeoutRef.current = setTimeout(() => {
        setShowZoomIndicator(false);
      }, 3000);
    });

    return () => {
      removeListener();
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
    };
  }, []);

  // Listen for external file changes and reload content
  useEffect(() => {
    const removeListener = window.electron.on('file-changed', async (_: any, data: { eventType: string; fullPath: string }) => {
      const { eventType, fullPath } = data;

      // Ignore if this was our own save
      if (recentlySavedRef.current.has(fullPath)) {
        return;
      }

      // Check if the changed file is open in any tab
      const affectedTab = tabsRef.current.find(tab => tab.path === fullPath);

      if (affectedTab) {
        // For rename events (which include deletions), check if file still exists
        if (eventType === 'rename') {
          const exists = await window.electron.fileExists(fullPath);
          if (!exists) {
            // File was deleted - convert tab to unsaved state so user can save elsewhere
            // Clear the path so it becomes "Untitled" and mark as dirty
            setTabs(prev => prev.map(tab =>
              tab.path === fullPath
                ? {
                    ...tab,
                    path: null,
                    isDirty: true
                  }
                : tab
            ));
            return;
          }
        }

        // Only reload if the tab is not currently dirty (has unsaved changes)
        // This prevents overwriting user's unsaved work
        if (!affectedTab.isDirty) {
          try {
            const newContent = await window.electron.readFile(fullPath);
            setTabs(prev => prev.map(tab =>
              tab.path === fullPath
                ? { ...tab, content: newContent }
                : tab
            ));
          } catch (err) {
            console.error('Failed to reload file:', fullPath, err);
          }
        }
      }
    });

    return () => removeListener();
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col" style={{ backgroundColor: 'var(--bg-color, #fff)' }}>
      {/* Main Content Area - Full Screen */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Sidebar with integrated drag bar - smooth animation */}
        <div
          className="h-full flex-shrink-0 relative transition-all duration-300 ease-in-out overflow-hidden"
          style={{
            width: isSidebarOpen ? `${sidebarWidth}px` : '0px',
            opacity: isSidebarOpen ? 1 : 0
          }}
        >
          <Sidebar
            currentPath={activeTab.path}
            onFileSelect={handleFileSelect}
            onClose={() => setSidebarOpen(false)}
            onToggle={() => setSidebarOpen(prev => !prev)}
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
            width={sidebarWidth}
            onWidthChange={handleSidebarWidthChange}
            onSettingsClick={() => setIsPreferencesOpen(true)}
          />
        </div>

        {/* Status Pill */}
        <StatusPill
          themeName={theme}
          wordCount={stats.words}
          lineCount={activeTab.content.split('\n').length}
          selectionStats={stats.selection}
          onThemeClick={cycleTheme}
          onSourceClick={() => editorRef.current?.toggleSourceMode()}
        />

        {/* Zoom Indicator */}
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-sm transition-all duration-300 ease-out ${
            showZoomIndicator
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
          }`}
          style={{
            backgroundColor: 'color-mix(in srgb, var(--side-bar-bg-color) 85%, transparent)',
            border: '1px solid var(--window-border)',
            color: 'var(--text-color)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
              <path d="M11 8v6"/>
              <path d="M8 11h6"/>
            </svg>
            <span className="text-sm font-semibold tabular-nums" style={{ minWidth: '3ch' }}>{zoomLevel}%</span>
          </div>
          {zoomLevel !== 100 && (
            <button
              onClick={() => window.electron.resetZoom()}
              className="text-xs px-2.5 py-1 rounded-md font-medium transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                backgroundColor: 'var(--primary-color)',
                color: 'white',
              }}
            >
              Reset
            </button>
          )}
        </div>

        {/* Editor Area with Tabs */}
        <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ backgroundColor: 'var(--bg-color, #fff)' }}>

          {/* Tab Bar - Auto-hide with draggable area */}
          <div
            className={`flex items-center overflow-x-auto no-scrollbar transition-all duration-300 ease-in-out origin-top ${isTitleBarVisible ? 'h-[35px] opacity-100' : 'h-0 opacity-0'}`}
            style={{
              backgroundColor: 'var(--side-bar-bg-color)',
              borderBottom: isTitleBarVisible ? '1px solid var(--window-border)' : 'none',
              WebkitAppRegion: 'drag',
              paddingLeft: isSidebarOpen ? '0px' : '80px' // Space for traffic lights when sidebar is closed
            } as any}
          >
            {tabs.map(tab => {
              const fileName = tab.path ? tab.path.split('/').pop() : 'Untitled-1';
              const isActive = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  onClick={() => switchToTab(tab.id)}
                  className="group flex-shrink-0 min-w-[120px] flex items-center px-4 py-1.5 cursor-pointer text-sm select-none transition-colors"
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
              setTheme={handleThemeSelect}
              fontSize={fontSize}
              setFontSize={setFontSize}
              autoSave={autoSave}
              setAutoSave={setAutoSave}
              autoSaveDelay={autoSaveDelay}
              setAutoSaveDelay={setAutoSaveDelay}
              hideScrollbars={hideScrollbars}
              setHideScrollbars={setHideScrollbars}
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
