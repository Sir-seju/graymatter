import { BrowserWindow, Menu, MenuItemConstructorOptions, app, dialog, shell } from 'electron';

const isMac = process.platform === 'darwin';

export function createApplicationMenu(win: BrowserWindow) {
  const template: MenuItemConstructorOptions[] = [
    // { role: 'appMenu' }
    ...(isMac
      ? [{
        label: app.name,
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          {
            label: 'Preferences...',
            accelerator: 'CmdOrCtrl+,',
            click: () => win.webContents.send('menu-action', 'open-preferences')
          },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      }]
      : []) as MenuItemConstructorOptions[],
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => {
            console.log('New Window');
          }
        },
        { type: 'separator' } as MenuItemConstructorOptions,
        {
          label: 'Open Folder...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const { canceled, filePaths } = await dialog.showOpenDialog(win, {
              properties: ['openDirectory']
            });
            if (!canceled && filePaths[0]) {
              win.webContents.send('menu-action', 'open-folder', filePaths[0]);
            }
          }
        },
        { type: 'separator' } as MenuItemConstructorOptions,
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            win.webContents.send('menu-action', 'save');
          }
        },
        { type: 'separator' } as MenuItemConstructorOptions,
        {
          label: 'Preferences...',
          accelerator: 'Ctrl+,',
          click: () => win.webContents.send('menu-action', 'open-preferences')
        },
        { type: 'separator' } as MenuItemConstructorOptions,
        { role: 'close' }
      ]
    } as MenuItemConstructorOptions,
    // { role: 'editMenu' }
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' } as MenuItemConstructorOptions,
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { role: 'selectAll' },
        { type: 'separator' } as MenuItemConstructorOptions,
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => win.webContents.send('menu-action', 'find')
        }
      ]
    } as MenuItemConstructorOptions,
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => win.webContents.reload()
        },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' } as MenuItemConstructorOptions,
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' } as MenuItemConstructorOptions,
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+/',
          click: () => win.webContents.send('menu-action', 'toggle-sidebar')
        },
        {
          label: 'Toggle Source Mode',
          accelerator: 'CmdOrCtrl+U',
          click: () => win.webContents.send('menu-action', 'toggle-source-mode')
        },
        { role: 'togglefullscreen' }
      ]
    } as MenuItemConstructorOptions,
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [
            { type: 'separator' } as MenuItemConstructorOptions,
            { role: 'front' },
            { type: 'separator' } as MenuItemConstructorOptions,
            { role: 'window' }
          ]
          : [
            { role: 'close' }
          ])
      ]
    } as MenuItemConstructorOptions,
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            await shell.openExternal('https://electronjs.org');
          }
        }
      ]
    } as MenuItemConstructorOptions
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
