// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const {ipcRenderer} = require('electron');
const {execFile} = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const Plotly = require('plotly.js-dist');
const csv = require('csv-parser');

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

const corePath = path.join(__dirname,'../../Core/FC-Taylor.exe');
const calibratePath = path.join(__dirname,'../../calibrate/dist/fc-taylor-calibrate/fc-taylor-calibrate.exe');
const workDir = path.join(__dirname,'../../../core-temp')
const exePath = path.join(workDir,'fc-taylor.exe');
const inputPath = path.join(workDir,'Input');
const outputPath = path.join(workDir,'Output');
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

// Material input
const c11 = document.getElementById('c11');
const c12 = document.getElementById('c12');
const c44 = document.getElementById('c44');

const g0 = document.getElementById('g0');
const m = document.getElementById('m');
const tau0 = document.getElementById('tau0');

const hardeningModel = document.getElementById('hardeningModel');
const q = document.getElementById('q');

const VoceForm = document.getElementById('VoceParameters');
const theta1 = document.getElementById('theta1');
const tau1 = document.getElementById('tau1');
const theta2 = document.getElementById('theta2');
const tau2 = document.getElementById('tau2');

const KalidindiForm = document.getElementById('KalidindiParameters');
const h0 = document.getElementById('h0');
const taus = document.getElementById('taus');
const a = document.getElementById('a');

// Other input
const epsdot = document.getElementById('epsdot');
const wpc = document.getElementById('wpc');
const npts = document.getElementById('npts');

const planeStress = document.getElementById('planeStress');
const centro = document.getElementById('centrosymmetry');
const ncpu = document.getElementById('ncpu');

////////////////////////////////////////////////////////////////////////////////////
//                                  Save input                                    //
////////////////////////////////////////////////////////////////////////////////////
function SetupWorkingDir()
{
    if(!fs.existsSync(workDir))
    {
        fs.mkdirSync(workDir);
    }
    if(!fs.existsSync(inputPath))
    {
        fs.mkdirSync(inputPath);
    }
    if(!fs.existsSync(outputPath))
    {
        fs.mkdirSync(outputPath);
    }
    if(!fs.existsSync(exePath) && fs.existsSync(corePath))
    {
        fs.copyFileSync(corePath,exePath);
    }
}
function SaveInput()
{
    let data = '';
    if(hardeningModel.selectedIndex===0)
    {
        data = `*PROPS
${c11.value}, ${c12.value}, ${c44.value}, ${g0.value}, ${m.value}, ${tau0.value}, ${q.value}, ${hardeningModel.selectedIndex+1}, ${theta1.value}, ${tau1.value}, ${theta2.value}, ${tau2.value}
*DEF
${planeStress.checked ? 1 : 0}, ${centro.checked ? 1 : 0}, ${npts.value}, ${epsdot.value}, ${wpc.value}, ${ncpu.selectedIndex+1}`;
    }else
    {
        data = `*PROPS
${c11.value}, ${c12.value}, ${c44.value}, ${g0.value}, ${m.value}, ${tau0.value}, ${q.value}, ${hardeningModel.selectedIndex+1}, ${h0.value}, ${taus.value}, ${a.value}, 0.0
*DEF
${planeStress.checked ? 1 : 0}, ${centro.checked ? 1 : 0}, ${npts.value}, ${epsdot.value}, ${wpc.value}, ${ncpu.selectedIndex+1}`;
    }
    fs.writeFileSync(path.join(inputPath,'Taylor.inp'),data);
    fs.copyFileSync(texFile,path.join(inputPath,'Euler.inp'));
}
// Check the input from the user
function SafeInput()
{
    if(hardeningModel.selectedIndex===0)
    {
        return isPositiveNumber(c11.value)     && isPositiveNumber(c12.value) 
            && isPositiveNumber(c44.value)     && isPositiveNumber(g0.value) 
            && isPositiveNumber(m.value)       && isPositiveNumber(tau0.value) 
            && isPositiveNumber(q.value)       && isNonNegativeNumber(theta1.value) 
            && isNonNegativeNumber(tau1.value) && isNonNegativeNumber(theta2.value) 
            && isNonNegativeNumber(tau2.value) && (isNumber(npts.value) && parseFloat(npts.value)>=2)
            && isPositiveNumber(epsdot.value)  && isPositiveNumber(wpc.value);
    }else
    {
        return isPositiveNumber(c11.value)    && isPositiveNumber(c12.value) 
            && isPositiveNumber(c44.value)    && isPositiveNumber(g0.value) 
            && isPositiveNumber(m.value)      && isPositiveNumber(tau0.value) 
            && isPositiveNumber(q.value)      && isNonNegativeNumber(h0.value) 
            && isPositiveNumber(taus.value)   && isPositiveNumber(a.value) 
            && (isNumber(npts.value)          && parseFloat(npts.value)>=2) 
            && isPositiveNumber(epsdot.value) && isPositiveNumber(wpc.value);
    }
}
function isPositiveNumber(num)
{
    return isNumber(num) && parseFloat(num)>0;
}
function isNonNegativeNumber(num)
{
    return isNumber(num) && parseFloat(num)>=0;
}
function isNumber(num)
{
    return !isNaN(parseFloat(num)) && isFinite(num);
}

