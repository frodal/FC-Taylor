#!/bin/bash

mkdir -p "GUI/Core"

if test -f "/opt/intel/oneapi/setvars.sh"; then
    source /opt/intel/oneapi/setvars.sh

    ifort -qopenmp -qopenmp-link=static -fpp src/fortran/main.f -o ./GUI/Core/FC-Taylor.exe \
          -O3 -axCOMMON-AVX512,CORE-AVX512,CORE-AVX2,AVX
else
    gfortran -fopenmp -cpp src/fortran/main.f -o ./GUI/Core/FC-Taylor.exe -O3 -msse4.2 -mtune=intel
fi

rm -f functions.mod

pushd "src/python"

python3 -m pip install -r requirements.txt

python3 -m PyInstaller --onefile --noconfirm --clean --log-level=WARN --distpath=../../GUI/Core --name=FC-Taylor-Calibrate.exe fc-taylor-calibrate.py

rm -rf __pycache__
rm -rf build
rm -f FC-Taylor-Calibrate.exe.spec

popd

cp "docs/LICENSE.md" "GUI/LICENSE.md"

pushd "GUI"

npm install
npm run build-linux64

popd

rm -rf "GUI/LICENSE.md"
