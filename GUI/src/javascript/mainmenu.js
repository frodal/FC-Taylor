const { app, Menu, shell, dialog, nativeImage, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const LicenseChecker = require('./license');
const openAboutWindow = require('about-window').default;

const appName = app.name;
const appIconPath = path.join(__dirname, '../../assets/icons/png/512x512.png');
const appIcon = nativeImage.createFromPath(appIconPath);
const bugReportURL = 'https://gitreports.com/issue/frodal/FC-Taylor';
const defaultLicenseString = 'Copyright (c) 2018-2021 Bjørn Håkon Frodal';
let licenseString = '';

function GetLicense() {
    if (licenseString === '') {
        try {
            licenseString = fs.readFileSync(path.join(__dirname, '../../LICENSE.md'));
        } catch (err) {
            licenseString = defaultLicenseString;
        }
    }
    return licenseString;
};

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
                click() { shell.openExternal('https://folk.ntnu.no/frodal/Cite/Projects/FC-Taylor.html') }
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
                click() { LicenseChecker.CheckVersion() }
            },
            {
                type: 'separator'
            },
            {
                label: 'About',
                click() {
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