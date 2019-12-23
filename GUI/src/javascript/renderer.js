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
const matrix = require('ml-matrix');

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
for(let i = 1; i < os.cpus().length; ++i)
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
    loadDiscreteYS();
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
                loadCalibratedYSparams();
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
async function plotScatter(target,x,y)
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
        showlegend: false,
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
    await setImmediatePromise();
    Plotly.react(target, data, layout, config);
}

async function plotYS(target,x,y,sxy,sxyMax)
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
        showlegend: false,
        hovermode: 'closest'
    };
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
    let data = [];
    for(let k = 0; k < x.length; ++k)
    {
        const trace =
        {
            x: x[k],
            y: y[k],
            mode: 'lines',
            name: `Sxy = ${sxy[k]}`,
            line: {
                color: 'rgb(0,0,0)',
            },
            type: 'scatter'
        };
        data.push(trace);
    }
    
    Plotly.react(target, data, layout, config);
}

async function plotLankford(target,angle,Rvalue)
{
    let max = Rvalue.reduce(function(a, b) {
        return Math.max(a, b);
    });
    let offset = 0.2;
    let dy = FindDelta(((1+offset)*max-0)/6);

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
            title: 'Tensile direction',
            range: [0, 90],
            dtick: 15,
            showgrid: true,
            zeroline: false
        },
        yaxis: {
            title: 'Lankford coefficient',
            range: [0, (1+offset)*max],
            dtick: dy,
            showgrid: true,
            zeroline: false
        },
        showlegend: false,
        hovermode: 'closest'
    };
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
    const trace =
    {
        x: angle,
        y: Rvalue,
        mode: 'lines',
        name: 'Lankford coefficient',
        line: {
            color: 'rgb(0,0,0)',
        },
        type: 'scatter'
    };
    const data = [trace];
    Plotly.react(target, data, layout, config);
}

function FindDelta(value)
{
    if(Math.floor(value)==0)
    {
        return 0.1*FindDelta(value*10);
    }
    return Math.floor(value)
}

async function plotNormStress(target,angle,normStress)
{
    let max = normStress.reduce(function(a, b) {
        return Math.max(a, b);
    });
    let min = normStress.reduce(function(a, b) {
        return Math.min(a, b);
    });
    let offset = 0.2;
    let dy = FindDelta(((1+offset)*max-(1-offset)*min)/6);
    
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
            title: 'Tensile direction',
            range: [0, 90],
            dtick: 15,
            showgrid: true,
            zeroline: false
        },
        yaxis: {
            title: 'Normalized yield stress',
            range: [(1-offset)*min, (1+offset)*max],
            dtick: dy,
            showgrid: true,
            zeroline: false
        },
        showlegend: false,
        hovermode: 'closest'
    };
    
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
    const trace =
    {
        x: angle,
        y: normStress,
        mode: 'lines',
        name: `Normalized yield stress`,
        line: {
            color: 'rgb(0,0,0)',
        },
        type: 'scatter'
    };
    const data = [trace];
    
    Plotly.react(target, data, layout, config);
}

async function CalcRandR(angle,c)
{
    let normStress = new Array(angle.length);
    let Rvalue = new Array(angle.length);
    
    for(let k = 0; k < angle.length; ++k)
    {
        let ang = angle[k]*Math.PI/180.0;
        // Normalized yield stress
        normStress[k] = Phi(Math.pow(Math.cos(ang),2)-1/3, Math.pow(Math.sin(ang),2)-1/3, -1/3, Math.sin(ang)*Math.cos(ang),0,0,c);
        // Lankford coefficient
        let dfds = yieldgradient(normStress[k]*(Math.pow(Math.cos(ang),2)), normStress[k]*(Math.pow(Math.sin(ang),2)),0,normStress[k]*(Math.sin(ang)*Math.cos(ang)),0,0,c);
        let Q = new matrix.Matrix([[Math.cos(ang),-Math.sin(ang),0], [Math.sin(ang),Math.cos(ang),0], [0,0,1]]);
        let df = Q.transpose().mmul(dfds.mmul(Q));
        Rvalue[k] = df.data[1][1]/df.data[2][2];

        if( k % 10 === 0)
            await setImmediatePromise();
    }

    return [normStress, Rvalue];
}

