import { BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export class FileWatcher {
  private watcher: fs.FSWatcher | null = null;
  private window: BrowserWindow;
  private rootPath: string = '';
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(window: BrowserWindow) {
    this.window = window;
  }

  watch(watchPath: string) {
    if (this.watcher) {
      this.watcher.close();
    }

    this.rootPath = watchPath;

    try {
      this.watcher = fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
        if (filename) {
          // Construct full path
          const fullPath = path.join(this.rootPath, filename);

          // Debounce to avoid multiple rapid events for same file
          const existingTimer = this.debounceTimers.get(fullPath);
          if (existingTimer) {
            clearTimeout(existingTimer);
          }

          const timer = setTimeout(() => {
            this.debounceTimers.delete(fullPath);
            // Send event to renderer with full path
            this.window.webContents.send('file-changed', {
              eventType,
              filename,
              fullPath,
              rootPath: this.rootPath
            });
          }, 100); // 100ms debounce

          this.debounceTimers.set(fullPath, timer);
        }
      });
    } catch (err) {
      console.error('Failed to watch path:', watchPath, err);
    }
  }

  close() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    // Clear all debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}
