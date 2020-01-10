@echo off
call ifort -openmp -F1000000000 src/fortran/main.f -o ./GUI/Core/FC-Taylor.exe -O3
if %ERRORLEVEL% neq 0 (
  echo.
  echo Could not compile the Fortran source!
  echo The program was therefore not built!
  echo.
  pause
  exit
)
pushd %~dp0\src\python\
call pyinstaller --onefile --noconfirm --clean ^
                 --log-level=INFO ^
                 --distpath=../../GUI/Core ^
                 --name=FC-Taylor-Calibrate ^
                 --icon=../../GUI/assets/icons/win/icon.ico ^
                 fc-taylor-calibrate.py
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