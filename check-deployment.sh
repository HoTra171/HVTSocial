#!/bin/bash

# Quick Deployment Helper for Linux/Mac
# Run: bash check-deployment.sh

set -e

echo "========================================"
echo "  HVTSocial - Deployment Checker"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

echo -e "${GREEN}[OK]${NC} Node.js is installed"
node --version
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[ERROR]${NC} npm is not installed!"
    exit 1
fi

echo -e "${GREEN}[OK]${NC} npm is installed"
npm --version
echo ""

# Check Backend setup
echo "========================================"
echo "Checking Backend..."
echo "========================================"
echo ""

cd Backend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[WARNING]${NC} Backend dependencies not installed"
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}[ERROR]${NC} Failed to install Backend dependencies"
        cd ..
        exit 1
    fi
else
    echo -e "${GREEN}[OK]${NC} Backend dependencies installed"
fi

echo ""

# Check .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[WARNING]${NC} Backend .env file not found"
    echo ""
    echo "Please create .env file:"
    echo "1. Copy .env.example to .env"
    echo "2. Fill in all required values"
    echo "3. Run: npm run check-env"
    echo ""
    cd ..
    exit 1
else
    echo -e "${GREEN}[OK]${NC} Backend .env file exists"
fi

echo ""
echo "Checking environment variables..."
npm run check-env
if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}[ERROR]${NC} Environment variables check failed!"
    echo ""
    echo "Quick fixes:"
    echo "- Generate JWT secret: npm run generate-secret"
    echo "- Get Cloudinary credentials from https://cloudinary.com"
    echo "- Update .env file with correct values"
    echo ""
    cd ..
    exit 1
fi

cd ..

echo ""
echo "========================================"
echo "Checking Frontend..."
echo "========================================"
echo ""

cd Frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[WARNING]${NC} Frontend dependencies not installed"
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}[ERROR]${NC} Failed to install Frontend dependencies"
        cd ..
        exit 1
    fi
else
    echo -e "${GREEN}[OK]${NC} Frontend dependencies installed"
fi

echo ""

# Check .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[INFO]${NC} Frontend .env file not found (optional for local dev)"
    echo "For production, create .env.production with:"
    echo "VITE_API_URL=https://your-backend-url.com"
    echo "VITE_WS_URL=https://your-backend-url.com"
else
    echo -e "${GREEN}[OK]${NC} Frontend .env file exists"
fi

cd ..

echo ""
echo "========================================"
echo "Docker Check"
echo "========================================"
echo ""

if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}[WARNING]${NC} Docker is not installed"
    echo "Docker is optional but recommended for production deployment"
    echo "Install from: https://www.docker.com/products/docker-desktop"
else
    echo -e "${GREEN}[OK]${NC} Docker is installed"
    docker --version
    
    if command -v docker-compose &> /dev/null; then
        echo -e "${GREEN}[OK]${NC} Docker Compose is installed"
        docker-compose --version
    fi
fi

echo ""
echo "========================================"
echo "Summary"
echo "========================================"
echo ""

echo -e "${GREEN}✓${NC} Project structure: OK"
echo -e "${GREEN}✓${NC} Backend dependencies: OK"
echo -e "${GREEN}✓${NC} Backend .env: OK"
echo -e "${GREEN}✓${NC} Frontend dependencies: OK"

echo ""
echo "========================================"
echo "Next Steps"
echo "========================================"
echo ""
echo "Local Development:"
echo "  1. cd Backend && npm run dev"
echo "  2. cd Frontend && npm run dev"
echo "  3. Open http://localhost:3000"
echo ""
echo "Production Deployment:"
echo "  1. Read DEPLOYMENT_CHECKLIST.md"
echo "  2. Follow step-by-step guide (30 minutes)"
echo "  3. Deploy to Vercel + Render (FREE)"
echo ""
echo "Useful Commands:"
echo "  npm run check-env        - Check environment variables"
echo "  npm run generate-secret  - Generate JWT secret"
echo "  npm run db:migrate       - Run database migration"
echo ""
echo "========================================"
echo -e "${GREEN}✓ Ready to Deploy!${NC}"
echo "========================================"
echo ""
