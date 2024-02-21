@echo off
set MISC_DIR=%~dp0
call :NORMALIZEPATH "%MISC_DIR%..\"
set PROJECT_ROOT=%RETVAL%
if "%PROJECT_ROOT:~-1%" == "\" set "PROJECT_ROOT1=%PROJECT_ROOT:~0,-1%"
for %%f in ("%PROJECT_ROOT1%") do set "PROJECT_NAME=%%~nxf"

echo Set oWS = WScript.CreateObject("WScript.Shell") > CreateShortcut.vbs
echo sLinkFile = "%HOMEDRIVE%%HOMEPATH%\Desktop\%PROJECT_NAME% Shell.lnk" >> CreateShortcut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> CreateShortcut.vbs
echo oLink.TargetPath = "%%windir%%\system32\cmd.exe" >> CreateShortcut.vbs
echo oLink.Arguments = "/K %MISC_DIR%shell.bat" >> CreateShortcut.vbs
echo oLink.WorkingDirectory = "%PROJECT_ROOT%" >> CreateShortcut.vbs
echo oLink.Save >> CreateShortcut.vbs
cscript CreateShortcut.vbs
del CreateShortcut.vbs

:: ========== FUNCTIONS ==========
EXIT /B

:NORMALIZEPATH
  SET RETVAL=%~f1
  EXIT /B
