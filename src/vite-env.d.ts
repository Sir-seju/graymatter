/// <reference types="vite/client" />

interface Window {
  electron: {
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<void>;
    renamePath: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>;
    deletePath: (path: string) => Promise<{ success: boolean; error?: string }>;
    createFile: (path: string) => Promise<{ success: boolean; error?: string }>;
    on: (channel: string, func: (...args: any[]) => void) => () => void;
    createFolder: (path: string) => Promise<{ success: boolean; error?: string }>;
    saveAsset: (path: string, base64: string) => Promise<{ success: boolean; error?: string }>;
    copyFile: (src: string, dest: string) => Promise<{ success: boolean; error?: string }>;
    readDir: (path: string) => Promise<{ name: string; isDirectory: boolean; path: string }[]>;
    openFolder: () => Promise<string | null>;
    watchFolder: (path: string) => Promise<{ success: boolean; error?: string }>;
    searchFiles: (query: string, rootPath: string) => Promise<{ success: boolean; results?: Array<{ file: string; line: number; content: string }> }>;
    showSaveDialog: () => Promise<string | null>;
  }
}
