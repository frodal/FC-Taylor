@echo off
call ifort -openmp -F1000000000 main.f -o ./GUI/Core/FC-Taylor.exe -O3
if %ERRORLEVEL% neq 0 (
  echo.
  echo Could not compile the Fortran source!
  echo The program was therefore not built!
  echo.
  pause
  exit
)
pushd %~dp0\GUI\calibrate\
call pyinstaller fc-taylor-calibrate.py -y
if %ERRORLEVEL% neq 0 (
  popd
  echo.
  echo Could not build the Python calibration script!
  echo The program was therefore not built!
  echo.
  pause
  exit
)
popd
pushd %~dp0\GUI\
call npm run build-win64
call npm run setup-win64
popd