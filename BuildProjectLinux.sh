#!/bin/bash

mkdir -p "GUI/Core"

gfortran -fopenmp -cpp src/fortran/main.f -o ./GUI/Core/FC-Taylor.exe -O3 -msse4.2 -mtune=intel

rm -f functions.mod

pushd "src/python"

pip3 install -r requirements.txt

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
