// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { ipcRenderer } = require('electron');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const fsExtra = require('fs-extra');

const { FCTaylorProperties } = require('./FCTaylorProperties');
const { Plotter } = require('./Plotter');
const { YieldSurface, DiscreteYieldSurface } = require('./YieldSurface');

const startProgramBtn = document.getElementById('StartProgramBtn');
const terminateProgramBtn = document.getElementById('TerminateProgramBtn');
const saveResultBtn = document.getElementById('SaveResultBtn');
const saveCalibrationBtn = document.getElementById('SaveCalibrationBtn');
const calibrateYsBtn = document.getElementById('CalibrateYS');
const roller = document.getElementById('lds-roller');
const calibRoller = document.getElementById('lds-roller-calibration');
const runMsg = document.getElementById('running');
const calibMsg = document.getElementById('calibrating');
const outArea = document.getElementById('OutputData');
const darkSwitch = document.getElementById('darkSwitch');
const ImportSettingsBtn = document.getElementById('ImportSettingsBtn');
const ExportSettingsBtn = document.getElementById('ExportSettingsBtn');

const corePath = path.join(__dirname, '../../Core/FC-Taylor.exe');
const openMPdll = path.join(__dirname, '../../Core/libiomp5md.dll');
const calibratePath = path.join(__dirname, '../../Core/FC-Taylor-Calibrate.exe');
const workDir = path.join(__dirname, '../../../core-temp-pid' + process.pid.toString())
const inputPath = path.join(workDir, 'Input');
const outputPath = path.join(workDir, 'Output');
let exeCommandArgs = [''];
let subProcess = null;
let stdoutput = '';
let killedDueToError = false;

////////////////////////////////////////////////////////////////////////////////////
//                                     Input                                      //
////////////////////////////////////////////////////////////////////////////////////
// Texture input
const selectFileBtn = document.getElementById('SelectFileBtn');
const filePathArea = document.getElementById('FilePath');
let texFile = '';

// FC-Taylor input data
const inputData = new FCTaylorProperties();
let isPlaneStress = inputData.planeStress.checked;

// Plot variables
let DiscreteYS = new DiscreteYieldSurface();
let ys = new YieldSurface();
const plotter = new Plotter(darkSwitch);
window.addEventListener('load', () => { setTimeout(UpdateAllPlots, 1000) });

////////////////////////////////////////////////////////////////////////////////////
//                                 License check                                  //
////////////////////////////////////////////////////////////////////////////////////
let LicenseOK = false;
ipcRenderer.on('LicenseCheck', (event, value) => {
    LicenseOK = value;
});
window.addEventListener('load', () => { ipcRenderer.send('CheckLicensePlease'); });

////////////////////////////////////////////////////////////////////////////////////
//                           Setup working directory                              //
////////////////////////////////////////////////////////////////////////////////////
function SetupWorkingDir() {
    if (!fs.existsSync(workDir)) {
        fs.mkdirSync(workDir, { recursive: true });
    }
    if (!fs.existsSync(inputPath)) {
        fs.mkdirSync(inputPath, { recursive: true });
    }
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
    }
    if (process.platform === 'win32') {
        // Copies the OpenMP dll to the working directory on Windows
        const openMPdllTempPath = path.join(workDir, 'libiomp5md.dll')
        if (!openMPdllTempPath.exists) {
            fs.copyFileSync(openMPdll, openMPdllTempPath);
        }
    // } else if (process.platform === 'linux') {
        // OpenMP is statically linked for linux with the Intel compiler
    } else if (process.platform === 'darwin') {
        // TODO: Statically link openMP for darwin or include the dynamic link library for darwin in Core
        console.log('OpenMP is not yet supported on darwin!')
    }
}

////////////////////////////////////////////////////////////////////////////////////
//                                 Select File                                    //
////////////////////////////////////////////////////////////////////////////////////
// Sets select program button callback
selectFileBtn.addEventListener('click', (event) => {
    ipcRenderer.send('open-file-dialog');
});
// Sets the executable filepath received from the main process (main.js)
ipcRenderer.on('SelectedFile', (event, newPath) => {
    if (newPath.toString() !== '') {
        SetupWorkingDir();
        texFile = newPath.toString();
        filePathArea.innerHTML = `${texFile}`;
        startProgramBtn.disabled = false;
    }
});

