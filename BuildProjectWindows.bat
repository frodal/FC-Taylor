@echo off

if exist "C:\Program Files (x86)\IntelSWTools\compilers_and_libraries\windows\bin\compilervars.bat" call "C:\Program Files (x86)\IntelSWTools\compilers_and_libraries\windows\bin\compilervars.bat" intel64

if not exist GUI\Core mkdir GUI\Core

call ifort -openmp -F1000000000 src/fortran/main.f -o ./GUI/Core/FC-Taylor.exe -O3
if %ERRORLEVEL% neq 0 (
  del main.obj
  echo.
  echo Could not compile the Fortran source!
  echo The program was therefore not built!
  echo.
  pause
  exit
)
del main.obj

pushd %~dp0\src\python\
pip install -r requirements.txt
call pyinstaller --onefile --noconfirm --clean ^
                 --log-level=WARN ^
                 --distpath=../../GUI/Core ^
                 --name=FC-Taylor-Calibrate ^
                 --icon=../../GUI/assets/icons/win/icon.ico ^
                 fc-taylor-calibrate.py
if %ERRORLEVEL% neq 0 (
  rmdir /s /q __pycache__
  rmdir /s /q build
  del FC-Taylor-Calibrate.spec
  popd
  echo.
  echo Could not build the Python calibration script!
  echo The program was therefore not built!
  echo.
  pause
  exit
)
rmdir /s /q __pycache__
rmdir /s /q build
del FC-Taylor-Calibrate.spec
popd

copy LICENSE.md GUI\LICENSE.md /y

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