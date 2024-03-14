const { app, Menu, shell, dialog, nativeImage, BrowserWindow, autoUpdater } = require('electron');
const path = require('path');

const appName = app.name;
const appIconPath = path.join(__dirname, '../../assets/icons/png/512x512.png');
const appIcon = nativeImage.createFromPath(appIconPath);
const LearnMoreURL = 'https://github.com/frodal/FC-Taylor#fc-taylor-program';
const bugReportURL = 'https://github.com/frodal/FC-Taylor/issues';
const defaultLicenseString = 'Copyright (c) 2018-2024 Bjørn Håkon Frodal';
let licenseString = '';
let updateAvailable = false;

autoUpdater.on('update-available', () => {
    updateAvailable = true;
}).on('update-not-available', () => {
    updateAvailable = false;
}).on('error', (error) => {
    logger = require('electron-log');
    logger.error(error);
});

function GetLicense() {
    if (licenseString === '') {
        try {
            const fs = require('fs');
            licenseString = fs.readFileSync(path.join(__dirname, '../../LICENSE.md'));
        } catch (err) {
            licenseString = defaultLicenseString;
        }
    }
    return licenseString;
};

function openVersionDialog(uptoDate, displayDialogOnUptoDate) {
    if (uptoDate) {
        if (displayDialogOnUptoDate) {
            const options =
            {
                type: "info",
                title: "You're all good",
                message: "You've got the latest version of " + app.name + "; thanks for staying on the ball",
                buttons: ['Ok']
            };
            dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options);
        }
    } else {
        const options =
        {
            type: "info",
            title: "New version available",
            message: "A new version of " + app.name + " is available.\nDownload it from the GitHub page.",
            buttons: ['Ok']
        };
        dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options);
    }
}

function CreateMenu(template = [
    {
        role: 'window',
        submenu: [
            {
                role: 'reload'
            },
            {
                type: 'separator'
            },
            {
                role: 'togglefullscreen'
            },
            {
                type: 'separator'
            },
            {
                role: 'minimize'
            },
            {
                role: 'close'
            }
        ]
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'Report Issue',
                click() { shell.openExternal(bugReportURL) }
            },
            {
                label: 'Learn More',
                click() { shell.openExternal(LearnMoreURL) }
            },
            {
                type: 'separator'
            },
            {
                label: 'View License',
                click() {
                    GetLicense();
                    dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
                        type: "info",
                        title: 'License',
                        message: appName + " License\n\n" +
                            licenseString,
                        buttons: ['Ok'],
                        icon: appIcon
                    });
                }
            },
            {
                type: 'separator'
            },
            {
                label: 'Check for Updates',
                click() {
                    openVersionDialog(!updateAvailable, true)
                }
            },
            {
                type: 'separator'
            },
            {
                label: 'About',
                click() {
                    const openAboutWindow = require('about-window').default;
                    openAboutWindow({
                        icon_path: appIconPath,
                        bug_report_url: bugReportURL,
                        copyright: defaultLicenseString
                    });
                }
            }
        ]
    }
]) {
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// Exports
exports.CreateMenu = CreateMenu;