import {
  ChevronDown,
  ChevronRight,
  Clipboard,
  Copy,
  File,
  FilePlus,
  Folder,
  FolderOpen,
  FolderPlus,
  Pencil,
  Trash2
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface SidebarProps {
  currentPath: string | null;
  onFileSelect: (path: string) => void;
  onClose: () => void;
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

const Sidebar: React.FC<SidebarProps> = ({ currentPath, onFileSelect, onClose }) => {
  const [rootPath, setRootPath] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [clipboard, setClipboard] = useState<{ path: string; name: string } | null>(null);
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);

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
    setRenaming(node.path);
    setRenameValue(node.name);
    setContextMenu(null);
  };

  const submitRename = async (node: FileNode) => {
    if (renameValue && renameValue !== node.name) {
      const dir = node.path.substring(0, node.path.lastIndexOf('/'));
      const newPath = `${dir}/${renameValue}`;
      await window.electron.renamePath(node.path, newPath);
      refreshTree();
    }
    setRenaming(null);
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
    const isRenaming = renaming === node.path;
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
              <span className="truncate text-xs">{node.name}</span>
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
        <File size={14} className="mr-2 opacity-50" />
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
          <span className="truncate text-xs">{node.name}</span>
        )}
      </div>
    );
  };

  return (
    <div
      className="sidebar flex flex-col h-full text-sm"
      style={{
        backgroundColor: 'var(--side-bar-bg-color)',
        color: 'var(--control-text-color)'
      }}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <span className="font-semibold text-xs tracking-wider uppercase opacity-70">FILES</span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleOpenFolder}
            className="p-1 rounded opacity-60 hover:opacity-100 transition-opacity"
            title="Open Folder"
          >
            <FolderOpen size={14} />
          </button>
          <button
            onClick={() => rootPath && handleNewFile(rootPath)}
            className="p-1 rounded opacity-60 hover:opacity-100 transition-opacity"
            title="New File"
            disabled={!rootPath}
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
          // Check if it's an external file drop or internal move
          if (e.dataTransfer.files.length > 0) {
            handleExternalDrop(e);
          } else if (rootPath) {
            handleDrop(e, rootPath);
          }
        }}
        onContextMenu={handleRootContextMenu}
      >
        {!rootPath ? (
          <div className="flex flex-col items-center justify-center h-full space-y-2">
            <button
              onClick={handleOpenFolder}
              className="px-4 py-2 rounded text-xs font-medium transition-colors"
              style={{ backgroundColor: 'var(--primary-color)', color: '#fff' }}
            >
              Open Folder
            </button>
          </div>
        ) : (
          <div>
            <div
              className="text-xs font-semibold mb-2 px-2 py-1 truncate uppercase tracking-wider opacity-70"
              title={rootPath}
            >
              {rootPath.split('/').pop()}
            </div>
            <div className="space-y-0.5">
              {fileTree.map(node => renderNode(node))}
            </div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg py-1 min-w-[150px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
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
              {/* Copy option for files */}
              {contextMenu.node.kind === 'file' && (
                <button
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  onClick={() => handleCopy(contextMenu.node!)}
                >
                  <Copy size={12} /> Copy
                </button>
              )}
              {/* Paste option for directories */}
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

export default Sidebar;