////////////////////////////////////////////////////////////////////////////////////
//                            Handle multi-threading                              //
////////////////////////////////////////////////////////////////////////////////////
// Set up options to select the number of cores to use
for(let i = 1; i < os.cpus().length; i++)
{
    var option = document.createElement('option');
    option.text = (i+1).toString();
    ncpu.add(option);
}

////////////////////////////////////////////////////////////////////////////////////
//                            Change hardening model                              //
////////////////////////////////////////////////////////////////////////////////////
hardeningModel.addEventListener('change', (event)=>
{
    VoceForm.hidden = hardeningModel.selectedIndex !== 0;
    KalidindiForm.hidden = hardeningModel.selectedIndex !== 1;
});

////////////////////////////////////////////////////////////////////////////////////
//                                 Select File                                    //
////////////////////////////////////////////////////////////////////////////////////
// Sets select program button callback
selectFileBtn.addEventListener('click', (event)=>
{
    ipcRenderer.send('open-file-dialog');
});
// Sets the executable filepath received from the main process (main.js)
ipcRenderer.on('SelectedFile', (event, newPath)=>
{
    if(newPath.toString()!=='')
    {
        SetupWorkingDir();
        texFile = newPath.toString();
        filePathArea.innerHTML = `${texFile}`;
        startProgramBtn.disabled = false;
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
    if(SafeInput()){
        // Clear output data field
        outArea.innerHTML = '';
        // Sets the current working directory of the selected program to be its own directory
        let options = { cwd: path.dirname(exePath) };
        // disable start button when program is running
        startProgramBtn.disabled = true;
        // Saving input from user to file
        SaveInput();
        // Enable terminate button when program is running
        terminateProgramBtn.disabled = false;
        roller.classList.add('lds-roller');
        runMsg.innerHTML = 'Running';
        try // Try to execute the program and sets a callback for when the program terminates
        {
            subProcess = execFile(exePath, exeCommandArgs, options, function (err, data) {
                if (err !== null && !(subProcess.killed || killedDueToError)) {
                    ipcRenderer.send('open-error-dialog');
                } else if (killedDueToError) {
                    ipcRenderer.send('open-errorKilled-dialog',parseInt(err.toString().split('Error code:')[1]));
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
    }else
    {
        ipcRenderer.send('check-input-dialog');
    }
});

////////////////////////////////////////////////////////////////////////////////////
//                               Terminate Program                                //
////////////////////////////////////////////////////////////////////////////////////
// Sets terminate program button callback
terminateProgramBtn.addEventListener('click', (event)=>
{
    if(subProcess!==null)
    {
        subProcess.kill();
    }else
    {
        ipcRenderer.send('open-successfulTermination-dialog');
    }
});

////////////////////////////////////////////////////////////////////////////////////
//                                 Save results                                   //
////////////////////////////////////////////////////////////////////////////////////
saveResultBtn.addEventListener('click', (event) =>
{
    ipcRenderer.send('save-file-dialog');
});
ipcRenderer.on('SaveFile', (event, savePath)=>
{
    if(savePath.toString()!=='')
    {
        fs.copyFileSync(path.join(outputPath,'output.txt'),savePath.toString());
    }
});
function UpdateEnableSaveAndCalibrate()
{
    let isDisabled = !fs.existsSync(path.join(outputPath,'output.txt'));
    saveResultBtn.disabled = isDisabled
    calibrateYsBtn.disabled = isDisabled
    saveCalibrationBtn.disabled = true;
}
function DeleteOutput()
{
    let tempFilePath = path.join(outputPath,'output.txt');
    if(fs.existsSync(tempFilePath))
        fs.unlinkSync(tempFilePath);
}
////////////////////////////////////////////////////////////////////////////////////
//                                   On close                                     //
////////////////////////////////////////////////////////////////////////////////////
ipcRenderer.send('core-temp', workDir)
////////////////////////////////////////////////////////////////////////////////////
//                           Calibrate yield surface                              //
////////////////////////////////////////////////////////////////////////////////////
calibrateYsBtn.addEventListener('click',(event)=>
{
    let outfilePath = path.join(outputPath, 'output.txt');
    // Sets the current working directory of the selected program to be its own directory
    let options = { cwd: path.dirname(outfilePath) };
    // disable start button when program is running
    startProgramBtn.disabled = true;
    calibrateYsBtn.disabled = true;
    saveCalibrationBtn.disabled = true;
    // Show calibrating roller
    calibRoller.classList.add('lds-roller');
    calibMsg.innerHTML = 'Calibrating';
    try // Try to execute the program and sets a callback for when the program terminates
    {
        execFile(calibratePath, [outfilePath,'--space','2D'], options, function (err, data) {
            startProgramBtn.disabled = false;
            calibrateYsBtn.disabled = false;
            if(err)
            {
                saveCalibrationBtn.disabled = true;
            }else{
                saveCalibrationBtn.disabled = false;
                ipcRenderer.send('open-successfulCalibration-dialog');
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
saveCalibrationBtn.addEventListener('click', (event) =>
{
    ipcRenderer.send('save-calibration-dialog');
});
ipcRenderer.on('SaveCalibration', (event, savePath)=>
{
    if(savePath.toString()!=='')
    {
        fs.copyFileSync(path.join(outputPath,'CalibratedParameters.dat'),savePath.toString());
    }
});
////////////////////////////////////////////////////////////////////////////////////
//                                   Plotting                                     //
////////////////////////////////////////////////////////////////////////////////////
const plotBtn = document.getElementById('PlotBtn');
plotBtn.addEventListener('click',()=>
{
    loadDiscreteYS();
});

function plotScatter(target,x,y)
{
    const layout =
    {
        margin: {
            t: 50,
            l: 50,
            b: 50,
            r: 50
        },
        height: 400,
        width: 400,
        xaxis: {
            title: 'RD',
            range: [-1.5, 1.5],
            dtick: 0.5,
            showgrid: true,
            zeroline: false
        },
        yaxis: {
            title: 'TD',
            range: [-1.5, 1.5],
            dtick: 0.5,
            showgrid: true,
            zeroline: false
        },
        hovermode: 'closest'
    };
    const trace =
    {
        x: x,
        y: y,
        mode: 'markers',
        name: 'points',
        marker: {
            color: 'rgb(0,0,0)',
            size: 5
        },
        type: 'scatter'
    };
    const data = [trace];
    const config = {
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d', 'hoverCompareCartesian', 'hoverClosestCartesian'],
        toImageButtonOptions: {
            format: 'svg', // one of png, svg, jpeg, webp
            filename: 'FC-Taylor-plot',
            height: 500,
            width: 500,
            scale: 1 // Multiply title/legend/axis/canvas sizes by this factor
        }
    };
    
    Plotly.react(target, data, layout, config);
}

function loadDiscreteYS()
{
    let s11 = [], s22 = [], s33 = [], s12 = [], s23 = [], s31 = [], s0 = 201.2055;
    // TODO: find s0 from data
    fs.createReadStream(path.join(outputPath, 'output.txt'))
        .pipe(csv())
        .on('data', (data) => {
            s11.push(data[" S11"]/s0);
            s22.push(data[" S22"]/s0);
            // s33.push(data[" S33"]);
            s12.push(data[" S12"]/s0);
            // s23.push(data[" S23"]);
            // s31.push(data[" S31"]);
        })
        .on('end', () => {
            plotScatter('plot-window-1',s11,s22)
    });
}

function yieldfunction(sx,sy,sz,sxy,syz,sxz,c)
{
    // YLD2004-18p yield surface f=(phi/4)^(1/m)-sigma_y

    // Deviatoric stress
    let x = sx - (sx + sy + sz) / 3;
    let y = sy - (sx + sy + sz) / 3;
    let z = sz - (sx + sy + sz) / 3;

    // Stress tensor quantities of s'
    let x1 = -c[0] * y - c[1] * z;
    let y1 = -c[2] * x - c[3] * z;
    let z1 = -c[4] * x - c[5] * y;
    let xy1 = c[6] * sxy;
    let yz1 = c[7] * syz;
    let xz1 = c[8] * sxz;

    // Stress tensor quantities of s''
    let x2 = -c[9] * y - c[10] * z;
    let y2 = -c[11] * x - c[12] * z;
    let z2 = -c[13] * x - c[14] * y;
    let xy2 = c[15] * sxy;
    let yz2 = c[16] * syz;
    let xz2 = c[17] * sxz;

    // Calculate eigenvalues of s' and s''
    let s1 = eig([x1, xy1, xz1; xy1, y1, yz1; xz1, yz1, z1]);
    let s2 = eig([x2, xy2, xz2; xy2, y2, yz2; xz2, yz2, z2]);

    // Calculate phi
    let phi = 0;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            phi += abs(s1(i) - s2(j)).^ c[18];
        }
    }

    // Evaluate f
    f = (phi / 4).^ (1. / c[18]) - 1;
}