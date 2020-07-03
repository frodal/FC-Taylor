////////////////////////////////////////////////////////////////////////////////////
//                                 Lisence check                                  //
////////////////////////////////////////////////////////////////////////////////////
const { app, dialog, BrowserWindow, ipcMain } = require('electron');
const bent = require('bent')
const getJSON = bent('json')

const LicenseLocation = 'http://folk.ntnu.no/frodal/Cite/Projects/FC-Taylor.json';
let LicenseOK = false;

async function CheckLicense() {
    getJSON(LicenseLocation)
        .then(value => {
            ValidateLicense(value);
            if (!LicenseOK) {
                dialog.showErrorBox('Error', 'The version of the program you are using is deprecated.\nPlease request a new version from the distributer.\nContact: bjorn.h.frodal@ntnu.no');
                app.quit();
            }
        }).catch(error => {
            SendToRenderer(false);
            let choice = dialog.showMessageBoxSync(BrowserWindow.getFocusedWindow(),
                {
                    type: 'error',
                    title: 'Error',
                    message: 'Could not connect to the license server.\nPlease check your internet connection.\nContact: bjorn.h.frodal@ntnu.no',
                    buttons: ['Try again', 'Quit'],
                    cancelId: 1
                });
            if (choice === 0) {
                CheckLicense();
            } else {
                app.quit();
            }
        });
}

function ValidateLicense(value) {
    let newestVersion = value.version.split('.')
    let currentVersion = app.getVersion().split('.');
    if (newestVersion.length !== currentVersion.length) {
        SendToRenderer(false);
        return
    }
    for (let i = 0; i < currentVersion.length; ++i) {
        newestVersion[i] = parseFloat(newestVersion[i])
        currentVersion[i] = parseFloat(currentVersion[i])
        if (newestVersion[i] > currentVersion[i]) {
            SendToRenderer(false);
            return
        }
        else if (newestVersion[i] < currentVersion[i]) {
            SendToRenderer(true);
            return
        }
    }
    SendToRenderer(true);
}

function SendToRenderer(value) {
    LicenseOK = value;
    let win = BrowserWindow.getFocusedWindow();
    if (win) {
        win.send('LicenseCheck', value);
    }
}

async function CheckVersion() {
    getJSON(LicenseLocation)
        .then(value => {
            let newestVersion = value.newestVersion.split('.')
            let currentVersion = app.getVersion().split('.');
            if (newestVersion.length !== currentVersion.length) {
                openVersionDialog(false);
                return
            }
            for (let i = 0; i < currentVersion.length; ++i) {
                newestVersion[i] = parseFloat(newestVersion[i])
                currentVersion[i] = parseFloat(currentVersion[i])
                if (newestVersion[i] > currentVersion[i]) {
                    openVersionDialog(false);
                    return
                }
                else if (newestVersion[i] < currentVersion[i]) {
                    openVersionDialog(true);
                    return
                }
            }
            openVersionDialog(true);
        }).catch(error => {
            const options =
            {
                type: "info",
                title: "Connection error",
                message: "Could not connect to the license server.\nPlease check your internet connection and try again.",
                buttons: ['Ok']
            };
            dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options);
        });
}

function openVersionDialog(uptoDate) {
    if (uptoDate) {
        const options =
        {
            type: "info",
            title: "You're all good",
            message: "You've got the latest version of " + app.name + "; thanks for staying on the ball",
            buttons: ['Ok']
        };
        dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options);
    } else {
        const options =
        {
            type: "info",
            title: "New version available",
            message: "A new version of " + app.name + " is available.\nContact: bjorn.h.frodal@ntnu.no",
            buttons: ['Ok']
        };
        dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options);
    }
}

////////////////////////////////////////////////////////////////////////////////////

// Check license request from the renderer process
ipcMain.on('CheckLicensePlease', CheckLicense);

// Repetatly check license every 10 min
setInterval(CheckLicense, 600000);

// Exports
exports.CheckVersion = CheckVersion;