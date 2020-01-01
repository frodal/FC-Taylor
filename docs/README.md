# FC-Taylor Program

A full constraint (FC) Taylor program useful for generating discrete yield surface data. The program uses the hypoelastic implementation in the SIMLab Crystal Mechanics Model (SCMM-hypo) for solving the single crystal response of each individual grain. Download the latest version [here](https://github.com/frodal/FC-Taylor/releases).

## Usage

See the SCMM-hypo manual or the Home tab of the FC-Taylor application for details.

## Building the Application

To build the FC-Taylor application follow these simple steps.

1. Clone the project from Github (`git clone --recursive https://github.com/frodal/FC-Taylor.git`)
2. Install [Microsoft Visual Studio](https://visualstudio.microsoft.com/)
3. Install [Intel Parallel Studio XE](https://software.intel.com/en-us/fortran-compilers) with the Intel Visual Fortran compiler
4. Install [Node.js](https://nodejs.org)
5. Install [Python](https://www.python.org)
6. Install the required python packages by running the command `pip install -r ./src/python/requirements.txt` in the project directory
7. Install the required Node.js modules by running the command `npm install` in the `GUI` directory
8. Using the command line with the Intel Visual Fortran compiler for Intel x64 with the Visual Studio environement run the `BuildProjectWindows.bat` file to compile and build the application for Windows x64

### Compiling the Fortran Source

For the GNU Fortran compiler (gfortran), compile the Fortran cource with `-fopenmp`. For the Intel Visual Fortran compiler (ifort), compile the source with `-openmp`. Remember to increase the Stack size with `-Fn` where `n` is the number of bytes, e.g., `ifort -openmp -F1000000000 main.f -O2`.

Note that lines starting with `!$` in the Fortran source files are compiler directives to use OpenMP, i.e., multi-threading.

To circumvent issues with memory (the stack size) and OpenMP the Fortran source files should be compiled into an x64 executable.

### Update GUI dependencies

* Update [Electron](https://electronjs.org/docs/tutorial/first-app#installing-electron) by running `npm install --save-dev electron` using the command line in the `FC-Taylor/GUI` directory
* Update [Electron-packager](https://github.com/electron-userland/electron-packager) by running `npm install --save-dev electron-packager` using the command line in the `FC-Taylor/GUI` directory
* Update [Electron-installer-windows](https://github.com/electron-userland/electron-installer-windows) by running `npm install --save-dev electron-installer-windows` using the command line in the `FC-Taylor/GUI` directory

See also the [GUIwrapper](https://github.com/frodal/GUIwrapper) repository

## Contributing

To contribute:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Contact

Bjørn Håkon Frodal - [@frodal](https://github.com/frodal) - bjorn.h.frodal@ntnu.no
