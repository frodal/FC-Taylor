////////////////////////////////////////////////////////////////////////////////////
//                               FC-Taylor properties                             //
////////////////////////////////////////////////////////////////////////////////////

const os = require('os');
const fs = require('fs');

const utils = require('./Utils');

class FCTaylorProperties {


    constructor() {
        const mat = require('./Material');
        this.material = new mat.Material();
        this.epsdot = document.getElementById('epsdot');
        this.wpc = document.getElementById('wpc');
        this.npts = document.getElementById('npts');
        this.planeStress = document.getElementById('planeStress');
        this.centro = document.getElementById('centrosymmetry');
        this.ncpu = document.getElementById('ncpu');
        this.nStressPoints = document.getElementById('nStressPoints');

        this.YSexponentContainer = document.getElementById('YSexponentContainer');
        this.YSexponent = document.getElementById('YSexponent');
        this.YSexponentOption = document.getElementById('YSexponentOption');

        // Handle multi-threading
        // Set up options to select the number of cores to use
        for (let i = 1; i < os.cpus().length; ++i) {
            var option = document.createElement('option');
            option.text = (i + 1).toString();
            option.selected = true;
            this.ncpu.add(option);
        }
        this.ncpu.selectedIndex = Math.max((os.cpus().length - 1) - 2, 0);

        this.planeStress.addEventListener('change', (event) => {
            this.UpdateNstressPoints();
        });
        this.centro.addEventListener('change', (event) => {
            this.UpdateNstressPoints();
        });
        this.npts.addEventListener('change', (event) => {
            this.UpdateNstressPoints();
        });
        this.npts.addEventListener('input', (event) => {
            this.UpdateNstressPoints();
        });

        this.YSexponentOption.addEventListener('change', (event) => {
            if (this.YSexponentOption.selectedIndex == 0) {
                this.YSexponentContainer.style.display = 'block';
            } else {
                this.YSexponentContainer.style.display = 'none';
            }
        });
    }


    ////////////////////////////////////////////////////////////////////////////////////
    //                      Number of generated stress points                         //
    ////////////////////////////////////////////////////////////////////////////////////
    UpdateNstressPoints() {
        let UTstresspoints = this.centro.checked ? 2 : 1;
        if (this.planeStress.checked && (utils.isNumber(this.npts.value) && parseInt(this.npts.value) >= 2)) {
            let NptsTemp = parseInt(this.npts.value);
            let Nsigma = 6 * Math.pow(NptsTemp - 2, 2) + 12 * (NptsTemp - 2) + 8;
            this.nStressPoints.innerHTML = `${Nsigma + UTstresspoints}`;
        } else if (utils.isNumber(this.npts.value) && parseInt(this.npts.value) >= 2) {
            let NptsTemp = parseInt(this.npts.value);
            let Nsigma = 10 * Math.pow(NptsTemp - 2, 4) + 40 * Math.pow(NptsTemp - 2, 3) + 80 * Math.pow(NptsTemp - 2, 2) + 80 * (NptsTemp - 2) + 32;
            this.nStressPoints.innerHTML = `${Nsigma + UTstresspoints}`;
        } else {
            this.nStressPoints.innerHTML = "0";
        }
    }


