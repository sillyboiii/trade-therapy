#!/bin/bash

echo "🧠 Post-Trade Therapy - Quick Start Script"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

# Ask user what they want to do
echo "What would you like to do?"
echo "1) Run locally (development mode)"
echo "2) Build for production"
echo "3) Deploy to Vercel"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Starting development server..."
        echo "Your app will open at http://localhost:3000"
        echo ""
        npm run dev
        ;;
    2)
        echo ""
        echo "📦 Building for production..."
        npm run build
        echo ""
        echo "✅ Build complete! Files are in the 'dist' folder"
        ;;
    3)
        echo ""
        if ! command -v vercel &> /dev/null; then
            echo "📦 Installing Vercel CLI..."
            npm install -g vercel
        fi
        echo "🚀 Deploying to Vercel..."
        vercel
        ;;
    *)
        echo "Invalid choice. Please run the script again."
        exit 1
        ;;
esac
