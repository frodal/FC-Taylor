@echo off

if exist "C:\Program Files (x86)\Intel\oneAPI\setvars.bat" ^
call "C:\Program Files (x86)\Intel\oneAPI\setvars.bat"

if not exist GUI\Core mkdir GUI\Core

call ifort -openmp -fpp -F1000000000 src/fortran/main.f -o ./GUI/Core/FC-Taylor.exe ^
           -O3 -QaxCOMMON-AVX512,CORE-AVX512,CORE-AVX2,AVX
if %ERRORLEVEL% neq 0 (
  if exist main.obj del main.obj
  echo.
  echo Could not compile the Fortran source!
  echo The program was therefore not built!
  echo.
  pause
  exit
)
if exist main.obj del main.obj
if exist functions.mod del functions.mod

call python -m venv .env --clear --upgrade-deps
call ".env\Scripts\activate.bat"
pushd %~dp0\src\python\
call pip install -r requirements.txt
call pyinstaller --onefile --noconfirm --clean ^
                 --log-level=WARN ^
                 --distpath=../../GUI/Core ^
                 --name=FC-Taylor-Calibrate ^
                 --icon=../../GUI/assets/icons/win/icon.ico ^
                 fc-taylor-calibrate.py
if %ERRORLEVEL% neq 0 (
  rmdir /s /q __pycache__
  rmdir /s /q build
  if exist FC-Taylor-Calibrate.spec del FC-Taylor-Calibrate.spec
  popd
  call deactivate
  echo.
  echo Could not build the Python calibration script!
  echo The program was therefore not built!
  echo.
  pause
  exit
)
rmdir /s /q __pycache__
rmdir /s /q build
if exist FC-Taylor-Calibrate.spec del FC-Taylor-Calibrate.spec
popd
call deactivate

copy docs\LICENSE.md GUI\LICENSE.md /y

pushd %~dp0\GUI\
call npm install
call npm run build-win64
call npm run setup-win64
popd

del GUI\LICENSE.md

echo.
echo The application was built!
echo See the GUIbinaries\ folder
echo.
pause