@echo off

:: Print Client Startup Setup Script
:: This script automatically generates registry file for startup

cls
echo ====================================
echo    Startup Configuration Script
echo ====================================
echo.
echo Generating startup configuration...
echo.

:: Get current script directory
set "SCRIPT_DIR=%~dp0"
echo Current directory: %SCRIPT_DIR%
echo.

:: Set registry file path
set "REG_FILE=%SCRIPT_DIR%add-startup.reg"
echo Registry file: %REG_FILE%
echo.

:: Create empty file
type nul > "%REG_FILE%"

:: Write registry content
echo Windows Registry Editor Version 5.00 >> "%REG_FILE%"
echo. >> "%REG_FILE%"
echo [HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run] >> "%REG_FILE%"
echo "PrintClient"="%SCRIPT_DIR:\=\\%start-print-client.bat" >> "%REG_FILE%"
echo. >> "%REG_FILE%"
echo [HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Run] >> "%REG_FILE%"
echo "PrintClient"="%SCRIPT_DIR:\=\\%start-print-client.bat" >> "%REG_FILE%"

:: Verify file creation
if exist "%REG_FILE%" (
    echo SUCCESS: %REG_FILE%
echo.
echo Please double-click %REG_FILE% to setup startup
echo.
echo After setup, print client will start automatically on boot
echo.
echo Press any key to close...
pause > nul
) else (
    echo ERROR: Failed to create file
echo Please check permissions
echo.
echo Press any key to close...
pause > nul
)

exit