////////////////////////////////////////////////////////////////////////////////////
//                           Export/Import settings                               //
////////////////////////////////////////////////////////////////////////////////////
// Export Taylor settings to file
ExportSettingsBtn.addEventListener('click', (event) => {
    ipcRenderer.send('export-file-dialog');
});
ipcRenderer.on('ExportFile', (event, savePath) => {
    if (savePath.toString() !== '') {
        inputData.ExportTaylor(savePath);
    }
});
// Import Taylor settings from file
ImportSettingsBtn.addEventListener('click', (event) => {
    ipcRenderer.send('import-file-dialog');
});
ipcRenderer.on('ImportFile', (event, importPath) => {
    if (importPath.toString() !== '') {
        fs.createReadStream(importPath[0], { encoding: 'UTF-8' })
            .on('data', (data) => {
                inputData.parseTaylorFile(data)
            });
    }
});

////////////////////////////////////////////////////////////////////////////////////
//                                Start Program                                   //
////////////////////////////////////////////////////////////////////////////////////
// Sets start program button callback
startProgramBtn.addEventListener('click', (event) => {
    // Delete old output file
    DeleteOutput();
    UpdateEnableSaveAndCalibrate();
    if (!LicenseOK)
    {
        ipcRenderer.send('CheckLicensePlease');
        return
    }
    if (inputData.SafeInput()) {
        // Clear output data field
        outArea.innerHTML = '';
        // Sets the current working directory of the selected program to be its own directory
        let options = { cwd: workDir };
        // disable start button when program is running
        startProgramBtn.disabled = true;
        // Saving input from user to file
        isPlaneStress = inputData.planeStress.checked;
        inputData.SaveInput(inputPath, texFile);
        // Enable terminate button when program is running
        terminateProgramBtn.disabled = false;
        roller.classList.add('lds-roller');
        runMsg.innerHTML = 'Running';
        try // Try to execute the program and sets a callback for when the program terminates
        {
            subProcess = execFile(corePath, exeCommandArgs, options, function (err, data) {
                if (err !== null && !(subProcess.killed || killedDueToError)) {
                    ipcRenderer.send('open-error-dialog');
                } else if (killedDueToError) {
                    ipcRenderer.send('open-errorKilled-dialog', parseInt(err.toString().split('Error code:')[1]));
                } else {
                    ipcRenderer.send('open-successfulTermination-dialog');
                }
                killedDueToError = false;
                subProcess = null;
                stdoutput = '';
                startProgramBtn.disabled = false;
                terminateProgramBtn.disabled = true;
                roller.classList.remove('lds-roller');
                runMsg.innerHTML = '';
                UpdateEnableSaveAndCalibrate();
            });
            // Standard output callback
            subProcess.stdout.on('data', function (data) {
                stdoutput += data.toString();
                outArea.innerHTML = `${stdoutput}`;
            });
            // Standard error callback
            subProcess.stderr.on('data', function (data) {
                stdoutput += data.toString();
                outArea.innerHTML = `${stdoutput}`;
                subProcess.kill();
                killedDueToError = true;
            });
        }
        catch (err) // Catches the error if the file selected can't be executed correctly
        {
            subProcess = null;
            startProgramBtn.disabled = false;
            terminateProgramBtn.disabled = true;
            roller.classList.remove('lds-roller');
            runMsg.innerHTML = '';
            ipcRenderer.send('open-error-dialog');
            outArea.innerHTML = `${err.toString()}`;
        }
    } else {
        ipcRenderer.send('check-input-dialog');
    }
});

////////////////////////////////////////////////////////////////////////////////////
//                               Terminate Program                                //
////////////////////////////////////////////////////////////////////////////////////
// Sets terminate program button callback
terminateProgramBtn.addEventListener('click', (event) => {
    if (subProcess !== null) {
        subProcess.kill();
    } else {
        ipcRenderer.send('open-successfulTermination-dialog');
    }
});

