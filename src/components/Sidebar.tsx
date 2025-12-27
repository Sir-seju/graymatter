import {
  AlignLeft,
  ChevronDown,
  ChevronRight,
  Clipboard,
  Copy,
  File,
  FilePlus,
  Files,
  Folder,
  FolderOpen,
  FolderPlus,
  Pencil,
  Search,
  Trash2
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface SidebarProps {
  currentPath: string | null;
  onFileSelect: (path: string, searchTerm?: string) => void;
  onClose: () => void;
  onRename?: (oldPath: string, newPath: string) => void;
  onScrollToLine?: (line: number) => void;
  activeContent?: string;
}

interface FileNode {
  name: string;
  path: string;
  kind: 'file' | 'directory';
  children?: FileNode[];
  isOpen?: boolean;
}

interface ContextMenuState {
  x: number;
  y: number;
  node: FileNode | null; // null means root folder context
}

const Sidebar: React.FC<SidebarProps> = ({ currentPath, onFileSelect, onClose, onRename, onScrollToLine, activeContent }) => {
  const [activeTab, setActiveTab] = useState<'files' | 'search' | 'outline'>('files');
  const [rootPath, setRootPath] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [clipboard, setClipboard] = useState<{ path: string; name: string } | null>(null);
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ file: string; line: number; content: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [isWholeWord, setIsWholeWord] = useState(false);
  const [isRegex, setIsRegex] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  // Group results by file
  const groupedResults = React.useMemo(() => {
    const groups: Record<string, Array<{ line: number; content: string }>> = {};
    searchResults.forEach(r => {
      if (!groups[r.file]) groups[r.file] = [];
      groups[r.file].push({ line: r.line, content: r.content });
    });
    return groups;
  }, [searchResults]);

  const totalMatches = searchResults.length;
  const totalFiles = Object.keys(groupedResults).length;

  // Outline State
  const [outline, setOutline] = useState<Array<{ level: number; text: string; line: number }>>([]);

  // Parse Outline when activeContent changes
  useEffect(() => {
    if (activeTab === 'outline' && activeContent) {
      const lines = activeContent.split('\n');
      const headers = lines.map((text, index) => {
        const match = text.match(/^(#{1,6})\s+(.*)$/);
        if (match) {
          // Strip markdown formatting from header text
          let cleanText = match[2]
            .replace(/\*\*(.+?)\*\*/g, '$1')  // Bold
            .replace(/\*(.+?)\*/g, '$1')      // Italic
            .replace(/_(.+?)_/g, '$1')        // Italic alt
            .replace(/`(.+?)`/g, '$1')        // Inline code
            .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
            .trim();
          return { level: match[1].length, text: cleanText, line: index };
        }
        return null;
      }).filter(item => item !== null) as Array<{ level: number; text: string; line: number }>;
      setOutline(headers);
    }
  }, [activeContent, activeTab]);

  // Handle Search (called by debounced effect or form submit)
  const executeSearch = async () => {
    if (!rootPath || !searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const result = await window.electron.searchFiles(searchQuery, rootPath);
      if (result.success && result.results) {
        setSearchResults(result.results);
        // Auto-expand all files on new search
        setExpandedFiles(new Set(result.results.map((r: any) => r.file)));
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced live search as you type
  useEffect(() => {
    if (activeTab !== 'search') return;
    const timer = setTimeout(() => {
      executeSearch();
    }, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [searchQuery, rootPath, activeTab]);

  // Form submit still triggers immediate search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  useEffect(() => {
    const savedRoot = localStorage.getItem('typora-sidebar-root');
    if (savedRoot) {
      setRootPath(savedRoot);
      loadDirectory(savedRoot).then(nodes => setFileTree(nodes));
    }
  }, []);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
  useEffect(() => {
    // Watch for file changes from system
    const removeListener = window.electron.on('file-changed', () => {
      refreshTree();
    });
    return () => removeListener();
  }, [rootPath]);

  // When root path changes, tell backend to watch it
  useEffect(() => {
    if (rootPath) {
      window.electron.watchFolder(rootPath);
    }
  }, [rootPath]);

  const loadDirectory = async (path: string): Promise<FileNode[]> => {
    try {
      const entries = await window.electron.readDir(path);
      const nodes: FileNode[] = entries.map((n: any) => ({
        name: n.name,
        path: n.path || `${path}/${n.name}`,
        kind: n.isDirectory ? 'directory' : 'file',
        children: n.isDirectory ? [] : undefined,
        isOpen: false
      }));
      nodes.sort((a, b) => {
        if (a.kind === b.kind) return a.name.localeCompare(b.name);
        return a.kind === 'directory' ? -1 : 1;
      });
      return nodes;
    } catch (err) {
      console.error("Failed to load directory", err);
      return [];
    }
  };

  const refreshTree = async () => {
    if (rootPath) {
      const nodes = await loadDirectory(rootPath);
      setFileTree(nodes);
    }
  };

  const handleOpenFolder = async () => {
    const path = await window.electron.openFolder();
    if (path) {
      setRootPath(path);
      localStorage.setItem('typora-sidebar-root', path);
      const nodes = await loadDirectory(path);
      setFileTree(nodes);
    }
  };

  const updateNodeInTree = (nodes: FileNode[], targetPath: string, updater: (node: FileNode) => FileNode): FileNode[] => {
    return nodes.map(node => {
      if (node.path === targetPath) {
        return updater(node);
      }
      if (node.children && node.children.length > 0) {
        return { ...node, children: updateNodeInTree(node.children, targetPath, updater) };
      }
      return node;
    });
  };

  const toggleFolder = async (node: FileNode) => {
    if (node.isOpen) {
      // Close folder
      setFileTree(prev => updateNodeInTree(prev, node.path, n => ({ ...n, isOpen: false })));
    } else {
      // Open and load children
      const children = await loadDirectory(node.path);
      setFileTree(prev => updateNodeInTree(prev, node.path, n => ({ ...n, isOpen: true, children })));
    }
  };

  const handleContextMenu = (e: React.MouseEvent, node: FileNode | null) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  // Handle right-click on root area (empty space)
  const handleRootContextMenu = (e: React.MouseEvent) => {
    // Only trigger if clicking directly on the container, not on a file/folder
    if (e.target === e.currentTarget && rootPath) {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, node: null });
    }
  };

  const handleDelete = async (node: FileNode) => {
    const confirmed = confirm(`Delete "${node.name}"?`);
    if (confirmed) {
      await window.electron.deletePath(node.path);
      refreshTree();
    }
    setContextMenu(null);
  };

  const handleRename = (node: FileNode) => {
    setRenamingNodeId(node.path);
    setRenameValue(node.name);
    setContextMenu(null);
  };

  const submitRename = async (node: FileNode) => {
    if (!renameValue || renameValue === node.name) {
      setRenamingNodeId(null);
      return;
    }

    try {
      const parentPath = node.path.substring(0, node.path.lastIndexOf('/'));
      const newPath = `${parentPath}/${renameValue}`;

      const result = await window.electron.renamePath(node.path, newPath);
      if (result.success) {
        onRename && onRename(node.path, newPath);
        refreshTree();
      } else {
        console.error("Rename failed", result.error);
        alert(`Rename failed: ${result.error}`);
      }
    } catch (error: any) {
      console.error("Rename exception", error);
    }
    setRenamingNodeId(null);
  };

  const handleNewFile = async (parentPath: string) => {
    const name = prompt("New file name:");
    if (name) {
      await window.electron.createFile(`${parentPath}/${name}`);
      refreshTree();
    }
    setContextMenu(null);
  };

  const handleNewFolder = async (parentPath: string) => {
    const name = prompt("New folder name:");
    if (name) {
      await window.electron.createFolder(`${parentPath}/${name}`);
      refreshTree();
    }
    setContextMenu(null);
  };

  // Copy file to clipboard
  const handleCopy = (node: FileNode) => {
    if (node.kind === 'file') {
      setClipboard({ path: node.path, name: node.name });
    }
    setContextMenu(null);
  };

  // Paste file from clipboard to target directory
  const handlePaste = async (targetDir: string) => {
    if (!clipboard) return;

    try {
      const destPath = `${targetDir}/${clipboard.name}`;
      await window.electron.copyFile(clipboard.path, destPath);
      refreshTree();
    } catch (err) {
      console.error('Failed to paste file:', err);
      alert('Failed to paste file');
    }
    setContextMenu(null);
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, node: FileNode) => {
    if (node.kind === 'file') {
      e.dataTransfer.setData('text/plain', node.path);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  // Handle drag over (for drop targets)
  const handleDragOver = (e: React.DragEvent, node: FileNode) => {
    if (node.kind === 'directory') {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverPath(node.path);
    }
  };

  // Handle drag over root area
  const handleDragOverRoot = (e: React.DragEvent) => {
    if (rootPath) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverPath(rootPath);
    }
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setDragOverPath(null);
  };

  // Handle drop on folder
  const handleDrop = async (e: React.DragEvent, targetDir: string) => {
    e.preventDefault();
    setDragOverPath(null);

    const sourcePath = e.dataTransfer.getData('text/plain');
    if (!sourcePath || sourcePath === targetDir) return;

    // Get filename from source path
    const fileName = sourcePath.split('/').pop();
    if (!fileName) return;

    // Don't move into self or subdirectory
    if (targetDir.startsWith(sourcePath + '/')) return;

    const destPath = `${targetDir}/${fileName}`;

    // Check if not same location
    const sourceDir = sourcePath.substring(0, sourcePath.lastIndexOf('/'));
    if (sourceDir === targetDir) return;

    try {
      await window.electron.renamePath(sourcePath, destPath);
      refreshTree();
    } catch (err) {
      console.error('Failed to move file:', err);
      alert('Failed to move file');
    }
  };

  // Handle external file drop (from Finder/Explorer)
  const handleExternalDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverPath(null);

    if (!rootPath) return;

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Read file and copy to root
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result;
        if (typeof content === 'string') {
          await window.electron.writeFile(`${rootPath}/${file.name}`, content);
          refreshTree();
        }
      };
      reader.readAsText(file);
    }
  };

  const renderNode = (node: FileNode, depth: number = 0) => {
    const isActive = currentPath === node.path;
    const paddingLeft = 12 + depth * 16;
    const isRenaming = renamingNodeId === node.path;
    const isDragOver = dragOverPath === node.path;

    if (node.kind === 'directory') {
      return (
        <div key={node.path}>
          <div
            className={`sidebar-item flex items-center py-1 px-2 cursor-pointer rounded transition-colors group hover:bg-gray-100 dark:hover:bg-gray-700/50 ${isDragOver ? 'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/30' : ''}`}
            style={{
              paddingLeft,
              backgroundColor: isDragOver ? undefined : (isActive ? 'var(--active-file-bg-color)' : 'transparent'),
              color: isActive ? 'var(--active-file-text-color)' : 'inherit'
            }}
            onClick={() => toggleFolder(node)}
            onContextMenu={(e) => handleContextMenu(e, node)}
            onDragOver={(e) => handleDragOver(e, node)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, node.path)}
          >
            {node.isOpen ? <ChevronDown size={12} className="mr-1 opacity-50" /> : <ChevronRight size={12} className="mr-1 opacity-50" />}
            {node.isOpen ? (
              <FolderOpen size={14} className="mr-2 opacity-80" style={{ color: 'var(--primary-color, #4a89dc)' }} />
            ) : (
              <Folder size={14} className="mr-2 opacity-80" style={{ color: 'var(--primary-color, #4a89dc)' }} />
            )}
            {isRenaming ? (
              <input
                autoFocus
                className="bg-transparent border-b border-blue-400 outline-none text-xs flex-1"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => submitRename(node)}
                onKeyDown={(e) => e.key === 'Enter' && submitRename(node)}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate text-xs flex-1 min-w-0">{node.name}</span>
            )}
          </div>
          {node.isOpen && node.children && (
            <div>
              {node.children.map(child => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={node.path}
        className="sidebar-item flex items-center py-1 px-2 cursor-pointer rounded transition-colors group hover:bg-gray-100 dark:hover:bg-gray-700/50"
        style={{
          paddingLeft,
          backgroundColor: isActive ? 'var(--active-file-bg-color)' : 'transparent',
          color: isActive ? 'var(--active-file-text-color)' : 'inherit'
        }}
        draggable
        onDragStart={(e) => handleDragStart(e, node)}
        onClick={() => onFileSelect(node.path)}
        onContextMenu={(e) => handleContextMenu(e, node)}
      >
        <File size={14} className="mr-2 opacity-50 flex-shrink-0" />
        {isRenaming ? (
          <input
            autoFocus
            className="bg-transparent border-b border-blue-400 outline-none text-xs flex-1"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={() => submitRename(node)}
            onKeyDown={(e) => e.key === 'Enter' && submitRename(node)}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate text-xs flex-1 min-w-0">{node.name}</span>
        )}
      </div>
    );
  };

  return (
    <div
      className="sidebar flex h-full text-[13px]"
      style={{
        backgroundColor: 'var(--side-bar-bg-color)',
        color: 'var(--control-text-color)',
        borderRight: '1px solid var(--window-border)'
      }}
    >
      {/* Left Icon Column (MarkText-style) */}
      <div
        className="flex flex-col justify-between w-[45px] pt-2 pb-4"
        style={{ borderRight: '1px solid var(--window-border)', opacity: 0.9 }}
      >
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-10 h-10 flex items-center justify-center rounded cursor-pointer transition-all"
            style={{
              backgroundColor: activeTab === 'files' ? 'var(--item-hover-bg-color)' : 'transparent',
              opacity: activeTab === 'files' ? 1 : 0.6
            }}
            onClick={() => setActiveTab('files')}
            title="Files"
          >
            <Files size={18} />
          </div>
          <div
            className="w-10 h-10 flex items-center justify-center rounded cursor-pointer transition-all"
            style={{
              backgroundColor: activeTab === 'search' ? 'var(--item-hover-bg-color)' : 'transparent',
              opacity: activeTab === 'search' ? 1 : 0.6
            }}
            onClick={() => setActiveTab('search')}
            title="Search"
          >
            <Search size={18} />
          </div>
          <div
            className="w-10 h-10 flex items-center justify-center rounded cursor-pointer transition-all"
            style={{
              backgroundColor: activeTab === 'outline' ? 'var(--item-hover-bg-color)' : 'transparent',
              opacity: activeTab === 'outline' ? 1 : 0.6
            }}
            onClick={() => setActiveTab('outline')}
            title="Outline"
          >
            <AlignLeft size={18} />
          </div>
        </div>
      </div>

      {/* Content Area Based on Tab */}
      <div className="flex-1 overflow-hidden flex flex-col relative">

        {/* FILES TAB */}
        <div className={`flex-col h-full ${activeTab === 'files' ? 'flex' : 'hidden'}`}>
          <div className="flex items-center justify-between px-3 h-[35px]" style={{ borderBottom: '1px solid var(--window-border)' }}>
            <span className="font-semibold text-xs tracking-wider uppercase opacity-70">
              {rootPath ? rootPath.split('/').pop() : 'NO FOLDER'}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); handleOpenFolder(); }}
                className="p-1 rounded opacity-60 hover:opacity-100 cursor-pointer"
                style={{ pointerEvents: 'auto' }}
                title="Open Folder"
              >
                <FolderOpen size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); if (rootPath) handleNewFile(rootPath); }}
                className="p-1 rounded opacity-60 hover:opacity-100 cursor-pointer disabled:opacity-30"
                style={{ pointerEvents: 'auto' }}
                disabled={!rootPath}
                title="New File"
              >
                <FilePlus size={14} />
              </button>
            </div>
          </div>

          <div
            className={`flex-1 overflow-y-auto px-1 ${dragOverPath === rootPath ? 'ring-2 ring-inset ring-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
            onDragOver={handleDragOverRoot}
            onDragLeave={handleDragLeave}
            onDrop={(e) => {
              if (e.dataTransfer.files.length > 0) handleExternalDrop(e);
              else if (rootPath) handleDrop(e, rootPath);
            }}
            onContextMenu={handleRootContextMenu}
          >
            {!rootPath ? (
              <div className="flex flex-col items-center justify-center h-full space-y-2">
                <div className="opacity-50 text-xs">No Folder Opened</div>
                <button onClick={handleOpenFolder} className="px-3 py-1 bg-blue-500 text-white rounded text-xs">Open Folder</button>
              </div>
            ) : (
              <div className="space-y-0.5 mt-1">{fileTree.map(node => renderNode(node))}</div>
            )}
          </div>
        </div>

        {/* SEARCH TAB */}
        <div className={`flex-col h-full bg-[var(--side-bar-bg-color)] ${activeTab === 'search' ? 'flex' : 'hidden'}`}>
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSearch} className="flex gap-1 mb-2">
              <input
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                placeholder="Search in folder..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600">
                <Search size={12} />
              </button>
            </form>
            {/* Search Options */}
            <div className="flex gap-1 justify-end">
              <button
                onClick={() => setIsCaseSensitive(!isCaseSensitive)}
                className={`px-2 py-0.5 text-[10px] rounded border ${isCaseSensitive ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 dark:border-gray-600 opacity-60 hover:opacity-100'}`}
                title="Case Sensitive"
              >Aa</button>
              <button
                onClick={() => setIsWholeWord(!isWholeWord)}
                className={`px-2 py-0.5 text-[10px] rounded border ${isWholeWord ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 dark:border-gray-600 opacity-60 hover:opacity-100'}`}
                title="Whole Word"
              >Ab</button>
              <button
                onClick={() => setIsRegex(!isRegex)}
                className={`px-2 py-0.5 text-[10px] rounded border ${isRegex ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 dark:border-gray-600 opacity-60 hover:opacity-100'}`}
                title="Regex"
              >.*</button>
            </div>
          </div>
          {/* Results Summary */}
          {totalMatches > 0 && (
            <div className="px-3 py-1 text-[10px] opacity-60 border-b border-gray-100 dark:border-gray-800">
              {totalMatches} {totalMatches === 1 ? 'match' : 'matches'} in {totalFiles} {totalFiles === 1 ? 'file' : 'files'}
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center opacity-50 text-xs">Searching...</div>
            ) : (
              totalMatches === 0 && searchQuery ? (
                <div className="p-4 text-center opacity-40 text-xs">No results found</div>
              ) : totalMatches === 0 ? (
                <div className="p-4 text-center opacity-40 text-xs">Enter search term</div>
              ) : (
                <div>
                  {Object.entries(groupedResults).map(([filePath, matches]) => {
                    const isExpanded = expandedFiles.has(filePath);
                    const fileName = filePath.split('/').pop() || filePath;
                    return (
                      <div key={filePath} className="border-b border-gray-100 dark:border-gray-800">
                        {/* File Header */}
                        <div
                          className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => {
                            const newSet = new Set(expandedFiles);
                            if (isExpanded) newSet.delete(filePath);
                            else newSet.add(filePath);
                            setExpandedFiles(newSet);
                          }}
                        >
                          <ChevronRight size={12} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          <span className="text-xs font-semibold flex-1 truncate" title={filePath}>{fileName}</span>
                          <span className="text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 rounded-full">{matches.length}</span>
                        </div>
                        {/* Matches */}
                        {isExpanded && (
                          <div className="pl-5 pb-1">
                            {matches.map((m, i) => {
                              // Highlight matched text
                              const idx = m.content.toLowerCase().indexOf(searchQuery.toLowerCase());
                              const before = idx >= 0 ? m.content.slice(0, idx) : m.content;
                              const match = idx >= 0 ? m.content.slice(idx, idx + searchQuery.length) : '';
                              const after = idx >= 0 ? m.content.slice(idx + searchQuery.length) : '';
                              return (
                                <div
                                  key={i}
                                  className="py-0.5 px-2 text-[11px] font-mono cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 truncate"
                                  onClick={() => onFileSelect(filePath, searchQuery)}
                                  title={`Line ${m.line}`}
                                >
                                  <span className="opacity-40 mr-1">{m.line}:</span>
                                  <span>{before}</span>
                                  <span className="bg-yellow-300 dark:bg-yellow-600 text-black dark:text-white rounded px-0.5">{match}</span>
                                  <span>{after}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>

        {/* OUTLINE TAB */}
        <div className={`flex-col h-full overflow-y-auto ${activeTab === 'outline' ? 'flex' : 'hidden'}`}>
          <div className="px-3 h-[35px] flex items-center text-xs font-semibold opacity-50 uppercase tracking-wider" style={{ borderBottom: '1px solid var(--window-border)' }}>Outline</div>
          {outline.length === 0 ? (
            <div className="p-4 text-center opacity-40 text-xs">No headers found</div>
          ) : (
            <div className="px-2 space-y-0.5 pb-4">
              {outline.map((item, i) => (
                <div
                  key={i}
                  className="py-1 px-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 text-xs truncate opacity-80 hover:opacity-100 transition-opacity"
                  style={{
                    marginLeft: (item.level - 1) * 12,
                    fontSize: item.level === 1 ? '13px' : '12px',
                    fontWeight: item.level <= 2 ? 600 : 400
                  }}
                  onClick={() => {
                    if (onScrollToLine) {
                      onScrollToLine(item.line);
                    }
                  }}
                >
                  {item.text}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Custom Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg py-1 min-w-[150px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ... existing context menu content ... */}
          {/* For brevity, omitting re-rendering of context menu content as it's large, assuming tool merges correctly. */}
          {/* Actually, I need to provide the full replacement or use multi_replace. */}
          {/* I will use the existing context menu logic but ensure it sits above the new bottom panel. */}
          {/* Re-implementing context menu logic briefly for correct replacement. */}
          {/* Root folder context menu (no node selected) */}
          {contextMenu.node === null && rootPath && (
            <>
              {clipboard && (
                <button
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  onClick={() => handlePaste(rootPath)}
                >
                  <Clipboard size={12} /> Paste "{clipboard.name}"
                </button>
              )}
              <button
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                onClick={() => handleNewFile(rootPath)}
              >
                <FilePlus size={12} /> New File
              </button>
              <button
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                onClick={() => handleNewFolder(rootPath)}
              >
                <FolderPlus size={12} /> New Folder
              </button>
            </>
          )}
          {/* File/Folder context menu */}
          {contextMenu.node && (
            <>
              {contextMenu.node.kind === 'file' && (
                <button
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  onClick={() => handleCopy(contextMenu.node!)}
                >
                  <Copy size={12} /> Copy
                </button>
              )}
              {contextMenu.node.kind === 'directory' && clipboard && (
                <button
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  onClick={() => handlePaste(contextMenu.node!.path)}
                >
                  <Clipboard size={12} /> Paste "{clipboard.name}"
                </button>
              )}
              <button
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                onClick={() => handleRename(contextMenu.node!)}
              >
                <Pencil size={12} /> Rename
              </button>
              <button
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-500"
                onClick={() => handleDelete(contextMenu.node!)}
              >
                <Trash2 size={12} /> Delete
              </button>
              {contextMenu.node.kind === 'directory' && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                  <button
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    onClick={() => handleNewFile(contextMenu.node!.path)}
                  >
                    <FilePlus size={12} /> New File
                  </button>
                  <button
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    onClick={() => handleNewFolder(contextMenu.node!.path)}
                  >
                    <FolderPlus size={12} /> New Folder
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}


    </div>
  );
};

// Bottom Panel Component
const BottomPanel: React.FC<{
  rootPath: string | null;
  onNewFile: () => void;
  onOpenFolder: () => void;
  onSwitchRoot: (path: string) => void;
}> = ({ rootPath, onNewFile, onOpenFolder, onSwitchRoot }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [recentLocations, setRecentLocations] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('typora-recent-locations');
      if (stored) {
        setRecentLocations(JSON.parse(stored));
      }
    } catch (e) { console.error(e); }
  }, [rootPath]);

  // Update recent locations when rootPath changes
  useEffect(() => {
    if (rootPath) {
      setRecentLocations(prev => {
        const unique = Array.from(new Set([rootPath, ...prev])).slice(0, 5);
        localStorage.setItem('typora-recent-locations', JSON.stringify(unique));
        return unique;
      });
    }
  }, [rootPath]);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-[var(--side-bar-bg-color)]">
      {/* Action / Sort Header */}
      <div className="flex items-center justify-between px-3 py-2 text-xs opacity-70">
        <span>Action</span>
        <div className="flex gap-2">
          {/* Mock Sort Icons */}
          <span className="cursor-pointer hover:opacity-100" title="Sort by Name">Az</span>
          <span className="cursor-pointer hover:opacity-100" title="Sort by Date">🕒</span>
        </div>
      </div>

      {/* Action Menu List */}
      <div className="px-3 pb-2 text-xs space-y-1">
        <div className="cursor-pointer hover:text-[var(--active-file-text-color)] opacity-80" onClick={onNewFile}>
          New File
        </div>
        <div className="cursor-pointer hover:text-[var(--active-file-text-color)] opacity-80" onClick={onOpenFolder}>
          Open Folder...
        </div>
      </div>

      {/* Recent Locations */}
      <div className="px-3 pb-2 text-xs">
        <div className="opacity-50 mb-1 font-semibold">Recent Locations</div>
        <div className="space-y-0.5">
          {recentLocations.map(loc => (
            <div
              key={loc}
              className={`cursor-pointer truncate opacity-80 hover:opacity-100 ${loc === rootPath ? 'font-bold' : ''}`}
              title={loc}
              onClick={() => onSwitchRoot(loc)}
            >
              {loc.split('/').pop()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
