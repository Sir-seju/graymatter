import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('write-file', filePath, content),
  openFolder: () => ipcRenderer.invoke('open-folder'),
  watchFolder: (path: string) => ipcRenderer.invoke('watch-folder', path),
  showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
  readDir: (path: string) => ipcRenderer.invoke('read-dir', path),
  renamePath: (oldPath: string, newPath: string) => ipcRenderer.invoke('rename-path', oldPath, newPath),
  searchFiles: (query: string, rootPath: string) => ipcRenderer.invoke('search-files', query, rootPath),
  deletePath: (path: string) => ipcRenderer.invoke('delete-path', path),
  createFolder: (path: string) => ipcRenderer.invoke('create-folder', path),
  createFile: (path: string) => ipcRenderer.invoke('create-file', path),
  copyFile: (src: string, dest: string) => ipcRenderer.invoke('copy-file', src, dest),
  saveAsset: (dest: string, base64: string) => ipcRenderer.invoke('save-asset', dest, base64),
  exportPdf: () => ipcRenderer.invoke('export-pdf'),
  exportHtml: (html: string) => ipcRenderer.invoke('export-html', html),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  showInFolder: (path: string) => ipcRenderer.invoke('show-in-folder', path),
  resetZoom: () => ipcRenderer.invoke('reset-zoom'),
  setNativeTheme: (theme: 'dark' | 'light' | 'system') => ipcRenderer.invoke('set-native-theme', theme),
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  on: (channel: string, callback: Function) => {
    const listener = (event: any, ...args: any[]) => callback(event, ...args);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
  off: (channel: string, listener: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, listener)
  }
})
