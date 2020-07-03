const { ipcMain, dialog, BrowserWindow } = require('electron');

// Open file dialog to open file
ipcMain.on('open-file-dialog', (event) => {
    dialog.showOpenDialog(BrowserWindow.getFocusedWindow(),
        {
            filters: [{ name: 'All files', extensions: ['*'] }],
            properties: ['openFile']
        }).then((files) => {
            if (!files.canceled) {
                event.sender.send('SelectedFile', files.filePaths);
            }
        });
});

// Open file dialog to import file
ipcMain.on('import-file-dialog', (event) => {
    dialog.showOpenDialog(BrowserWindow.getFocusedWindow(),
        {
            filters: [{ name: 'FC-Taylor input file', extensions: ['inp'] }],
            properties: ['openFile']
        }).then((files) => {
            if (!files.canceled) {
                event.sender.send('ImportFile', files.filePaths);
            }
        });
});

// Open export file dialog to save file
ipcMain.on('export-file-dialog', (event) => {
    dialog.showSaveDialog(BrowserWindow.getFocusedWindow(),
        {
            filters: [{ name: 'FC-Taylor input file', extensions: ['inp'] },
            { name: 'All files', extensions: ['*'] }]
        }).then((files) => {
            if (!files.canceled) {
                event.sender.send('ExportFile', files.filePath);
            }
        });
});

// Open save file dialog to save file
ipcMain.on('save-file-dialog', (event) => {
    dialog.showSaveDialog(BrowserWindow.getFocusedWindow(),
        {
            filters: [{ name: 'csv', extensions: ['csv'] },
            { name: 'All files', extensions: ['*'] }]
        }).then((files) => {
            if (!files.canceled) {
                event.sender.send('SaveFile', files.filePath);
            }
        });
});
// Open save file dialog to save calibrated parameters file
ipcMain.on('save-calibration-dialog', (event) => {
    dialog.showSaveDialog(BrowserWindow.getFocusedWindow(),
        {
            filters: [{ name: 'csv', extensions: ['csv'] },
            { name: 'All files', extensions: ['*'] }]
        }).then((files) => {
            if (!files.canceled) {
                event.sender.send('SaveCalibration', files.filePath);
            }
        });
});

// Opens an error dialog message
ipcMain.on('open-error-dialog', (event) => {
    dialog.showErrorBox('Error', 'Could not execute the FC-Taylor analysis!\nPlease report this issue by going to help and Report Issue.\nError code: 1');
});
// Opens an error dialog message
ipcMain.on('open-errorKilled-dialog', (event, errorCode) => {
    if (errorCode) {
        dialog.showErrorBox('Error', parseError(errorCode));
    } else {
        dialog.showErrorBox('Error', 'An error occured while executing the analysis!\nSee the ouput for details.\nPlease report this issue by going to help and Report Issue.\nError code: 2');
    }
});
ipcMain.on('open-errorCalibration-dialog', (event) => {
    dialog.showErrorBox('Error', 'An error occured during calibration!\nPlease report this issue by going to help and Report Issue.\nError code: 3');
});

function parseError(errorCode) {
    let msg = 'An error occured while executing the analysis!\nError code: ' + errorCode;
    switch (errorCode) {
        case 11:
            msg += '\nMaximum iterations reached, please check your input values.';
            break;
        case 12:
            msg += '\nFC-Taylor core did not receive any material input.';
            break;
        case 13:
            msg += '\nUnknown keyword used for material input.';
            break;
        case 14:
            msg += '\nThe resolution of the strain rate grid must be an integer larger or equal to 2.';
            break;
        case 15:
            msg += '\nFC-Taylor core did not receive any texture input.';
            break;
        case 16:
            msg += '\nUnknown keyword used for texture input.';
            break;
        case 17:
            msg += '\nThe weight of a grain must be positive, your texture input contains grain weights that are less than or equal to zero.';
            break;
        case 18:
            msg += '\nThe number of grain orientations read from the texture file is zero.\nPlease make sure that the texture file has the correct format and keyword.';
            break;
        case 19:
            msg += '\nThe work-hardening model specified is not supported by FC-Taylor core.';
            break;
        default:
            msg += '\nUnknown error, please report this issue by going to help and Report Issue.';
    }
    return msg;
}

// Opens a warning dialog message
ipcMain.on('check-input-dialog', (event) => {
    const options =
    {
        type: "info",
        title: "Warning",
        message: "Please check your input!\nMake sure that the supplied input values are, e.g., positive or non negative numbers!\n",
        buttons: ['Ok']
    };
    dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options);
})

// Opens a success dialog message
ipcMain.on('open-successfulTermination-dialog', (event) => {
    const options =
    {
        type: "info",
        title: "Success",
        message: "Analysis ended successfully",
        buttons: ['Ok']
    };
    dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options);
})
// Opens a success dialog message
ipcMain.on('open-successfulCalibration-dialog', (event) => {
    const options =
    {
        type: "info",
        title: "Success",
        message: "Calibration ended successfully",
        buttons: ['Ok']
    };
    dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options);
})