import {app, BrowserWindow, ipcMain} from 'electron';

declare const MAIN_WINDOW_WEBPACK_ENTRY: any;
import {checkForStoreUpdate, updateStore} from "./util/store";
import log from 'electron-log';
import {initFolders} from "./util/file";

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

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  if (process.env.NODE_ENV === 'development') {
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  }
};

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