////////////////////////////////////////////////////////////////////////////////////
//                                 Save results                                   //
////////////////////////////////////////////////////////////////////////////////////
saveResultBtn.addEventListener('click', (event) => {
    ipcRenderer.send('save-file-dialog');
});
ipcRenderer.on('SaveFile', (event, savePath) => {
    if (savePath.toString() !== '') {
        fs.copyFileSync(path.join(outputPath, 'output.txt'), savePath.toString());
    }
});
function UpdateEnableSaveAndCalibrate() {
    let isDisabled = !fs.existsSync(path.join(outputPath, 'output.txt'));
    saveResultBtn.disabled = isDisabled
    calibrateYsBtn.disabled = isDisabled
    saveCalibrationBtn.disabled = true;
    DiscreteYS.LoadDiscreteYS(outputPath, () => { UpdateAllPlots(); });
    if (isDisabled)
        ClearCalibratedParameters();
}
function DeleteOutput() {
    let tempFilePath = path.join(outputPath, 'output.txt');
    if (fs.existsSync(tempFilePath))
        fs.unlinkSync(tempFilePath);
}

////////////////////////////////////////////////////////////////////////////////////
//                             On close and reload                                //
////////////////////////////////////////////////////////////////////////////////////
window.addEventListener('beforeunload', () => {
    // Delete the working directory
    if (fs.existsSync(workDir)) {
        fsExtra.remove(workDir);
    }
});

////////////////////////////////////////////////////////////////////////////////////
//                           Calibrate yield surface                              //
////////////////////////////////////////////////////////////////////////////////////
calibrateYsBtn.addEventListener('click', (event) => {
    if (!LicenseOK)
        return
    let outfilePath = path.join(outputPath, 'output.txt');
    // Sets the current working directory of the selected program to be its own directory
    let options = { cwd: path.dirname(outfilePath) };
    // disable start button when program is running
    startProgramBtn.disabled = true;
    calibrateYsBtn.disabled = true;
    saveCalibrationBtn.disabled = true;
    ClearCalibratedParameters();
    // Show calibrating roller
    calibRoller.classList.add('lds-roller');
    calibMsg.innerHTML = 'Calibrating';
    try // Try to execute the program and sets a callback for when the program terminates
    {
        execFile(calibratePath, [outfilePath, '--space', isPlaneStress ? '2D' : '3D'], options, function (err, data) {
            startProgramBtn.disabled = false;
            calibrateYsBtn.disabled = false;
            if (err) {
                saveCalibrationBtn.disabled = true;
                ipcRenderer.send('open-errorCalibration-dialog');
            } else {
                saveCalibrationBtn.disabled = false;
                ipcRenderer.send('open-successfulCalibration-dialog');
                ys.loadCalibratedYSparams(outputPath, () => { UpdateAllPlots(); });
            }
            // Hide calibrating roller
            calibRoller.classList.remove('lds-roller');
            calibMsg.innerHTML = '';
        });
    }
    catch (err) // Catches the error if the file selected can't be executed correctly
    {
        startProgramBtn.disabled = false;
        calibrateYsBtn.disabled = false;
        saveCalibrationBtn.disabled = true;
        // Hide calibrating roller
        calibRoller.classList.remove('lds-roller');
        calibMsg.innerHTML = '';
    }
});

////////////////////////////////////////////////////////////////////////////////////
//                               Save calibration                                 //
////////////////////////////////////////////////////////////////////////////////////
saveCalibrationBtn.addEventListener('click', (event) => {
    ipcRenderer.send('save-calibration-dialog');
});
ipcRenderer.on('SaveCalibration', (event, savePath) => {
    if (savePath.toString() !== '') {
        fs.copyFileSync(path.join(outputPath, 'CalibratedParameters.dat'), savePath.toString());
    }
});

////////////////////////////////////////////////////////////////////////////////////
//                                Clear YS params                                 //
////////////////////////////////////////////////////////////////////////////////////
function ClearCalibratedParameters() {
    ys.Clear();
    UpdateAllPlots();
}

////////////////////////////////////////////////////////////////////////////////////
//                               Dark mode switch                                 //
////////////////////////////////////////////////////////////////////////////////////
darkSwitch.addEventListener('change', (event) => {
    UpdateAllPlots();
});

async function UpdateAllPlots() {
    plotter.plotScatter('plot-window-1', DiscreteYS.s11, DiscreteYS.s22)
    plotter.plotYS('plot-window-2', ys);
    plotter.plotNormStress('plot-window-3', ys);
    plotter.plotLankford('plot-window-4', ys);
}