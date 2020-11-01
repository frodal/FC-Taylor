////////////////////////////////////////////////////////////////////////////////////
//                                     Material                                   //
////////////////////////////////////////////////////////////////////////////////////

class Material {
    constructor() {
        this.c11 = document.getElementById('c11');
        this.c12 = document.getElementById('c12');
        this.c44 = document.getElementById('c44');
        this.g0 = document.getElementById('g0');
        this.m = document.getElementById('m');
        this.tau0 = document.getElementById('tau0');
        this.hardeningModel = document.getElementById('hardeningModel');
        this.q = document.getElementById('q');
        this.VoceForm = document.getElementById('VoceParameters');
        this.theta1 = document.getElementById('theta1');
        this.tau1 = document.getElementById('tau1');
        this.theta2 = document.getElementById('theta2');
        this.tau2 = document.getElementById('tau2');
        this.KalidindiForm = document.getElementById('KalidindiParameters');
        this.h0 = document.getElementById('h0');
        this.taus = document.getElementById('taus');
        this.a = document.getElementById('a');

        // Change hardening model
        this.hardeningModel.addEventListener('change', (event) => {
            this.VoceForm.hidden = this.hardeningModel.selectedIndex !== 0;
            this.KalidindiForm.hidden = this.hardeningModel.selectedIndex !== 1;
        });
    }
}

// Exports
exports.Material = Material;