async function plotRandR(target1,target2,c)
{
    let angle = linspace(0,90,1001);
    let [normStress, Rvalue] = await CalcRandR(angle,c);
    plotNormStress(target1,angle,normStress);
    plotLankford(target2,angle,Rvalue);
}

async function plotContour(target,c)
{
    // find max shear stress
    let sxyMax = findMaxShear(c);
    // will create contours at these levels of shear stress
    let sxy = [];
    for(let i = 0; i < sxyMax; i+=0.1)
    {
        sxy.push(i);
    }
    // Setting up variables
    let l = linspace(0,2*Math.PI,360);

    let x = new Array(sxy.length), z = new Array(sxy.length);
    for(let k = 0; k < sxy.length; ++k)
    {
        x[k] = new Array(l.length);
        z[k] = new Array(l.length);
    }

    await setImmediatePromise();

    // finding the yieldsurface, f = 0
    for(let k = 0; k < sxy.length; ++k)
    {
        for(let i = 0; i < l.length; ++i)
        {
            let s = domainReduce(0, 2, 10, l[i], sxy[k], c)
            x[k][i] = s*Math.cos([l[i]]);
            z[k][i] = s*Math.sin([l[i]]);

            if( i % 10 === 0)
                await setImmediatePromise()
        }
    }

    plotYS('plot-window-2',x,z,sxy,sxyMax);
}

function domainReduce(min, max, N, lode, sxy, c)
{
    let s = linspace(min,max,N);
    let temp1 = 1000, temp2 = 1000;
    for (let j = 0; j < s.length; ++j) 
    {
        temp2 = Math.abs(yieldfunction(s[j] * Math.cos(lode), s[j] * Math.sin(lode), 0, sxy, 0, 0, c));
        if (temp2 < temp1) 
        {
            n = j;
            temp1 = temp2;
        }
    }

    if(temp1<1e-4)
    {
        return s[n];
    }
    
    return domainReduce(s[n]-(s[2]-s[1]), s[n]+(s[2]-s[1]), N, lode, sxy, c)
}

function findMaxShear(c)
{
    // find maks shear stress
    let sxy = linspace(0.3,1.1,1000);
    let temp1 = 1000;
    let temp2 = 1000;
    let n = 0;
    for(let i = 0; i < 1000; ++i)
    {
        temp2 = Math.abs(yieldfunction(0,0,0,sxy[i],0,0,c));
        if(temp2 < temp1)
        {
            n = i;
            temp1 = temp2;
        }
    }
    return sxy[n];
}

function linspace(startValue, endValue, cardinality)
{
    var arr = new Array(cardinality);
    var step = (endValue - startValue) / (cardinality - 1);
    for (var i = 0; i < cardinality; ++i) 
    {
        arr[i] = startValue + (step * i);
    }
    return arr;
}

function loadDiscreteYS()
{
    let filePath = path.join(outputPath, 'output.txt')
    if (fs.existsSync(filePath)) 
    {
        let s11 = [], s22 = [], s33 = [], s12 = [], s23 = [], s31 = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                s11.push(data[" S11"]);
                s22.push(data[" S22"]);
                s33.push(data[" S33"]);
                s12.push(data[" S12"]);
                s23.push(data[" S23"]);
                s31.push(data[" S31"]);
            })
            .on('end', () => {
                [s11, s22, s33, s12, s23, s31] = Normalize(s11, s22, s33, s12, s23, s31);
                plotScatter('plot-window-1', s11, s22);
            });
    }
}

function Normalize(s11, s22, s33, s12, s23, s31)
{
    // Normalizing the yield stress based on s11=1 at s22=0, s33=0
    let k = 0;
    let er = Infinity;
    for (let i = 0; i < s11.length; ++i)
    {
        let temp = Math.pow(s22[i], 2) + Math.pow(s33[i], 2) + 2 * Math.pow(s12[i], 2) + 2 * Math.pow(s23[i], 2) + 2 * Math.pow(s31[i], 2);
        if (temp < er)
        {
            k = i;
            er = temp;
        }
    }
    let s0 = Math.sqrt(0.5*Math.pow(s11[k]-s22[k],2)+0.5*Math.pow(s22[k]-s33[k],2)+0.5*Math.pow(s33[k]-s11[k],2)+3*Math.pow(s12[k],2)+3*Math.pow(s23[k],2)+3*Math.pow(s31[k],2));
    for (let i = 0; i < s11.length; ++i) 
    {
        s11[i] /= s0;
        s22[i] /= s0;
        s33[i] /= s0;
        s12[i] /= s0;
        s23[i] /= s0;
        s31[i] /= s0;
    }
    return [s11, s22, s33, s12, s23, s31];
}

