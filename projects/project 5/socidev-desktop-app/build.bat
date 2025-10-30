@echo off
REM SociDev Desktop App - Quick Build Script for Windows
REM This script builds the application for Windows

echo.
echo ================================================
echo   SociDev Desktop App - Windows Build Script
echo ================================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [WARNING] node_modules not found. Running npm install...
    call npm install
    echo.
)

REM Clean previous builds
echo [1/4] Cleaning previous builds...
if exist "dist\" rmdir /s /q dist
if exist "release\" rmdir /s /q release
echo [OK] Clean complete
echo.

REM Build TypeScript (Main Process)
echo [2/4] Building main process (TypeScript)...
call npm run build:main
if errorlevel 1 (
    echo [ERROR] Main process build failed!
    exit /b 1
)
echo [OK] Main process built successfully
echo.

REM Build React (Renderer Process)
echo [3/4] Building renderer process (React + Vite)...
call npm run build:renderer
if errorlevel 1 (
    echo [ERROR] Renderer process build failed!
    exit /b 1
)
echo [OK] Renderer process built successfully
echo.

REM Package for Windows
echo [4/4] Packaging application for Windows...
call npm run dist

if errorlevel 1 (
    echo.
    echo [ERROR] Build failed!
    exit /b 1
)

echo.
echo ================================================
echo   BUILD COMPLETED SUCCESSFULLY!
echo ================================================
echo.
echo Distribution files are in: .\release\
echo.
dir /b release\
echo.
echo Ready to distribute!
echo.
pause
