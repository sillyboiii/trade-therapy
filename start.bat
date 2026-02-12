@echo off
echo.
echo 🧠 Post-Trade Therapy - Quick Start Script
echo ==========================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js is installed
node --version
echo.

:: Install dependencies
echo 📦 Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ✅ Dependencies installed successfully!
echo.

:: Ask user what they want to do
echo What would you like to do?
echo 1) Run locally (development mode)
echo 2) Build for production
echo 3) Deploy to Vercel
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo 🚀 Starting development server...
    echo Your app will open at http://localhost:3000
    echo.
    call npm run dev
) else if "%choice%"=="2" (
    echo.
    echo 📦 Building for production...
    call npm run build
    echo.
    echo ✅ Build complete! Files are in the 'dist' folder
    pause
) else if "%choice%"=="3" (
    echo.
    where vercel >nul 2>nul
    if %errorlevel% neq 0 (
        echo 📦 Installing Vercel CLI...
        call npm install -g vercel
    )
    echo 🚀 Deploying to Vercel...
    call vercel
) else (
    echo Invalid choice. Please run the script again.
    pause
    exit /b 1
)
