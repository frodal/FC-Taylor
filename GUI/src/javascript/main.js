// Handle installation, update and uninstall events
if (require('electron-squirrel-startup')) return;

// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let isReadyOrFinishedLoading = false;

function showWindowIfReadyAndFinishedLoading() {
    if (isReadyOrFinishedLoading)
        mainWindow.show();
    else
        isReadyOrFinishedLoading = true;
}

function createWindow() {
    const path = require('path');
    // Create the browser window.
    mainWindow = new BrowserWindow(
        {
            width: 1280,
            height: 720,
            titleBarStyle: 'default',
            icon: path.join(__dirname, '../../assets/icons/png/64x64.png'),
            show: false,
            backgroundColor: '#FFFFFF',
            webPreferences:
            {
                nodeIntegration: true,
                contextIsolation: false
            }
        });

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, '../html/index.html')).then(() => {
        showWindowIfReadyAndFinishedLoading();
    });

    // Open the DevTools.
    const isDev = !app.isPackaged
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

    // Shows the window once it is loaded and ready to be displayed
    mainWindow.once('ready-to-show', () => {
        showWindowIfReadyAndFinishedLoading();
    });

    // Sets the application menu, i.e., 'File', 'Edit' etc. 
    // Passing null will suppress the default menu. On Windows and Linux, 
    // this has the additional effect of removing the menu bar from the window.
    const ToolbarMenu = require('./mainmenu');
    ToolbarMenu.CreateMenu();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// update application using update-electron-app
const { updateElectronApp } = require('update-electron-app');
updateElectronApp({ logger: require('electron-log') });

require('./dialog');

const DarkMode = require('./darkMode');
DarkMode.Init();