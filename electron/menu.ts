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
        { type: 'separator' } as MenuItemConstructorOptions,
        { label: 'Increase Heading Level', accelerator: 'CmdOrCtrl+Plus', click: () => win.webContents.send('menu-action', 'increase-heading') },
        { label: 'Decrease Heading Level', accelerator: 'CmdOrCtrl+-', click: () => win.webContents.send('menu-action', 'decrease-heading') },
        { type: 'separator' } as MenuItemConstructorOptions,
        { label: 'Paragraph', accelerator: 'CmdOrCtrl+0', click: () => win.webContents.send('menu-action', 'paragraph') },
        { type: 'separator' } as MenuItemConstructorOptions,
        {
          label: 'Table',
          submenu: [
            { label: 'Insert Table', click: () => win.webContents.send('menu-action', 'insert-table') },
            { type: 'separator' } as MenuItemConstructorOptions,
            { label: 'Add Row Above', click: () => win.webContents.send('menu-action', 'table-add-row-before') },
            { label: 'Add Row Below', click: () => win.webContents.send('menu-action', 'table-add-row-after') },
            { label: 'Delete Row', click: () => win.webContents.send('menu-action', 'table-delete-row') },
            { type: 'separator' } as MenuItemConstructorOptions,
            { label: 'Add Column Left', click: () => win.webContents.send('menu-action', 'table-add-col-before') },
            { label: 'Add Column Right', click: () => win.webContents.send('menu-action', 'table-add-col-after') },
            { label: 'Delete Column', click: () => win.webContents.send('menu-action', 'table-delete-col') },
          ]
        } as MenuItemConstructorOptions,
        { label: 'Code Fences', accelerator: 'CmdOrCtrl+Shift+K', click: () => win.webContents.send('menu-action', 'code-block') },
        { label: 'Math Block', accelerator: 'CmdOrCtrl+Shift+M', click: () => win.webContents.send('menu-action', 'math-block') },
        { label: 'Quote', accelerator: 'CmdOrCtrl+Shift+Q', click: () => win.webContents.send('menu-action', 'blockquote') },
        { type: 'separator' } as MenuItemConstructorOptions,
        { label: 'Ordered List', accelerator: 'CmdOrCtrl+Shift+[', click: () => win.webContents.send('menu-action', 'ordered-list') },
        { label: 'Unordered List', accelerator: 'CmdOrCtrl+Shift+]', click: () => win.webContents.send('menu-action', 'bullet-list') },
        { label: 'Task List', accelerator: 'CmdOrCtrl+Shift+X', click: () => win.webContents.send('menu-action', 'task-list') },
        { type: 'separator' } as MenuItemConstructorOptions,
        { label: 'Horizontal Line', accelerator: 'CmdOrCtrl+Shift+-', click: () => win.webContents.send('menu-action', 'horizontal-rule') },
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
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+Shift+0',
          click: () => {
            win.webContents.setZoomLevel(0);
            win.webContents.send('zoom-changed', 100);
          }
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Shift+=',
          click: () => {
            const currentZoom = win.webContents.getZoomLevel();
            const newZoom = currentZoom + 0.5;
            win.webContents.setZoomLevel(newZoom);
            // Convert zoom level to percentage (zoom level 0 = 100%, each level is ~25%)
            const percentage = Math.round(100 * Math.pow(1.2, newZoom));
            win.webContents.send('zoom-changed', percentage);
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+Shift+-',
          click: () => {
            const currentZoom = win.webContents.getZoomLevel();
            const newZoom = currentZoom - 0.5;
            win.webContents.setZoomLevel(newZoom);
            const percentage = Math.round(100 * Math.pow(1.2, newZoom));
            win.webContents.send('zoom-changed', percentage);
          }
        },
        { type: 'separator' } as MenuItemConstructorOptions,
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+Shift+L',
          click: () => win.webContents.send('menu-action', 'toggle-sidebar')
        },
        {
          label: 'Toggle Source Mode',
          accelerator: 'CmdOrCtrl+/',
          click: () => win.webContents.send('menu-action', 'toggle-source-mode')
        },
        {
          label: 'Focus Mode',
          accelerator: 'CmdOrCtrl+Shift+F',
          click: () => win.webContents.send('menu-action', 'toggle-focus-mode')
        },
        { type: 'separator' } as MenuItemConstructorOptions,
        { role: 'togglefullscreen' }
      ]
    } as MenuItemConstructorOptions,
    // Format menu (like Typora)
    {
      label: 'Format',
      submenu: [
        { label: 'Strong', accelerator: 'CmdOrCtrl+B', click: () => win.webContents.send('menu-action', 'format-bold') },
        { label: 'Emphasis', accelerator: 'CmdOrCtrl+I', click: () => win.webContents.send('menu-action', 'format-italic') },
        { label: 'Underline', accelerator: 'CmdOrCtrl+U', click: () => win.webContents.send('menu-action', 'format-underline') },
        { label: 'Code', accelerator: 'CmdOrCtrl+Shift+`', click: () => win.webContents.send('menu-action', 'format-code') },
        { type: 'separator' } as MenuItemConstructorOptions,
        { label: 'Inline Math', click: () => win.webContents.send('menu-action', 'format-inline-math') },
        { label: 'Strike', click: () => win.webContents.send('menu-action', 'format-strike') },
        { label: 'Comment', click: () => win.webContents.send('menu-action', 'format-comment') },
        { type: 'separator' } as MenuItemConstructorOptions,
        { label: 'Hyperlink', accelerator: 'CmdOrCtrl+K', click: () => win.webContents.send('menu-action', 'insert-link') },
        { label: 'Image', accelerator: 'CmdOrCtrl+Ctrl+I', click: () => win.webContents.send('menu-action', 'insert-image') },
        { type: 'separator' } as MenuItemConstructorOptions,
        { label: 'Highlight', accelerator: 'CmdOrCtrl+Shift+H', click: () => win.webContents.send('menu-action', 'format-highlight') },
        { label: 'Superscript', click: () => win.webContents.send('menu-action', 'format-superscript') },
        { label: 'Subscript', click: () => win.webContents.send('menu-action', 'format-subscript') },
        { type: 'separator' } as MenuItemConstructorOptions,
        { label: 'Clear Format', accelerator: 'CmdOrCtrl+\\', click: () => win.webContents.send('menu-action', 'clear-format') },
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
