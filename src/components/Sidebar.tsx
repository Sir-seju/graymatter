import {
  AlignLeft,
  ChevronDown,
  ChevronRight,
  Clipboard,
  Copy,
  ExternalLink,
  File,
  FileCode,
  FileJson,
  FilePlus,
  Files,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  GripVertical,
  Link,
  Pencil,
  Search,
  Settings,
  Trash2,
  X
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

// Custom Markdown icon component
const MarkdownIcon: React.FC<{ size?: number; className?: string; style?: React.CSSProperties }> = ({ size = 14, className, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 15V9l2.5 3L12 9v6" />
    <path d="M17 12l-2 3h4l-2-3z" />
  </svg>
);

// Get appropriate icon for file type
const getFileIcon = (filename: string, size: number = 14, className: string = "") => {
  const ext = filename.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'md':
    case 'markdown':
    case 'mdx':
      return <MarkdownIcon size={size} className={className} style={{ color: 'var(--primary-color)' }} />;
    case 'json':
      return <FileJson size={size} className={className} style={{ color: '#f1c40f' }} />;
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return <FileCode size={size} className={className} style={{ color: '#3498db' }} />;
    case 'css':
    case 'scss':
    case 'less':
      return <FileCode size={size} className={className} style={{ color: '#9b59b6' }} />;
    case 'html':
    case 'htm':
      return <FileCode size={size} className={className} style={{ color: '#e67e22' }} />;
    case 'txt':
      return <FileText size={size} className={className} />;
    default:
      return <File size={size} className={className} />;
  }
};

interface SidebarProps {
  currentPath: string | null;
  onFileSelect: (path: string, searchTerm?: string) => void;
  onClose: () => void;
  onToggle: () => void;
  onRename?: (oldPath: string, newPath: string) => void;
  onScrollToLine?: (line: number) => void;
  activeContent?: string;
  width: number;
  onWidthChange: (width: number) => void;
  onSettingsClick?: () => void;
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

// Modal for creating new file/folder
const NewItemModal: React.FC<{
  isOpen: boolean;
  type: 'file' | 'folder';
  onClose: () => void;
  onSubmit: (name: string) => void;
}> = ({ isOpen, type, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="rounded-lg shadow-xl p-4 w-[300px]"
        style={{ backgroundColor: 'var(--side-bar-bg-color)', border: '1px solid var(--window-border)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-color)' }}>
            New {type === 'file' ? 'File' : 'Folder'}
          </h3>
          <button onClick={onClose} className="opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={type === 'file' ? 'filename.md' : 'folder name'}
            className="w-full px-3 py-2 rounded text-sm outline-none"
            style={{
              backgroundColor: 'var(--bg-color)',
              color: 'var(--text-color)',
              border: '1px solid var(--window-border)'
            }}
          />
          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded opacity-70 hover:opacity-100"
              style={{ border: '1px solid var(--window-border)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs rounded font-medium"
              style={{ backgroundColor: 'var(--primary-color)', color: '#fff' }}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onFileSelect,
  onClose,
  onToggle,
  onRename,
  onScrollToLine,
  activeContent,
  width,
  onWidthChange,
  onSettingsClick
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'search' | 'outline'>('files');
  const [rootPath, setRootPath] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [clipboard, setClipboard] = useState<{ path: string; name: string } | null>(null);
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);
  const [draggingPath, setDraggingPath] = useState<string | null>(null);

  // New item modal state
  const [newItemModal, setNewItemModal] = useState<{ open: boolean; type: 'file' | 'folder'; parentPath: string }>({
    open: false,
    type: 'file',
    parentPath: ''
  });

  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Refs to track current state for use in event listeners
  const fileTreeRef = useRef<FileNode[]>(fileTree);
  fileTreeRef.current = fileTree;
  const rootPathRef = useRef<string | null>(rootPath);
  rootPathRef.current = rootPath;

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
          let cleanText = match[2]
            .replace(/\*\*(.+?)\*\*/g, '$1')
            .replace(/\*(.+?)\*/g, '$1')
            .replace(/_(.+?)_/g, '$1')
            .replace(/`(.+?)`/g, '$1')
            .replace(/\[(.+?)\]\(.+?\)/g, '$1')
            .trim();
          return { level: match[1].length, text: cleanText, line: index };
        }
        return null;
      }).filter(item => item !== null) as Array<{ level: number; text: string; line: number }>;
      setOutline(headers);
    }
  }, [activeContent, activeTab]);

  // Handle Search
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

  // Debounced live search
  useEffect(() => {
    if (activeTab !== 'search') return;
    const timer = setTimeout(() => {
      executeSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, rootPath, activeTab]);

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
    if (rootPath) {
      window.electron.watchFolder(rootPath);
    }
  }, [rootPath]);

  // Resize handling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(200, Math.min(500, e.clientX));
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, onWidthChange]);

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

  // Collect all open folder paths from the current tree
  const getOpenFolderPaths = (nodes: FileNode[]): Set<string> => {
    const openPaths = new Set<string>();
    const traverse = (nodeList: FileNode[]) => {
      for (const node of nodeList) {
        if (node.kind === 'directory' && node.isOpen) {
          openPaths.add(node.path);
          if (node.children) {
            traverse(node.children);
          }
        }
      }
    };
    traverse(nodes);
    return openPaths;
  };

  // Recursively load directory tree, preserving open states
  const loadTreeWithOpenStates = async (path: string, openPaths: Set<string>): Promise<FileNode[]> => {
    const entries = await window.electron.readDir(path);
    const nodes: FileNode[] = [];

    for (const entry of entries) {
      const nodePath = entry.path || `${path}/${entry.name}`;
      const isDirectory = entry.isDirectory;
      const wasOpen = openPaths.has(nodePath);

      let children: FileNode[] | undefined = undefined;
      if (isDirectory && wasOpen) {
        // Recursively load children for previously open folders
        children = await loadTreeWithOpenStates(nodePath, openPaths);
      } else if (isDirectory) {
        children = [];
      }

      nodes.push({
        name: entry.name,
        path: nodePath,
        kind: isDirectory ? 'directory' : 'file',
        children,
        isOpen: wasOpen
      });
    }

    // Sort: directories first, then alphabetically
    nodes.sort((a, b) => {
      if (a.kind === b.kind) return a.name.localeCompare(b.name);
      return a.kind === 'directory' ? -1 : 1;
    });

    return nodes;
  };

  const refreshTree = useCallback(async () => {
    const currentRootPath = rootPathRef.current;
    if (currentRootPath) {
      // Get currently open folder paths before refresh (use ref for latest state)
      const openPaths = getOpenFolderPaths(fileTreeRef.current);
      // Reload tree while preserving open states
      const nodes = await loadTreeWithOpenStates(currentRootPath, openPaths);
      setFileTree(nodes);
    }
  }, []);

  // Listen for file system changes from the watcher
  useEffect(() => {
    const removeListener = window.electron.on('file-changed', () => {
      refreshTree();
    });
    return () => removeListener();
  }, [refreshTree]);

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
      setFileTree(prev => updateNodeInTree(prev, node.path, n => ({ ...n, isOpen: false })));
    } else {
      const children = await loadDirectory(node.path);
      setFileTree(prev => updateNodeInTree(prev, node.path, n => ({ ...n, isOpen: true, children })));
    }
  };

  const handleContextMenu = (e: React.MouseEvent, node: FileNode | null) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  const handleRootContextMenu = (e: React.MouseEvent) => {
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

  const handleRenameStart = (node: FileNode) => {
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
      }
    } catch (error: any) {
      console.error("Rename exception", error);
    }
    setRenamingNodeId(null);
  };

  // New File/Folder handlers using modal
  const openNewFileModal = (parentPath: string) => {
    setNewItemModal({ open: true, type: 'file', parentPath });
    setContextMenu(null);
  };

  const openNewFolderModal = (parentPath: string) => {
    setNewItemModal({ open: true, type: 'folder', parentPath });
    setContextMenu(null);
  };

  const handleCreateItem = async (name: string) => {
    // Auto-add .md extension for files without an extension
    let finalName = name;
    if (newItemModal.type === 'file' && !name.includes('.')) {
      finalName = `${name}.md`;
    }
    const fullPath = `${newItemModal.parentPath}/${finalName}`;
    const parentPath = newItemModal.parentPath;
    try {
      if (newItemModal.type === 'file') {
        await window.electron.createFile(fullPath);
      } else {
        await window.electron.createFolder(fullPath);
      }
      // Ensure parent folder is marked as open in the ref before refresh
      const ensureParentOpen = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.path === parentPath && node.kind === 'directory') {
            return { ...node, isOpen: true };
          }
          if (node.children && node.children.length > 0) {
            return { ...node, children: ensureParentOpen(node.children) };
          }
          return node;
        });
      };
      // Update the ref directly so refreshTree sees the open state
      fileTreeRef.current = ensureParentOpen(fileTreeRef.current);
      // Also update state for UI consistency
      setFileTree(fileTreeRef.current);
      refreshTree();
    } catch (err) {
      console.error(`Failed to create ${newItemModal.type}:`, err);
    }
  };

  const handleCopy = (node: FileNode) => {
    if (node.kind === 'file') {
      setClipboard({ path: node.path, name: node.name });
    }
    setContextMenu(null);
  };

  const handlePaste = async (targetDir: string) => {
    if (!clipboard) return;

    try {
      const destPath = `${targetDir}/${clipboard.name}`;
      await window.electron.copyFile(clipboard.path, destPath);
      refreshTree();
    } catch (err) {
      console.error('Failed to paste file:', err);
    }
    setContextMenu(null);
  };

  // Copy file/folder path to clipboard
  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setContextMenu(null);
  };

  // Reveal in Finder (macOS) / Explorer (Windows)
  const handleRevealInFinder = async (path: string) => {
    try {
      await window.electron.showInFolder(path);
    } catch (err) {
      console.error('Failed to reveal in finder:', err);
    }
    setContextMenu(null);
  };

  const handleDragStart = (e: React.DragEvent, node: FileNode) => {
    if (node.kind === 'file') {
      e.dataTransfer.setData('text/plain', node.path);
      e.dataTransfer.effectAllowed = 'move';
      setDraggingPath(node.path);
    }
  };

  const handleDragEnd = () => {
    setDraggingPath(null);
    setDragOverPath(null);
  };

  const handleDragOver = (e: React.DragEvent, node: FileNode) => {
    if (node.kind === 'directory') {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverPath(node.path);
    }
  };

  const handleDragOverRoot = (e: React.DragEvent) => {
    if (rootPath) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverPath(rootPath);
    }
  };

  const handleDragLeave = () => {
    setDragOverPath(null);
  };

  const handleDrop = async (e: React.DragEvent, targetDir: string) => {
    e.preventDefault();
    setDragOverPath(null);

    const sourcePath = e.dataTransfer.getData('text/plain');
    if (!sourcePath || sourcePath === targetDir) return;

    const fileName = sourcePath.split('/').pop();
    if (!fileName) return;

    if (targetDir.startsWith(sourcePath + '/')) return;

    const destPath = `${targetDir}/${fileName}`;
    const sourceDir = sourcePath.substring(0, sourcePath.lastIndexOf('/'));
    if (sourceDir === targetDir) return;

    try {
      await window.electron.renamePath(sourcePath, destPath);
      refreshTree();
    } catch (err) {
      console.error('Failed to move file:', err);
    }
  };

  const handleExternalDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverPath(null);

    if (!rootPath) return;

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
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
    const isDragging = draggingPath === node.path;

    if (node.kind === 'directory') {
      return (
        <div key={node.path}>
          <div
            className="sidebar-item flex items-center py-1.5 px-2 cursor-pointer rounded-md transition-all duration-150 group"
            style={{
              paddingLeft,
              backgroundColor: isDragOver ? 'var(--item-hover-bg-color)' : (isActive ? 'var(--active-file-bg-color)' : 'transparent'),
              color: isActive ? 'var(--active-file-text-color)' : 'inherit',
              border: isDragOver ? '1px dashed var(--primary-color)' : '1px dashed transparent',
              transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
              boxShadow: isDragOver ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
            }}
            onClick={() => toggleFolder(node)}
            onContextMenu={(e) => handleContextMenu(e, node)}
            onDragOver={(e) => handleDragOver(e, node)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, node.path)}
            onMouseEnter={(e) => {
              if (!isActive && !isDragOver) {
                e.currentTarget.style.backgroundColor = 'var(--item-hover-bg-color)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive && !isDragOver) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {node.isOpen ? <ChevronDown size={12} className="mr-1 opacity-50 flex-shrink-0" /> : <ChevronRight size={12} className="mr-1 opacity-50 flex-shrink-0" />}
            {node.isOpen ? (
              <FolderOpen size={14} className="mr-2 flex-shrink-0" style={{ color: isDragOver ? 'var(--primary-color)' : 'var(--primary-color)', opacity: isDragOver ? 1 : 0.8 }} />
            ) : (
              <Folder size={14} className="mr-2 flex-shrink-0" style={{ color: isDragOver ? 'var(--primary-color)' : 'var(--primary-color)', opacity: isDragOver ? 1 : 0.8 }} />
            )}
            {isRenaming ? (
              <input
                autoFocus
                className="bg-transparent border-b outline-none text-sm flex-1 min-w-0"
                style={{ borderColor: 'var(--primary-color)' }}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => submitRename(node)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitRename(node);
                  if (e.key === 'Escape') setRenamingNodeId(null);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate text-sm flex-1 min-w-0">{node.name}</span>
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
        className="sidebar-item flex items-center py-1.5 px-2 cursor-pointer rounded-md transition-all duration-150 group"
        style={{
          paddingLeft,
          backgroundColor: isActive ? 'var(--active-file-bg-color)' : 'transparent',
          color: isActive ? 'var(--active-file-text-color)' : 'inherit',
          opacity: isDragging ? 0.5 : 1,
          transform: isDragging ? 'scale(0.98)' : 'scale(1)'
        }}
        draggable
        onDragStart={(e) => handleDragStart(e, node)}
        onDragEnd={handleDragEnd}
        onClick={() => onFileSelect(node.path)}
        onContextMenu={(e) => handleContextMenu(e, node)}
        onMouseEnter={(e) => {
          if (!isActive && !isDragging) {
            e.currentTarget.style.backgroundColor = 'var(--item-hover-bg-color)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive && !isDragging) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        {getFileIcon(node.name, 14, "mr-2 flex-shrink-0")}
        {isRenaming ? (
          <input
            autoFocus
            className="bg-transparent border-b outline-none text-sm flex-1 min-w-0"
            style={{ borderColor: 'var(--primary-color)' }}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={() => submitRename(node)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitRename(node);
              if (e.key === 'Escape') setRenamingNodeId(null);
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate text-sm flex-1 min-w-0">{node.name}</span>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        ref={sidebarRef}
        className="sidebar flex h-full text-sm relative"
        style={{
          backgroundColor: 'var(--side-bar-bg-color)',
          color: 'var(--control-text-color)',
          borderRight: '1px solid var(--window-border)',
          width: `${width}px`
        }}
      >
        {/* Left Icon Column - starts below traffic lights */}
        <div
          className="flex flex-col justify-between w-[45px] pb-4 relative"
          style={{ opacity: 0.9 }}
        >
          {/* Traffic light spacer - no border in this area */}
          <div className="h-[52px]" style={{ WebkitAppRegion: 'drag' } as any} />

          <div className="flex flex-col items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <div
              className="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-150 hover:opacity-100"
              style={{
                backgroundColor: activeTab === 'files' ? 'var(--item-hover-bg-color)' : 'transparent',
                opacity: activeTab === 'files' ? 1 : 0.5
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'files') {
                  e.currentTarget.style.backgroundColor = 'var(--item-hover-bg-color)';
                  e.currentTarget.style.opacity = '0.9';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'files') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.opacity = '0.5';
                }
              }}
              onClick={() => activeTab === 'files' ? onToggle() : setActiveTab('files')}
              title="Files"
            >
              <Files size={18} />
            </div>
            <div
              className="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-150 hover:opacity-100"
              style={{
                backgroundColor: activeTab === 'search' ? 'var(--item-hover-bg-color)' : 'transparent',
                opacity: activeTab === 'search' ? 1 : 0.5
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'search') {
                  e.currentTarget.style.backgroundColor = 'var(--item-hover-bg-color)';
                  e.currentTarget.style.opacity = '0.9';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'search') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.opacity = '0.5';
                }
              }}
              onClick={() => activeTab === 'search' ? onToggle() : setActiveTab('search')}
              title="Search"
            >
              <Search size={18} />
            </div>
            <div
              className="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-150 hover:opacity-100"
              style={{
                backgroundColor: activeTab === 'outline' ? 'var(--item-hover-bg-color)' : 'transparent',
                opacity: activeTab === 'outline' ? 1 : 0.5
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'outline') {
                  e.currentTarget.style.backgroundColor = 'var(--item-hover-bg-color)';
                  e.currentTarget.style.opacity = '0.9';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'outline') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.opacity = '0.5';
                }
              }}
              onClick={() => activeTab === 'outline' ? onToggle() : setActiveTab('outline')}
              title="Outline"
            >
              <AlignLeft size={18} />
            </div>
          </div>

          {/* Settings button at the bottom */}
          <div className="flex flex-col items-center" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <div
              className="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer transition-all duration-150 hover:opacity-100"
              style={{
                backgroundColor: 'transparent',
                opacity: 0.5
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--item-hover-bg-color)';
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.opacity = '0.5';
              }}
              onClick={onSettingsClick}
              title="Settings"
            >
              <Settings size={18} />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col relative min-w-0">
          {/* Vertical border - starts below header to avoid crossing */}
          <div
            className="absolute left-0 top-[67px] bottom-0 w-px"
            style={{ backgroundColor: 'var(--window-border)' }}
          />

          {/* Traffic light spacer for content area */}
          <div className="h-[27px] flex-shrink-0" style={{ WebkitAppRegion: 'drag' } as any} />

          {/* FILES TAB */}
          <div className={`flex-col h-full ${activeTab === 'files' ? 'flex' : 'hidden'}`}>
            <div
              className="flex items-center justify-between px-3 h-[40px] flex-shrink-0"
            >
              <span className="font-semibold text-xs tracking-wider uppercase opacity-70 truncate">
                {rootPath ? rootPath.split('/').pop() : 'NO FOLDER'}
              </span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={handleOpenFolder}
                  className="p-1.5 rounded-md opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-all"
                  title="Open Folder"
                >
                  <FolderOpen size={14} />
                </button>
                <button
                  onClick={() => rootPath && openNewFileModal(rootPath)}
                  className="p-1.5 rounded-md opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  disabled={!rootPath}
                  title="New File"
                >
                  <FilePlus size={14} />
                </button>
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto px-1.5 py-1 transition-colors duration-150"
              style={{
                backgroundColor: dragOverPath === rootPath ? 'var(--item-hover-bg-color)' : 'transparent'
              }}
              onDragOver={handleDragOverRoot}
              onDragLeave={handleDragLeave}
              onDrop={(e) => {
                if (e.dataTransfer.files.length > 0) handleExternalDrop(e);
                else if (rootPath) handleDrop(e, rootPath);
              }}
              onContextMenu={handleRootContextMenu}
            >
              {!rootPath ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6 py-8">
                  {/* Animated folder icon */}
                  <div
                    className="relative mb-6 group cursor-pointer"
                    onClick={handleOpenFolder}
                  >
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105"
                      style={{
                        backgroundColor: 'var(--item-hover-bg-color)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                      }}
                    >
                      <FolderOpen
                        size={36}
                        className="transition-all duration-300 group-hover:scale-110"
                        style={{ color: 'var(--primary-color)', opacity: 0.7 }}
                      />
                    </div>
                    {/* Subtle glow effect on hover */}
                    <div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{
                        boxShadow: '0 0 30px var(--primary-color)',
                        opacity: 0.15
                      }}
                    />
                  </div>

                  <h3
                    className="text-base font-semibold mb-2"
                    style={{ color: 'var(--text-color)', opacity: 0.8 }}
                  >
                    No Folder Opened
                  </h3>

                  <p
                    className="text-xs leading-relaxed mb-6 max-w-[200px]"
                    style={{ color: 'var(--control-text-color)', opacity: 0.6 }}
                  >
                    Open a folder to start managing your markdown files.
                  </p>

                  <button
                    onClick={handleOpenFolder}
                    className="px-5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none"
                    style={{
                      backgroundColor: 'var(--primary-color)',
                      color: '#fff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  >
                    Open Folder
                  </button>

                  {/* Keyboard shortcut hint */}
                  <div
                    className="mt-4 flex items-center gap-1.5 text-[10px]"
                    style={{ color: 'var(--control-text-color)', opacity: 0.4 }}
                  >
                    <kbd
                      className="px-1.5 py-0.5 rounded text-[9px] font-mono"
                      style={{
                        backgroundColor: 'var(--item-hover-bg-color)',
                        border: '1px solid var(--window-border)'
                      }}
                    >
                      ⌘
                    </kbd>
                    <span>+</span>
                    <kbd
                      className="px-1.5 py-0.5 rounded text-[9px] font-mono"
                      style={{
                        backgroundColor: 'var(--item-hover-bg-color)',
                        border: '1px solid var(--window-border)'
                      }}
                    >
                      Shift
                    </kbd>
                    <span>+</span>
                    <kbd
                      className="px-1.5 py-0.5 rounded text-[9px] font-mono"
                      style={{
                        backgroundColor: 'var(--item-hover-bg-color)',
                        border: '1px solid var(--window-border)'
                      }}
                    >
                      O
                    </kbd>
                  </div>
                </div>
              ) : (
                <div className="space-y-0.5">{fileTree.map(node => renderNode(node))}</div>
              )}
            </div>
          </div>

          {/* SEARCH TAB */}
          <div className={`flex-col h-full ${activeTab === 'search' ? 'flex' : 'hidden'}`}>
            <div className="p-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--window-border)' }}>
              <form onSubmit={handleSearch} className="flex gap-1.5 mb-2">
                <input
                  className="flex-1 rounded-lg px-3 py-1.5 text-sm outline-none min-w-0 transition-all duration-150 hover:border-opacity-80 focus:border-opacity-100"
                  style={{
                    backgroundColor: 'var(--bg-color)',
                    border: '1px solid var(--window-border)',
                    color: 'var(--text-color)'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'var(--window-border)'}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.currentTarget) {
                      e.currentTarget.style.borderColor = 'var(--window-border)';
                    }
                  }}
                  placeholder="Search in folder..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="p-2 rounded-lg transition-all duration-150 flex-shrink-0 hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: 'var(--primary-color)', color: '#fff' }}
                >
                  <Search size={12} />
                </button>
              </form>
              <div className="flex gap-1 justify-end">
                <button
                  onClick={() => setIsCaseSensitive(!isCaseSensitive)}
                  className="px-2 py-0.5 text-[10px] rounded transition-colors"
                  style={{
                    backgroundColor: isCaseSensitive ? 'var(--primary-color)' : 'transparent',
                    color: isCaseSensitive ? '#fff' : 'inherit',
                    border: `1px solid ${isCaseSensitive ? 'var(--primary-color)' : 'var(--window-border)'}`
                  }}
                  title="Case Sensitive"
                >Aa</button>
                <button
                  onClick={() => setIsWholeWord(!isWholeWord)}
                  className="px-2 py-0.5 text-[10px] rounded transition-colors"
                  style={{
                    backgroundColor: isWholeWord ? 'var(--primary-color)' : 'transparent',
                    color: isWholeWord ? '#fff' : 'inherit',
                    border: `1px solid ${isWholeWord ? 'var(--primary-color)' : 'var(--window-border)'}`
                  }}
                  title="Whole Word"
                >Ab</button>
                <button
                  onClick={() => setIsRegex(!isRegex)}
                  className="px-2 py-0.5 text-[10px] rounded transition-colors"
                  style={{
                    backgroundColor: isRegex ? 'var(--primary-color)' : 'transparent',
                    color: isRegex ? '#fff' : 'inherit',
                    border: `1px solid ${isRegex ? 'var(--primary-color)' : 'var(--window-border)'}`
                  }}
                  title="Regex"
                >.*</button>
              </div>
            </div>
            {totalMatches > 0 && (
              <div className="px-3 py-1.5 text-[10px] opacity-60 flex-shrink-0" style={{ borderBottom: '1px solid var(--window-border)' }}>
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
                        <div key={filePath} style={{ borderBottom: '1px solid var(--window-border)' }}>
                          <div
                            className="flex items-center gap-2 px-2 py-1.5 cursor-pointer transition-colors"
                            style={{ backgroundColor: 'transparent' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--item-hover-bg-color)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            onClick={() => {
                              const newSet = new Set(expandedFiles);
                              if (isExpanded) newSet.delete(filePath);
                              else newSet.add(filePath);
                              setExpandedFiles(newSet);
                            }}
                          >
                            <ChevronRight size={12} className={`transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`} />
                            <span className="text-xs font-semibold flex-1 truncate" title={filePath}>{fileName}</span>
                            <span
                              className="text-[10px] px-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: 'var(--item-hover-bg-color)' }}
                            >
                              {matches.length}
                            </span>
                          </div>
                          {isExpanded && (
                            <div className="pl-5 pb-1">
                              {matches.map((m, i) => {
                                const idx = m.content.toLowerCase().indexOf(searchQuery.toLowerCase());
                                const before = idx >= 0 ? m.content.slice(0, idx) : m.content;
                                const match = idx >= 0 ? m.content.slice(idx, idx + searchQuery.length) : '';
                                const after = idx >= 0 ? m.content.slice(idx + searchQuery.length) : '';
                                return (
                                  <div
                                    key={i}
                                    className="py-0.5 px-2 text-[11px] font-mono cursor-pointer truncate transition-colors"
                                    style={{ backgroundColor: 'transparent' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--item-hover-bg-color)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    onClick={() => onFileSelect(filePath, searchQuery)}
                                    title={`Line ${m.line}`}
                                  >
                                    <span className="opacity-40 mr-1">{m.line}:</span>
                                    <span>{before}</span>
                                    <span className="bg-yellow-500/30 text-yellow-200 rounded px-0.5">{match}</span>
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
          <div className={`flex-col h-full ${activeTab === 'outline' ? 'flex' : 'hidden'}`}>
            <div
              className="px-3 h-[40px] flex items-center text-xs font-semibold opacity-50 uppercase tracking-wider flex-shrink-0"
              style={{ borderBottom: '1px solid var(--window-border)' }}
            >
              Outline
            </div>
            <div className="flex-1 overflow-y-auto">
              {outline.length === 0 ? (
                <div className="p-4 text-center opacity-40 text-xs">No headers found</div>
              ) : (
                <div className="px-2 py-2 space-y-0.5">
                  {outline.map((item, i) => (
                    <div
                      key={i}
                      className="py-1.5 px-2 rounded-md cursor-pointer text-xs truncate transition-all"
                      style={{
                        marginLeft: (item.level - 1) * 12,
                        fontSize: item.level === 1 ? '13px' : '12px',
                        fontWeight: item.level <= 2 ? 600 : 400,
                        opacity: 0.8
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--item-hover-bg-color)';
                        e.currentTarget.style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.opacity = '0.8';
                      }}
                      onClick={() => onScrollToLine && onScrollToLine(item.line)}
                    >
                      {item.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resize Handle */}
        <div
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize group z-10 flex items-center justify-center"
          onMouseDown={handleMouseDown}
        >
          <div
            className={`w-0.5 h-full transition-colors ${isResizing ? 'bg-blue-500' : 'bg-transparent group-hover:bg-gray-400/50'}`}
          />
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed z-[60] rounded-lg shadow-xl py-1 min-w-[160px]"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
              backgroundColor: 'var(--side-bar-bg-color)',
              border: '1px solid var(--window-border)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.node === null && rootPath && (
              <>
                {clipboard && (
                  <button
                    className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors"
                    style={{ color: 'var(--text-color)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--item-hover-bg-color)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => handlePaste(rootPath)}
                  >
                    <Clipboard size={12} /> Paste "{clipboard.name}"
                  </button>
                )}
                <button
                  className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors"
                  style={{ color: 'var(--text-color)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--item-hover-bg-color)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => openNewFileModal(rootPath)}
                >
                  <FilePlus size={12} /> New File
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors"
                  style={{ color: 'var(--text-color)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--item-hover-bg-color)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => openNewFolderModal(rootPath)}
                >
                  <FolderPlus size={12} /> New Folder
                </button>
              </>
            )}
            {contextMenu.node && (
              <>
                {contextMenu.node.kind === 'file' && (
                  <button
                    className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors"
                    style={{ color: 'var(--text-color)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--item-hover-bg-color)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => handleCopy(contextMenu.node!)}
                  >
                    <Copy size={12} /> Copy
                  </button>
                )}
                {contextMenu.node.kind === 'directory' && clipboard && (
                  <button
                    className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors"
                    style={{ color: 'var(--text-color)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--item-hover-bg-color)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => handlePaste(contextMenu.node!.path)}
                  >
                    <Clipboard size={12} /> Paste "{clipboard.name}"
                  </button>
                )}
                <button
                  className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors"
                  style={{ color: 'var(--text-color)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--item-hover-bg-color)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => handleRenameStart(contextMenu.node!)}
                >
                  <Pencil size={12} /> Rename
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors text-red-400"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--item-hover-bg-color)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => handleDelete(contextMenu.node!)}
                >
                  <Trash2 size={12} /> Delete
                </button>
                <div className="my-1" style={{ borderTop: '1px solid var(--window-border)' }} />
                <button
                  className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors"
                  style={{ color: 'var(--text-color)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--item-hover-bg-color)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => handleCopyPath(contextMenu.node!.path)}
                >
                  <Link size={12} /> Copy Path
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors"
                  style={{ color: 'var(--text-color)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--item-hover-bg-color)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={() => handleRevealInFinder(contextMenu.node!.path)}
                >
                  <ExternalLink size={12} /> Reveal in Finder
                </button>
                {contextMenu.node.kind === 'directory' && (
                  <>
                    <div className="my-1" style={{ borderTop: '1px solid var(--window-border)' }} />
                    <button
                      className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors"
                      style={{ color: 'var(--text-color)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--item-hover-bg-color)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      onClick={() => openNewFileModal(contextMenu.node!.path)}
                    >
                      <FilePlus size={12} /> New File
                    </button>
                    <button
                      className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors"
                      style={{ color: 'var(--text-color)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--item-hover-bg-color)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      onClick={() => openNewFolderModal(contextMenu.node!.path)}
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

      {/* New Item Modal */}
      <NewItemModal
        isOpen={newItemModal.open}
        type={newItemModal.type}
        onClose={() => setNewItemModal({ ...newItemModal, open: false })}
        onSubmit={handleCreateItem}
      />
    </>
  );
};

export default Sidebar;
