// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const {ipcRenderer} = require('electron');
const {execFile} = require('child_process');
var path = require('path');
const os = require('os');

const startProgramBtn = document.getElementById('StartProgramBtn');
const terminateProgramBtn = document.getElementById('TerminateProgramBtn');
const roller = document.getElementById('lds-roller');
const runMsg = document.getElementById('running');
const outArea = document.getElementById('OutputData');

let exePath = path.join(__dirname,'../../Core/FC-Taylor.exe');
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
const wcp = document.getElementById('wcp');
const npts = document.getElementById('npts');

const planeStress = document.getElementById('planeStress');
const centro = document.getElementById('centro');
const ncpu = document.getElementById('ncpu');

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
ipcRenderer.on('SelectedFile', (event, path)=>
{
    filePathArea.innerHTML = `${path.toString()}`;
    texFile = path.toString();
});

////////////////////////////////////////////////////////////////////////////////////
//                                Start Program                                   //
////////////////////////////////////////////////////////////////////////////////////
// Sets start program button callback
startProgramBtn.addEventListener('click', (event) => {
    if (subProcess !== null) // Check if a subprocess is already running
    {
        ipcRenderer.send('open-isRunning-dialog');
    } else {
        // Clear output data field
        outArea.innerHTML = '';
        // Sets the current working directory of the selected program to be its own directory
        options = { cwd: path.dirname(exePath) };
        // disable start button and enable terminate button when program is running
        startProgramBtn.disabled = true;
        terminateProgramBtn.disabled = false;
        roller.classList.add('lds-roller');
        runMsg.innerHTML = 'Running';
        try // Try to execute the program and sets a callback for when the program terminates
        {
            subProcess = execFile(exePath, exeCommandArgs, options, function (err, data) {
                if (err !== null && !subProcess.killed) {
                    ipcRenderer.send('open-errorEXE-dialog');
                } else if (killedDueToError) {
                    ipcRenderer.send('open-errorKilled-dialog')
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