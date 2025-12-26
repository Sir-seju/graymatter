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
          label: 'Export',
          submenu: [
            {
              label: 'Export as PDF...',
              accelerator: 'CmdOrCtrl+Shift+E',
              click: () => win.webContents.send('menu-action', 'export-pdf')
            },
            {
              label: 'Export as HTML...',
              click: () => win.webContents.send('menu-action', 'export-html')
            }
          ]
        },
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
    // Paragraph menu (like Typora)
    {
      label: 'Paragraph',
      submenu: [
        { label: 'Heading 1', accelerator: 'CmdOrCtrl+1', click: () => win.webContents.send('menu-action', 'heading-1') },
        { label: 'Heading 2', accelerator: 'CmdOrCtrl+2', click: () => win.webContents.send('menu-action', 'heading-2') },
        { label: 'Heading 3', accelerator: 'CmdOrCtrl+3', click: () => win.webContents.send('menu-action', 'heading-3') },
        { label: 'Heading 4', accelerator: 'CmdOrCtrl+4', click: () => win.webContents.send('menu-action', 'heading-4') },
        { label: 'Heading 5', accelerator: 'CmdOrCtrl+5', click: () => win.webContents.send('menu-action', 'heading-5') },
        { label: 'Heading 6', accelerator: 'CmdOrCtrl+6', click: () => win.webContents.send('menu-action', 'heading-6') },
        { label: 'Paragraph', accelerator: 'CmdOrCtrl+0', click: () => win.webContents.send('menu-action', 'paragraph') },
        { type: 'separator' } as MenuItemConstructorOptions,
        { label: 'Quote', accelerator: 'CmdOrCtrl+Shift+Q', click: () => win.webContents.send('menu-action', 'blockquote') },
        { label: 'Ordered List', accelerator: 'CmdOrCtrl+Shift+O', click: () => win.webContents.send('menu-action', 'ordered-list') },
        { label: 'Bullet List', accelerator: 'CmdOrCtrl+Shift+L', click: () => win.webContents.send('menu-action', 'bullet-list') },
        { label: 'Task List', accelerator: 'CmdOrCtrl+Shift+X', click: () => win.webContents.send('menu-action', 'task-list') },
        { type: 'separator' } as MenuItemConstructorOptions,
        { label: 'Horizontal Line', accelerator: 'CmdOrCtrl+Shift+-', click: () => win.webContents.send('menu-action', 'horizontal-rule') },
        { label: 'Code Block', accelerator: 'CmdOrCtrl+Shift+K', click: () => win.webContents.send('menu-action', 'code-block') }
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
          accelerator: 'CmdOrCtrl+Shift+U',
          click: () => win.webContents.send('menu-action', 'toggle-source-mode')
        },
        { role: 'togglefullscreen' }
      ]
    } as MenuItemConstructorOptions,
    // Format menu
    {
      label: 'Format',
      submenu: [
        {
          label: 'Bold',
          accelerator: 'CmdOrCtrl+B',
          click: () => win.webContents.send('menu-action', 'format-bold')
        },
        {
          label: 'Italic',
          accelerator: 'CmdOrCtrl+I',
          click: () => win.webContents.send('menu-action', 'format-italic')
        },
        {
          label: 'Underline',
          accelerator: 'CmdOrCtrl+U',
          click: () => win.webContents.send('menu-action', 'format-underline')
        },
        {
          label: 'Strikethrough',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => win.webContents.send('menu-action', 'format-strike')
        },
        { type: 'separator' } as MenuItemConstructorOptions,
        {
          label: 'Highlight',
          accelerator: 'CmdOrCtrl+Shift+H',
          click: () => win.webContents.send('menu-action', 'format-highlight')
        },
        {
          label: 'Inline Code',
          accelerator: 'CmdOrCtrl+`',
          click: () => win.webContents.send('menu-action', 'format-code')
        }
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
