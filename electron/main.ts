import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { join } from 'node:path';
import { createApplicationMenu } from './menu';
import { FileWatcher } from './watcher';

process.env.APP_ROOT = join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let fileWatcher: FileWatcher | null = null;

function createWindow() {
  win = new BrowserWindow({
    icon: join(process.env.VITE_PUBLIC as string, 'electron-vite.svg'),
    frame: false,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
    },
  })

  // Create Application Menu
  createApplicationMenu(win);

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(join(RENDERER_DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow()

  // --- IPC Handlers ---

  ipcMain.handle('read-file', async (_: unknown, filePath: string) => {
    return fs.readFile(filePath, 'utf-8')
  })

  ipcMain.handle('write-file', async (_: unknown, filePath: string, content: string) => {
    return fs.writeFile(filePath, content, 'utf-8')
  })

  ipcMain.handle('open-folder', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog(win!, {
        properties: ['openDirectory']
      })
      if (canceled) return null

      const folderPath = filePaths[0];

      // Initialize watcher if needed
      try {
        if (!fileWatcher && win) {
          fileWatcher = new FileWatcher(win);
        }
        if (fileWatcher) {
          fileWatcher.watch(folderPath);
        }
      } catch (e) {
        console.error("Failed to start file watcher:", e);
      }

      return folderPath;
    } catch (e) {
      console.error("Open folder dialog failed:", e);
      return null;
    }
  })

  ipcMain.handle('read-dir', async (_: unknown, dirPath: string) => {
    try {
      const dirents = await fs.readdir(dirPath, { withFileTypes: true })
      const files = dirents.map((dirent: any) => {
        return {
          name: dirent.name,
          path: path.join(dirPath, dirent.name),
          isDirectory: dirent.isDirectory()
        }
      })
      // Sort: directories first, then files
      files.sort((a: any, b: any) => {
        if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name)
        return a.isDirectory ? -1 : 1
      })
      return files
    } catch (err) {
      console.error('Failed to read dir', err)
      return []
    }
  })

  // CRUD Handlers
  ipcMain.handle('rename-path', async (_: unknown, oldPath: string, newPath: string) => {
    try {
      await fs.rename(oldPath, newPath);
      return { success: true };
    } catch (error: any) {
      console.error('Rename failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('delete-path', async (_: unknown, targetPath: string) => {
    try {
      await fs.rm(targetPath, { recursive: true, force: true });
      return { success: true };
    } catch (error: any) {
      console.error('Delete failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('create-folder', async (_: unknown, folderPath: string) => {
    try {
      await fs.mkdir(folderPath, { recursive: true });
      return { success: true };
    } catch (error: any) {
      console.error('Create folder failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('create-file', async (_: unknown, filePath: string) => {
    try {
      // Check if file exists? 'w' flag overwrites.
      // 'wx' fails if exists.
      await fs.writeFile(filePath, '', { flag: 'wx' });
      return { success: true };
    } catch (error: any) {
      if (error.code === 'EEXIST') {
        return { success: false, error: 'File already exists' };
      }
      console.error('Create file failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('copy-file', async (_: unknown, srcPath: string, destPath: string) => {
    try {
      await fs.copyFile(srcPath, destPath);
      return { success: true };
    } catch (error: any) {
      console.error('Copy file failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('save-asset', async (_: unknown, destPath: string, base64Data: string) => {
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      await fs.writeFile(destPath, buffer);
      return { success: true };
    } catch (error: any) {
      console.error('Save asset failed:', error);
      return { success: false, error: error.message };
    }
  });
})


