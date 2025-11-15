#!/bin/bash

# MQuran Quick Start Script
# This script helps you set up the project quickly

set -e  # Exit on error

echo "========================================"
echo "  MQuran Quick Start Setup"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Print colored message
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Check prerequisites
echo "Checking prerequisites..."
echo ""

MISSING_PREREQ=0

if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js is installed: $NODE_VERSION"
else
    print_error "Node.js is not installed"
    MISSING_PREREQ=1
fi

if command_exists yarn; then
    YARN_VERSION=$(yarn --version)
    print_success "Yarn is installed: $YARN_VERSION"
else
    print_error "Yarn is not installed"
    MISSING_PREREQ=1
fi

if command_exists java; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    print_success "Java is installed: $JAVA_VERSION"
else
    print_warning "Java is not installed (required for Android)"
fi

if command_exists python3 || command_exists python; then
    if command_exists python3; then
        PYTHON_VERSION=$(python3 --version)
    else
        PYTHON_VERSION=$(python --version)
    fi
    print_success "Python is installed: $PYTHON_VERSION"
else
    print_warning "Python is not installed (required for model conversion)"
fi

if [ $MISSING_PREREQ -eq 1 ]; then
    echo ""
    print_error "Missing required prerequisites. Please install them first."
    echo "See SETUP.md for detailed instructions."
    exit 1
fi

echo ""
echo "========================================"
echo "Installing dependencies..."
echo "========================================"
echo ""

yarn install
print_success "Dependencies installed"

echo ""
echo "========================================"
echo "Building shared packages..."
echo "========================================"
echo ""

yarn build
print_success "Packages built"

echo ""
echo "========================================"
echo "Downloading Quran data..."
echo "========================================"
echo ""

if [ -f "packages/quran-data/data/quran.json" ]; then
    print_info "Quran data already exists. Skipping download."
else
    yarn workspace @mquran/quran-data download-quran
    print_success "Quran data downloaded"
fi

echo ""
echo "========================================"
echo "Setup complete!"
echo "========================================"
echo ""

print_info "Next steps:"
echo ""
echo "1. Download the ML model:"
echo "   cd scripts/ml-models"
echo "   pip install -r requirements.txt"
echo "   python download_and_convert_model.py"
echo ""
echo "2. Run the mobile app:"
echo "   yarn mobile              # Start Metro bundler"
echo "   yarn mobile:android      # Run on Android (in another terminal)"
echo ""
echo "3. Run the backend (optional):"
echo "   yarn backend"
echo ""

print_success "Happy coding! 🚀"
