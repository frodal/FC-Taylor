////////////////////////////////////////////////////////////////////////////////////
//                                 Lisence check                                  //
////////////////////////////////////////////////////////////////////////////////////
const {app, dialog, BrowserWindow, ipcMain} = require('electron');
const bent = require('bent')
const getJSON = bent('json')

const LicenseLocation = 'http://folk.ntnu.no/frodal/Cite/Projects/FC-Taylor.json';
let LicenseOK = false;

async function CheckLicense()
{
    getJSON(LicenseLocation)
        .then(value => {
            ValidateLicense(value);
            if (!LicenseOK) 
            {
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
            if (choice === 0) 
            {
                CheckLicense();
            } else 
            {
                app.quit();
            }
        });
}

function ValidateLicense(value) 
{
    let newestVersion = value.version.split('.')
    let currentVersion = app.getVersion().split('.');
    if (newestVersion.length !== currentVersion.length) 
    {
        SendToRenderer(false);
        return
    }
    for (let i = 0; i < currentVersion.length; ++i) 
    {
        newestVersion[i] = parseFloat(newestVersion[i])
        currentVersion[i] = parseFloat(currentVersion[i])
        if (newestVersion[i] > currentVersion[i]) 
        {
            SendToRenderer(false);
            return
        }
        else if (newestVersion[i] < currentVersion[i]) 
        {
            SendToRenderer(true);
            return
        }
    }
    SendToRenderer(true);
}

function SendToRenderer(value)
{
    LicenseOK = value;
    let win = BrowserWindow.getFocusedWindow();
    if(win)
    {
        win.send('LicenseCheck',value);
    }
}

ipcMain.on('CheckLicensePlease',CheckLicense);

// Repetatly check license every 10 min
setInterval(CheckLicense,600000);