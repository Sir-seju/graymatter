import { BrowserWindow } from 'electron';
import * as fs from 'fs';

export class FileWatcher {
  private watcher: fs.FSWatcher | null = null;
  private window: BrowserWindow;

  constructor(window: BrowserWindow) {
    this.window = window;
  }

  watch(path: string) {
    if (this.watcher) {
      this.watcher.close();
    }

    try {
      this.watcher = fs.watch(path, { recursive: true }, (eventType, filename) => {
        if (filename) {
          // Send event to renderer
          // Debounce could be added here
          this.window.webContents.send('file-changed', { eventType, filename, path });
        }
      });
    } catch (err) {
      console.error('Failed to watch path:', path, err);
    }
  }

  close() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}
