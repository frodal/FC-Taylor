const { app, Menu, shell, dialog, nativeImage, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const LicenseChecker = require('./license');

const appName = app.name;
const appIcon = nativeImage.createFromPath(path.join(__dirname, '../../assets/icons/png/64x64.png'))
let licenseString = '';

function GetLicense() {
    if (licenseString === '') {
        try {
            licenseString = fs.readFileSync(path.join(__dirname, '../../LICENSE.md'));
        } catch (err) {
            licenseString = 'Copyright (c) 2018-2020 Bjørn Håkon Frodal';
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
                click() { shell.openExternal('https://gitreports.com/issue/frodal/FC-Taylor') }
            },
            {
                label: 'Learn More',
                click() { shell.openExternal('http://folk.ntnu.no/frodal/Cite/Projects/FC-Taylor.html') }
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
                    dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
                        type: "info",
                        title: 'About ' + appName,
                        message: appName + "\n" +
                            "Version: " + app.getVersion() + "\n\n" +
                            "Built with \n" +
                            "Electron: " + process.versions.electron + "\n" +
                            "Chrome: " + process.versions.chrome + "\n" +
                            "Node.js: " + process.versions.node,
                        buttons: ['Ok'],
                        icon: appIcon
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