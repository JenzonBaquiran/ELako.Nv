@echo off
REM ELako.Nv Database Backup Script
REM Run this after installing MongoDB Database Tools

echo ========================================
echo   ELAKO.NV DATABASE BACKUP
echo ========================================
echo.

set BACKUP_DIR=database-backups\%date:~-4,4%-%date:~-10,2%-%date:~-7,2%_%time:~0,2%%time:~3,2%
set DB_NAME=ElakoNv

echo Creating backup directory: %BACKUP_DIR%
mkdir "%BACKUP_DIR%" 2>nul

echo.
echo Backing up ElakoNv database...
mongodump --db %DB_NAME% --out "%BACKUP_DIR%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ SUCCESS! Database backed up to:
    echo %BACKUP_DIR%\%DB_NAME%
    echo.
    echo Files created:
    dir "%BACKUP_DIR%\%DB_NAME%" /B
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