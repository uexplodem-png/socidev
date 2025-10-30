#!/bin/bash

# SociDev Desktop App - Quick Build Script
# This script builds the application for the current platform

set -e

echo "🚀 SociDev Desktop App - Build Script"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Running npm install...${NC}"
    npm install
    echo ""
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist release
echo -e "${GREEN}✓ Clean complete${NC}"
echo ""

# Build TypeScript (Main Process)
echo "📦 Building main process (TypeScript)..."
npm run build:main
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Main process built successfully${NC}"
else
    echo -e "${RED}✗ Main process build failed${NC}"
    exit 1
fi
echo ""

# Build React (Renderer Process)
echo "⚛️  Building renderer process (React + Vite)..."
npm run build:renderer
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Renderer process built successfully${NC}"
else
    echo -e "${RED}✗ Renderer process build failed${NC}"
    exit 1
fi
echo ""

# Detect platform
OS=""
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    OS="Windows"
else
    OS="Unknown"
fi

echo "🖥️  Detected platform: $OS"
echo ""

# Package for current platform
echo "📦 Packaging application for $OS..."
npm run dist

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Build completed successfully!${NC}"
    echo ""
    echo "📁 Distribution files are in: ./release/"
    echo ""
    ls -lh release/
    echo ""
    echo -e "${GREEN}🎉 Ready to distribute!${NC}"
else
    echo ""
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi
