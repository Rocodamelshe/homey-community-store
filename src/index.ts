import {app, BrowserWindow, ipcMain, Menu} from 'electron';

declare const MAIN_WINDOW_WEBPACK_ENTRY: any;
import {checkForStoreUpdate, updateStore} from "./util/store";
import log from 'electron-log';
import {initFolders} from "./util/file";
import MenuItemConstructorOptions = Electron.MenuItemConstructorOptions;
import MenuItem = Electron.MenuItem;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  log.debug('Running app in mode:', process.env.NODE_ENV);
  log.debug('Initialise required folders');
  initFolders();

  log.info('Create the main window');
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 800,
    width: 1000,
    minWidth: 850,
    minHeight: 400,
    webPreferences: {
      nodeIntegration: true
    },
  });

  createMenu();

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  if (process.env.NODE_ENV === 'development') {
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  }
};

function createMenu() {
  const isMac = process.platform === 'darwin'

  const template: any = [
    // { role: 'appMenu' }
    ...(isMac ? [{
      label: app.name,
      submenu: [
        {role: 'about'},
        {
          label: 'Check for updates', click: (menu: any, window: any) => {
            window.webContents.send('check-for-updates');
          }
        },
        {type: 'separator'},
        {role: 'services'},
        {type: 'separator'},
        {role: 'hide'},
        {role: 'hideothers'},
        {role: 'unhide'},
        {type: 'separator'},
        {role: 'quit'}
      ]
    }] : []),
    // { role: 'fileMenu' }
    // {
    //   label: 'File',
    //   submenu: [
    //     isMac ? { role: 'close' } : { role: 'quit' }
    //   ]
    // },
    // { role: 'editMenu' }
    // {
    //   label: 'Edit',
    //   submenu: [
    //     { role: 'undo' },
    //     { role: 'redo' },
    //     { type: 'separator' },
    //     { role: 'cut' },
    //     { role: 'copy' },
    //     { role: 'paste' },
    //     ...(isMac ? [
    //       { role: 'pasteAndMatchStyle' },
    //       { role: 'delete' },
    //       { role: 'selectAll' },
    //       { type: 'separator' },
    //       {
    //         label: 'Speech',
    //         submenu: [
    //           { role: 'startspeaking' },
    //           { role: 'stopspeaking' }
    //         ]
    //       }
    //     ] : [
    //       { role: 'delete' },
    //       { type: 'separator' },
    //       { role: 'selectAll' }
    //     ])
    //   ]
    // },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        {role: 'reload'},
        {role: 'forcereload'},
        {role: 'toggledevtools'},
        {type: 'separator'},
        {role: 'resetzoom'},
        {role: 'zoomin'},
        {role: 'zoomout'},
        {type: 'separator'},
        {role: 'togglefullscreen'}
      ]
    },
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        {role: 'minimize'},
        {role: 'zoom'},
        ...(isMac ? [
          {type: 'separator'},
          {role: 'front'},
          {type: 'separator'},
          {role: 'window'}
        ] : [
          {role: 'close'}
        ])
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const {shell} = require('electron')
            await shell.openExternal('https://electronjs.org')
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}


ipcMain.on('check-for-update', async (event, args) => {
  log.info('Check for Store update');
  if (await checkForStoreUpdate()) { //Compare semver version to detect if update is available
    log.info('App Store update is available');
    event.reply('check-for-update-completed', true);
  } else {
    log.info('Running latest version');
  }
});

ipcMain.on('update-store', async (event, args) => {
  log.info('Store update started');
  const update: { success: boolean, error?: any } = await updateStore();
  if (!update.success) {
    log.error('Store update failed', update);
  }
  log.info('Store update process completed');
  event.reply('update-store-finished', update);
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
