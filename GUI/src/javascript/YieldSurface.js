////////////////////////////////////////////////////////////////////////////////////
//                                 Yield Surface                                  //
////////////////////////////////////////////////////////////////////////////////////

const matrix = require('ml-matrix');

const { linspace, setImmediatePromise } = require('./Utils');

class YieldSurface {

    constructor() {
        this.Clear();
    }

    Clear() {
        this.c = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 8];
        this.normStress = [];
        this.Rvalue = [];
        this.angle = [];
        this.s11Contour = [];
        this.s22Contour = [];
        this.s12Contour = [];
        this.s12Max = 0;
    }

    async Update(c = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 8]) {
        this.c = c;
        await this.CalcRandR();
        await this.CalcContour();
    }

    yieldfunction(sx, sy, sz, sxy, syz, sxz) {
        // YLD2004-18p yield surface f=(phi/4)^(1/m)-sigma_y

        // Deviatoric stress
        let x = sx - (sx + sy + sz) / 3.0;
        let y = sy - (sx + sy + sz) / 3.0;
        let z = sz - (sx + sy + sz) / 3.0;

        let phi = this.calcPhi(x, y, z, sxy, syz, sxz)

        // Evaluate f
        return Math.pow((phi / 4.0), (1.0 / this.c[18])) - 1.0;
    }

    calcPhi(x, y, z, sxy, syz, sxz) {
        // Stress tensor quantities of s'
        let x1 = -this.c[0] * y - this.c[1] * z;
        let y1 = -this.c[2] * x - this.c[3] * z;
        let z1 = -this.c[4] * x - this.c[5] * y;
        let xy1 = this.c[6] * sxy;
        let yz1 = this.c[7] * syz;
        let xz1 = this.c[8] * sxz;

        // Stress tensor quantities of s''
        let x2 = -this.c[9] * y - this.c[10] * z;
        let y2 = -this.c[11] * x - this.c[12] * z;
        let z2 = -this.c[13] * x - this.c[14] * y;
        let xy2 = this.c[15] * sxy;
        let yz2 = this.c[16] * syz;
        let xz2 = this.c[17] * sxz;

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
                phi += Math.pow(Math.abs(s1[i] - s2[j]), this.c[18]);
            }
        }
        return phi;
    }

    Phi(x, y, z, sxy, syz, sxz) {
        let phi = this.calcPhi(x, y, z, sxy, syz, sxz)

        return 1.0 / (Math.pow(phi / 4.0, 1.0 / this.c[18]));
    }

    yieldgradient(sx, sy, sz, sxy, syz, sxz) {
        let h = 1e-5;

        let dfds11 = (this.yieldfunction(sx + h, sy, sz, sxy, syz, sxz) - this.yieldfunction(sx - h, sy, sz, sxy, syz, sxz)) / (2 * h);
        let dfds22 = (this.yieldfunction(sx, sy + h, sz, sxy, syz, sxz) - this.yieldfunction(sx, sy - h, sz, sxy, syz, sxz)) / (2 * h);
        let dfds33 = (this.yieldfunction(sx, sy, sz + h, sxy, syz, sxz) - this.yieldfunction(sx, sy, sz - h, sxy, syz, sxz)) / (2 * h);
        let dfds12 = (this.yieldfunction(sx, sy, sz, sxy + 0.5 * h, syz, sxz) - this.yieldfunction(sx, sy, sz, sxy - 0.5 * h, syz, sxz)) / (2 * h);
        let dfds23 = (this.yieldfunction(sx, sy, sz, sxy, syz + 0.5 * h, sxz) - this.yieldfunction(sx, sy, sz, sxy, syz - 0.5 * h, sxz)) / (2 * h);
        let dfds31 = (this.yieldfunction(sx, sy, sz, sxy, syz, sxz + 0.5 * h) - this.yieldfunction(sx, sy, sz, sxy, syz, sxz - 0.5 * h)) / (2 * h);

        return new matrix.Matrix([[dfds11, dfds12, dfds31], [dfds12, dfds22, dfds23], [dfds31, dfds23, dfds33]]);

    }

    async CalcRandR() {
        this.angle = linspace(0, 90, 1001);
        this.normStress = new Array(this.angle.length);
        this.Rvalue = new Array(this.angle.length);

        for (let k = 0; k < this.angle.length; ++k) {
            let ang = this.angle[k] * Math.PI / 180.0;
            // Normalized yield stress
            this.normStress[k] = this.Phi(Math.pow(Math.cos(ang), 2) - 1 / 3, Math.pow(Math.sin(ang), 2) - 1 / 3, -1 / 3, Math.sin(ang) * Math.cos(ang), 0, 0);
            // Lankford coefficient
            let dfds = this.yieldgradient(this.normStress[k] * (Math.pow(Math.cos(ang), 2)), this.normStress[k] * (Math.pow(Math.sin(ang), 2)), 0, this.normStress[k] * (Math.sin(ang) * Math.cos(ang)), 0, 0);
            let Q = new matrix.Matrix([[Math.cos(ang), -Math.sin(ang), 0], [Math.sin(ang), Math.cos(ang), 0], [0, 0, 1]]);
            let df = Q.transpose().mmul(dfds.mmul(Q));
            this.Rvalue[k] = df.data[1][1] / df.data[2][2];

            if (k % 10 === 0)
                await setImmediatePromise();
        }
    }

    async CalcContour() {
        // find max shear stress
        this.s12Max = this.MaxShear();
        // will create contours at these levels of shear stress
        this.s12Contour = [];
        for (let i = 0; i < this.s12Max; i += 0.1) {
            this.s12Contour.push(i);
        }
        // Setting up variables
        let l = linspace(0, 2 * Math.PI, 360);

        this.s11Contour = new Array(this.s12Contour.length);
        this.s22Contour = new Array(this.s12Contour.length);
        for (let k = 0; k < this.s12Contour.length; ++k) {
            this.s11Contour[k] = new Array(l.length);
            this.s22Contour[k] = new Array(l.length);
        }

        await setImmediatePromise();

        // finding the yieldsurface, f = 0
        for (let k = 0; k < this.s12Contour.length; ++k) {
            for (let i = 0; i < l.length; ++i) {
                let s = this.domainReduce(0, 2, 10, l[i], this.s12Contour[k])
                this.s11Contour[k][i] = s * Math.cos([l[i]]);
                this.s22Contour[k][i] = s * Math.sin([l[i]]);

                if (i % 10 === 0)
                    await setImmediatePromise()
            }
        }
    }

    domainReduce(min, max, N, lode, sxy) {
        let s = linspace(min, max, N);
        let temp1 = 1000, temp2 = 1000;
        let n = 0;
        for (let j = 0; j < s.length; ++j) {
            temp2 = Math.abs(this.yieldfunction(s[j] * Math.cos(lode), s[j] * Math.sin(lode), 0, sxy, 0, 0));
            if (temp2 < temp1) {
                n = j;
                temp1 = temp2;
            }
        }

        if (temp1 < 1e-4) {
            return s[n];
        }

        return this.domainReduce(Math.max(s[n] - (s[1] - s[0]), 0), s[n] + (s[1] - s[0]), N, lode, sxy)
    }

    MaxShear() {
        // find maks shear stress
        let sxy = linspace(0.3, 1.1, 1000);
        let temp1 = 1000;
        let temp2 = 1000;
        let n = 0;
        for (let i = 0; i < 1000; ++i) {
            temp2 = Math.abs(this.yieldfunction(0, 0, 0, sxy[i], 0, 0));
            if (temp2 < temp1) {
                n = i;
                temp1 = temp2;
            }
        }
        return sxy[n];
    }
}

// Exports
exports.YieldSurface = YieldSurface;