async function loadCalibratedYSparams()
{
    let paramPath = path.join(outputPath, 'CalibratedParameters.dat')
    if (fs.existsSync(paramPath)) 
    {
        let c = [];
        fs.createReadStream(paramPath)
            .pipe(csv())
            .on('data', (data) => {
                c.push(parseFloat(data['parameters']));
            })
            .on('end', () => {
                plotRandR('plot-window-3', 'plot-window-4', c);
                plotContour('plot-window-2', c);
            });
    }
}

function yieldfunction(sx,sy,sz,sxy,syz,sxz,c)
{
    // YLD2004-18p yield surface f=(phi/4)^(1/m)-sigma_y

    // Deviatoric stress
    let x = sx - (sx + sy + sz) / 3.0;
    let y = sy - (sx + sy + sz) / 3.0;
    let z = sz - (sx + sy + sz) / 3.0;

    let phi = calcPhi(x,y,z,sxy,syz,sxz,c)

    // Evaluate f
    return Math.pow((phi / 4.0), (1.0 / c[18])) - 1.0;
}

function calcPhi(x,y,z,sxy,syz,sxz,c)
{
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
    let A = new matrix.Matrix([[x1, xy1, xz1], [xy1, y1, yz1], [xz1, yz1, z1]]);
    let B = new matrix.Matrix([[x2, xy2, xz2], [xy2, y2, yz2], [xz2, yz2, z2]]);
    let eigA = new matrix.EigenvalueDecomposition(A);
    let eigB = new matrix.EigenvalueDecomposition(B);
    let s1 = eigA.realEigenvalues;
    let s2 = eigB.realEigenvalues;

    // Calculate phi
    let phi = 0.0;
    for (let i = 0; i < 3; ++i) {
        for (let j = 0; j < 3; ++j) {
            phi += Math.pow(Math.abs(s1[i] - s2[j]), c[18]);
        }
    }
    return phi;
}

function Phi(x,y,z,sxy,syz,sxz,c)
{
    let phi = calcPhi(x,y,z,sxy,syz,sxz,c)

    return 1.0/(Math.pow(phi/4.0, 1.0/c[18]));
}

function yieldgradient(sx,sy,sz,sxy,syz,sxz,c)
{
    let h=1e-5;
    
    let dfds11=(yieldfunction(sx+h,sy,sz,sxy,syz,sxz,c)-yieldfunction(sx-h,sy,sz,sxy,syz,sxz,c))/(2*h);
    let dfds22=(yieldfunction(sx,sy+h,sz,sxy,syz,sxz,c)-yieldfunction(sx,sy-h,sz,sxy,syz,sxz,c))/(2*h);
    let dfds33=(yieldfunction(sx,sy,sz+h,sxy,syz,sxz,c)-yieldfunction(sx,sy,sz-h,sxy,syz,sxz,c))/(2*h);
    let dfds12=(yieldfunction(sx,sy,sz,sxy+0.5*h,syz,sxz,c)-yieldfunction(sx,sy,sz,sxy-0.5*h,syz,sxz,c))/(2*h);
    let dfds23=(yieldfunction(sx,sy,sz,sxy,syz+0.5*h,sxz,c)-yieldfunction(sx,sy,sz,sxy,syz-0.5*h,sxz,c))/(2*h);
    let dfds31=(yieldfunction(sx,sy,sz,sxy,syz,sxz+0.5*h,c)-yieldfunction(sx,sy,sz,sxy,syz,sxz-0.5*h,c))/(2*h);
    
    return new matrix.Matrix([[dfds11,dfds12,dfds31], [dfds12,dfds22,dfds23], [dfds31,dfds23,dfds33]]);

}

// Function to call so that the event loop is not blocked, i.e., cycle the event loop
function setImmediatePromise() {
    return new Promise((resolve) => {
        setImmediate(() => resolve());
    });
}