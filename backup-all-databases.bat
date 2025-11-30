@echo off
REM ELako.Nv ALL Databases Backup Script
REM Run this after installing MongoDB Database Tools

echo ========================================
echo   BACKUP ALL MONGODB DATABASES
echo ========================================
echo.

set BACKUP_DIR=all-databases-backup\%date:~-4,4%-%date:~-10,2%-%date:~-7,2%_%time:~0,2%%time:~3,2%

echo Creating backup directory: %BACKUP_DIR%
mkdir "%BACKUP_DIR%" 2>nul

echo.
echo Backing up ALL databases...
mongodump --out "%BACKUP_DIR%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ SUCCESS! All databases backed up to:
    echo %BACKUP_DIR%
    echo.
    echo Databases backed up:
    for /D %%i in ("%BACKUP_DIR%\*") do echo   - %%~ni
    echo.
    explorer "%BACKUP_DIR%"
) else (
    echo.
    echo ✗ BACKUP FAILED!
    echo Make sure MongoDB Database Tools are installed:
    echo https://www.mongodb.com/try/download/database-tools
)

echo.
pause