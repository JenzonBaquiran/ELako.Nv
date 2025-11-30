@echo off
REM Restore ELako.Nv Database from Backup
REM Usage: Run this script and enter the backup folder path

echo ========================================
echo   RESTORE ELAKO.NV DATABASE
echo ========================================
echo.

set /p BACKUP_PATH="Enter backup folder path (e.g., database-backups\2025-12-01_1430): "

if not exist "%BACKUP_PATH%\ElakoNv" (
    echo.
    echo ✗ ERROR: Backup folder not found!
    echo Looking for: %BACKUP_PATH%\ElakoNv
    echo.
    pause
    exit /b 1
)

echo.
echo WARNING: This will replace the current ElakoNv database!
set /p CONFIRM="Are you sure? Type YES to continue: "

if not "%CONFIRM%"=="YES" (
    echo Operation cancelled.
    pause
    exit /b 0
)

echo.
echo Restoring database from: %BACKUP_PATH%\ElakoNv
mongorestore --db ElakoNv --drop "%BACKUP_PATH%\ElakoNv"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ SUCCESS! Database restored successfully!
) else (
    echo.
    echo ✗ RESTORE FAILED!
)

echo.
pause