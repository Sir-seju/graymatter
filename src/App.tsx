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

  const handleFileSelect = async (path: string) => {
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
    if (activeTab.path) {
      setIsRenaming(true);
      setRenameValue(activeTab.path.split('/').pop() || '');
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
          // alert("Renaming failed");
        }
      }
    }
    setIsRenaming(false);
  };

  const handleStatsUpdate = (newStats: { words: number; characters: number; blockType: string }) => {
    setStats(newStats);
  };

  // Handle Menu Actions
  useEffect(() => {
    const removeListener = window.electron.on('menu-action', (_: any, action: string) => {
      if (action === 'toggle-sidebar') {
        setSidebarOpen(prev => !prev);
      }
      if (action === 'find') {
        setIsSearchOpen(true);
      }
      if (action === 'open-preferences') {
        setIsPreferencesOpen(true);
      }
      if (action === 'save') {
        const currentTab = tabsRef.current.find(t => t.id === activeTabIdRef.current);
        if (currentTab && currentTab.path) {
          window.electron.writeFile(currentTab.path, currentTab.content).then(() => {
            // Mark as clean on save
            setTabs(prev => prev.map(t =>
              t.id === currentTab.id ? { ...t, isDirty: false } : t
            ));
          });
        }
      }
    });
    return () => removeListener();
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
      {/* Title Bar - Draggable */}
      <div
        className="titlebar h-[38px] w-full fixed top-0 left-0 z-50 flex items-center justify-center pointer-events-none"
        style={{
          backgroundColor: 'var(--side-bar-bg-color, #fafafa)',
          borderBottom: 'var(--window-border, 1px solid #e5e5e5)'
        }}
      >
        {/* Filename / Rename Input - Center - Pointer events allowed here */}
        <div className="pointer-events-auto flex items-center z-50">
          {isRenaming ? (
            <input
              autoFocus
              className="text-sm font-medium text-center bg-white border border-blue-500 rounded px-1 outline-none min-w-[200px]"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={finishRenaming}
              onKeyDown={(e) => {
                if (e.key === 'Enter') finishRenaming();
                if (e.key === 'Escape') setIsRenaming(false);
              }}
            />
          ) : (
            <span
              onClick={startRenaming}
              className="text-sm font-medium truncate max-w-[400px] cursor-text hover:bg-gray-100 rounded px-2 py-0.5 transition-colors"
              style={{ color: 'var(--text-color, #333)' }}
              title="Click to rename"
            >
              {activeTab.path ? activeTab.path.split('/').pop() : 'Untitled'}
            </span>
          )}
        </div>

        {/* Placeholder for draggable area */}
        <div className="absolute inset-0" style={{ WebkitAppRegion: 'drag' } as any}></div>
      </div>

      {/* Main Content Area - Below Titlebar */}
      <div className="flex-1 flex overflow-hidden relative mt-[38px]">

        {/* Sidebar */}
        <div
          className="h-full border-r"
          style={{
            display: isSidebarOpen ? 'block' : 'none',
            borderColor: 'var(--window-border, #ddd)',
            width: '250px' // Fixed width for sidebar logic
          } as any}
        >
          <Sidebar
            currentPath={activeTab.path}
            onFileSelect={handleFileSelect}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        {/* Status Pill */}
        <StatusPill
          themeName={theme}
          wordCount={stats.words}
          onThemeClick={cycleTheme}
          onSourceClick={() => editorRef.current?.toggleSourceMode()}
        />

        {/* Editor Area with Tabs */}
        <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ backgroundColor: 'var(--bg-color, #fff)' }}>

          {/* Tab Bar */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto no-scrollbar h-[35px]">
            {tabs.map(tab => {
              const fileName = tab.path ? tab.path.split('/').pop() : 'Untitled-1';
              const isActive = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`
                     group flex items-center px-4 py-1.5 min-w-[120px] max-w-[200px] border-r border-gray-200 dark:border-gray-700 cursor-pointer text-sm select-none
                     ${isActive ? 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-t-2 border-t-blue-500' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}
                   `}
                >
                  <span className="truncate flex-1">{fileName}</span>
                  {tab.isDirty && <span className="w-2 h-2 rounded-full bg-blue-500 ml-2 group-hover:hidden"></span>}
                  <span
                    onClick={(e) => handleCloseTab(e, tab.id)}
                    className={`ml-2 opacity-0 group-hover:opacity-100 hover:bg-gray-300 dark:hover:bg-gray-600 rounded p-0.5 text-gray-500 ${tab.isDirty ? 'hidden group-hover:block' : ''}`}
                  >
                    ✕
                  </span>
                </div>
              );
            })}
            {/* New Tab Button */}
            <div
              onClick={handleNewTab}
              className="px-3 py-1.5 text-gray-500 hover:text-gray-800 cursor-pointer"
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