    parseTaylorFile(data) {
        const lines = data.split('\n');
        let readProps = false;
        let readDef = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const items = line.split(',');
            if (readProps && items.length === 12 && !line.startsWith('**')) {
                this.material.c11.value = utils.isNumber(items[0]) ? parseFloat(items[0]) : items[0];
                this.material.c12.value = utils.isNumber(items[1]) ? parseFloat(items[1]) : items[1];
                this.material.c44.value = utils.isNumber(items[2]) ? parseFloat(items[2]) : items[2];
                this.material.g0.value = utils.isNumber(items[3]) ? parseFloat(items[3]) : items[3];
                this.material.m.value = utils.isNumber(items[4]) ? parseFloat(items[4]) : items[4];
                this.material.tau0.value = utils.isNumber(items[5]) ? parseFloat(items[5]) : items[5];
                this.material.q.value = utils.isNumber(items[6]) ? parseFloat(items[6]) : items[6];
                this.material.hardeningModel.selectedIndex = utils.isNumber(items[7]) ? (parseInt(items[7]) === 1 || parseInt(items[7]) === 2 ? parseInt(items[7]) - 1 : 0) : 0;
                this.material.VoceForm.hidden = this.material.hardeningModel.selectedIndex !== 0;
                this.material.KalidindiForm.hidden = this.material.hardeningModel.selectedIndex !== 1;
                if (this.material.hardeningModel.selectedIndex === 0) {
                    this.material.theta1.value = utils.isNumber(items[8]) ? parseFloat(items[8]) : items[8];
                    this.material.tau1.value = utils.isNumber(items[9]) ? parseFloat(items[9]) : items[9];
                    this.material.theta2.value = utils.isNumber(items[10]) ? parseFloat(items[10]) : items[10];
                    this.material.tau2.value = utils.isNumber(items[11]) ? parseFloat(items[11]) : items[11];
                }
                else {
                    this.material.h0.value = utils.isNumber(items[8]) ? parseFloat(items[8]) : items[8];
                    this.material.taus.value = utils.isNumber(items[9]) ? parseFloat(items[9]) : items[9];
                    this.material.a.value = utils.isNumber(items[10]) ? parseFloat(items[10]) : items[10];
                }
                readProps = false;
            }
            else if (readDef && items.length === 6 && !line.startsWith('**')) {
                this.planeStress.checked = utils.isNumber(items[0]) ? parseInt(items[0]) === 1 : this.planeStress.checked;
                this.centro.checked = utils.isNumber(items[1]) ? parseInt(items[1]) === 1 : this.centro.checked;
                this.npts.value = utils.isNumber(items[2]) ? parseFloat(items[2]) : items[2];
                this.epsdot.value = utils.isNumber(items[3]) ? parseFloat(items[3]) : items[3];
                this.wpc.value = utils.isNumber(items[4]) ? parseFloat(items[4]) : items[4];
                this.ncpu.selectedIndex = utils.isNumber(items[5]) ? (parseInt(items[5]) > 0 && parseInt(items[5]) <= os.cpus().length ? parseInt(items[5]) - 1 : os.cpus().length - 1) : os.cpus().length - 1;
                this.UpdateNstressPoints();
                readDef = false;
            }
            if (line.toUpperCase().startsWith('*PROPS')) {
                readProps = true;
                readDef = false;
            }
            else if (line.toUpperCase().startsWith('*DEF')) {
                readProps = false;
                readDef = true;
            }
            else if (!line.startsWith('**')) {
                readProps = false;
                readDef = false;
            }
        }
    }


    ExportTaylor(exportPath) {
        let data = '';
        if (hardeningModel.selectedIndex === 0) {
            data = `*PROPS
${this.material.c11.value}, ${this.material.c12.value}, ${this.material.c44.value}, ${this.material.g0.value}, ${this.material.m.value}, ${this.material.tau0.value}, ${this.material.q.value}, ${this.material.hardeningModel.selectedIndex + 1}, ${this.material.theta1.value}, ${this.material.tau1.value}, ${this.material.theta2.value}, ${this.material.tau2.value}
*DEF
${this.planeStress.checked ? 1 : 0}, ${this.centro.checked ? 1 : 0}, ${parseInt(this.npts.value)}, ${this.epsdot.value}, ${this.wpc.value}, ${this.ncpu.selectedIndex + 1}`;
        } else {
            data = `*PROPS
${this.material.c11.value}, ${this.material.c12.value}, ${this.material.c44.value}, ${this.material.g0.value}, ${this.material.m.value}, ${this.material.tau0.value}, ${this.material.q.value}, ${this.material.hardeningModel.selectedIndex + 1}, ${this.material.h0.value}, ${this.material.taus.value}, ${this.material.a.value}, 0.0
*DEF
${this.planeStress.checked ? 1 : 0}, ${this.centro.checked ? 1 : 0}, ${parseInt(this.npts.value)}, ${this.epsdot.value}, ${this.wpc.value}, ${this.ncpu.selectedIndex + 1}`;
        }
        fs.writeFileSync(exportPath, data);
    }


    SaveInput(inputPath, texFile) {
        const path = require('path');
        this.ExportTaylor(path.join(inputPath, 'Taylor.inp'));
        fs.copyFileSync(texFile, path.join(inputPath, 'Euler.inp'));
    }

    // Check the input from the user
    SafeInput() {
        if (this.material.hardeningModel.selectedIndex === 0) {
            return utils.isPositiveNumber(this.material.c11.value) && utils.isPositiveNumber(this.material.c12.value)
                && utils.isPositiveNumber(this.material.c44.value) && utils.isPositiveNumber(this.material.g0.value)
                && utils.isPositiveNumber(this.material.m.value) && utils.isPositiveNumber(this.material.tau0.value)
                && utils.isPositiveNumber(this.material.q.value) && utils.isNonNegativeNumber(this.material.theta1.value)
                && utils.isNonNegativeNumber(this.material.tau1.value) && utils.isNonNegativeNumber(this.material.theta2.value)
                && utils.isNonNegativeNumber(this.material.tau2.value) && (utils.isNumber(this.npts.value) && parseInt(this.npts.value) >= 2)
                && utils.isPositiveNumber(this.epsdot.value) && utils.isPositiveNumber(this.wpc.value);
        } else {
            return utils.isPositiveNumber(this.material.c11.value) && utils.isPositiveNumber(this.material.c12.value)
                && utils.isPositiveNumber(this.material.c44.value) && utils.isPositiveNumber(this.material.g0.value)
                && utils.isPositiveNumber(this.material.m.value) && utils.isPositiveNumber(this.material.tau0.value)
                && utils.isPositiveNumber(this.material.q.value) && utils.isNonNegativeNumber(this.material.h0.value)
                && utils.isPositiveNumber(this.material.taus.value) && utils.isPositiveNumber(this.material.a.value)
                && (utils.isNumber(this.npts.value) && parseInt(this.npts.value) >= 2)
                && utils.isPositiveNumber(this.epsdot.value) && utils.isPositiveNumber(this.wpc.value);
        }
    }

    // Check if the exponent from the user is greater or equal to 2
    SafeExponent() {
        return utils.isNumber(this.YSexponent.value) && parseFloat(this.YSexponent.value) >= 2;
    }
}

// Exports
exports.FCTaylorProperties = FCTaylorProperties;