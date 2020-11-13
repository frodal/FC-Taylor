////////////////////////////////////////////////////////////////////////////////////
//                                   Plotting                                     //
////////////////////////////////////////////////////////////////////////////////////

const Plotly = require('plotly.js-dist');

const { setImmediatePromise } = require('./Utils');

class Plotter {

    constructor(darkSwitch = document.getElementById('darkSwitch')) {
        this.darkSwitch = darkSwitch;
    }

    FindDelta(value) {
        if (Math.floor(value) === 0) {
            return 0.1 * this.FindDelta(value * 10);
        }
        return Math.floor(value)
    }

    async plotScatter(target, x, y) {
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
            paper_bgcolor: this.darkSwitch.checked ? 'rgb(30, 30, 30)' : '#FFF',
            plot_bgcolor: this.darkSwitch.checked ? 'rgb( 30, 30, 30)' : '#FFF',
            font: {
                family: 'Montserrat',
                color: this.darkSwitch.checked ? 'rgb(190,190,190)' : '#444'
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
                color: this.darkSwitch.checked ? 'rgb(190,190,190)' : 'rgb(0,0,0)',
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

    async plotYS(target, ys) {
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
            paper_bgcolor: this.darkSwitch.checked ? 'rgb(30, 30, 30)' : '#FFF',
            plot_bgcolor: this.darkSwitch.checked ? 'rgb( 30, 30, 30)' : '#FFF',
            font: {
                family: 'Montserrat',
                color: this.darkSwitch.checked ? 'rgb(190,190,190)' : '#444'
            },
            annotations: [
                {
                    x: 0,
                    y: 0,
                    text: parseFloat(ys.s12Max).toFixed(2),
                    showarrow: false,
                }
            ],
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
        for (let k = 0; k < ys.s11Contour.length; ++k) {
            const trace =
            {
                x: ys.s11Contour[k],
                y: ys.s22Contour[k],
                mode: 'lines',
                name: `Sxy = ${ys.s12Contour[k]}`,
                line: {
                    color: this.darkSwitch.checked ? 'rgb(190,190,190)' : 'rgb(0,0,0)',
                },
                type: 'scatter'
            };
            data.push(trace);
        }

        Plotly.react(target, data, layout, config);
    }

    async plotLankford(target, ys) {
        let max = ys.Rvalue.reduce(function (a, b) {
            return Math.max(a, b);
        }, 1);
        let offset = 0.2;
        let dy = this.FindDelta(((1 + offset) * max - 0) / 6);

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
                range: [0, (1 + offset) * max],
                dtick: dy,
                showgrid: true,
                zeroline: false
            },
            paper_bgcolor: this.darkSwitch.checked ? 'rgb(30, 30, 30)' : '#FFF',
            plot_bgcolor: this.darkSwitch.checked ? 'rgb( 30, 30, 30)' : '#FFF',
            font: {
                family: 'Montserrat',
                color: this.darkSwitch.checked ? 'rgb(190,190,190)' : '#444'
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
            x: ys.angle,
            y: ys.Rvalue,
            mode: 'lines',
            name: 'Lankford coefficient',
            line: {
                color: this.darkSwitch.checked ? 'rgb(190,190,190)' : 'rgb(0,0,0)',
            },
            type: 'scatter'
        };
        const data = [trace];
        Plotly.react(target, data, layout, config);
    }

    async plotNormStress(target, ys) {
        let max = ys.normStress.reduce(function (a, b) {
            return Math.max(a, b);
        }, 1);
        let min = ys.normStress.reduce(function (a, b) {
            return Math.min(a, b);
        }, 0);
        let offset = 0.2;
        let dy = this.FindDelta(((1 + offset) * max - (1 - offset) * min) / 6);

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
                range: [(1 - offset) * min, (1 + offset) * max],
                dtick: dy,
                showgrid: true,
                zeroline: false
            },
            paper_bgcolor: this.darkSwitch.checked ? 'rgb(30, 30, 30)' : '#FFF',
            plot_bgcolor: this.darkSwitch.checked ? 'rgb( 30, 30, 30)' : '#FFF',
            font: {
                family: 'Montserrat',
                color: this.darkSwitch.checked ? 'rgb(190,190,190)' : '#444'
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
            x: ys.angle,
            y: ys.normStress,
            mode: 'lines',
            name: `Normalized yield stress`,
            line: {
                color: this.darkSwitch.checked ? 'rgb(190,190,190)' : 'rgb(0,0,0)',
            },
            type: 'scatter'
        };
        const data = [trace];

        Plotly.react(target, data, layout, config);
    }

    async plotRandR(target1, target2, ys) {
        this.plotNormStress(target1, ys);
        this.plotLankford(target2, ys);
    }
}

// Exports
exports.Plotter = Plotter;