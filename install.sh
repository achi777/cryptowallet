#!/bin/bash

# Crypto Wallet Installation Script
# This script installs all dependencies and sets up the development environment

echo "🚀 Crypto Wallet Installation Script"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install with different package managers
install_package() {
    local package=$1
    local description=$2
    
    print_status "Installing $description..."
    
    if command_exists brew; then
        brew install "$package"
    elif command_exists apt-get; then
        sudo apt-get update && sudo apt-get install -y "$package"
    elif command_exists yum; then
        sudo yum install -y "$package"
    elif command_exists pacman; then
        sudo pacman -S --noconfirm "$package"
    else
        print_error "No supported package manager found. Please install $description manually."
        return 1
    fi
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

print_step "1. Checking system and dependencies"

# Check OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
    print_status "Detected: macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
    print_status "Detected: Linux"
else
    print_warning "Detected: $OSTYPE (may not be fully supported)"
    OS="Other"
fi

print_step "2. Installing development tools"

# Install Homebrew on macOS if not present
if [[ "$OS" == "macOS" ]] && ! command_exists brew; then
    print_status "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for current session
    if [[ -f "/opt/homebrew/bin/brew" ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [[ -f "/usr/local/bin/brew" ]]; then
        eval "$(/usr/local/bin/brew shellenv)"
    fi
fi

print_step "3. Installing Java 21"

# Check Java version
if command_exists java; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
    if [[ "$JAVA_VERSION" -ge 21 ]]; then
        print_success "Java $JAVA_VERSION is already installed"
    else
        print_warning "Java $JAVA_VERSION found, but Java 21+ is required"
        if [[ "$OS" == "macOS" ]]; then
            brew install openjdk@21
            echo 'export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"' >> ~/.zshrc
            echo 'export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"' >> ~/.bash_profile
        else
            install_package "openjdk-21-jdk" "Java 21"
        fi
    fi
else
    print_status "Installing Java 21..."
    if [[ "$OS" == "macOS" ]]; then
        brew install openjdk@21
        echo 'export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"' >> ~/.zshrc
        echo 'export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"' >> ~/.bash_profile
        # For current session
        export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"
    else
        install_package "openjdk-21-jdk" "Java 21"
    fi
fi

print_step "4. Installing Maven"

if ! command_exists mvn; then
    install_package "maven" "Maven"
else
    print_success "Maven is already installed"
fi

print_step "5. Installing Node.js and npm"

if ! command_exists node; then
    if [[ "$OS" == "macOS" ]]; then
        brew install node
    else
        # Install Node.js via NodeSource repository for Linux
        if command_exists curl; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt-get install -y nodejs
        else
            install_package "nodejs npm" "Node.js and npm"
        fi
    fi
else
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [[ "$NODE_VERSION" -ge 16 ]]; then
        print_success "Node.js $NODE_VERSION is already installed"
    else
        print_warning "Node.js $NODE_VERSION found, but v16+ is recommended"
    fi
fi

print_step "6. Installing Docker"

if ! command_exists docker; then
    if [[ "$OS" == "macOS" ]]; then
        print_status "Installing Docker Desktop for macOS..."
        brew install --cask docker
        print_warning "Please start Docker Desktop manually after installation"
    else
        print_status "Installing Docker..."
        # Install Docker using convenience script
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        print_warning "Please log out and back in to use Docker without sudo"
        rm get-docker.sh
    fi
else
    print_success "Docker is already installed"
fi

print_step "7. Installing frontend dependencies"

if [[ -d "frontend" ]]; then
    cd frontend
    if [[ -f "package.json" ]]; then
        print_status "Installing frontend npm packages..."
        npm install
        if [[ $? -eq 0 ]]; then
            print_success "Frontend dependencies installed successfully"
        else
            print_error "Failed to install frontend dependencies"
        fi
    else
        print_warning "No package.json found in frontend directory"
    fi
    cd ..
else
    print_warning "Frontend directory not found"
fi

print_step "8. Setting up PostgreSQL with Docker"

# Check if Docker is running (only if Docker is installed)
if command_exists docker; then
    if docker info >/dev/null 2>&1; then
        print_status "Setting up PostgreSQL container..."
        docker compose up -d postgres
        
        # Wait for PostgreSQL to be ready
        print_status "Waiting for PostgreSQL to initialize..."
        max_attempts=30
        attempt=1
        
        while [ $attempt -le $max_attempts ]; do
            if docker exec cryptowallet-postgres pg_isready -U postgres -d postgres >/dev/null 2>&1; then
                print_success "PostgreSQL is ready!"
                break
            fi
            printf "."
            sleep 2
            attempt=$((attempt + 1))
        done
        
        if [ $attempt -gt $max_attempts ]; then
            echo ""
            print_warning "PostgreSQL setup may need more time. Check with: docker logs cryptowallet-postgres"
        fi
    else
        print_warning "Docker is not running. Please start Docker and run: docker compose up -d postgres"
    fi
else
    print_warning "Docker not found. PostgreSQL setup skipped."
fi

print_step "9. Creating helpful scripts"

# Make scripts executable
chmod +x startwallet.sh 2>/dev/null || true
chmod +x stopwallet.sh 2>/dev/null || true

print_step "10. Installation Summary"

echo ""
echo "======================================="
print_success "🎉 Installation Complete!"
echo "======================================="
echo ""

print_status "📋 What was installed:"
command_exists java && echo "  ✅ Java $(java -version 2>&1 | head -n 1 | cut -d'"' -f2)"
command_exists mvn && echo "  ✅ Maven $(mvn -version 2>/dev/null | head -n 1 | cut -d' ' -f3)"
command_exists node && echo "  ✅ Node.js $(node -v)"
command_exists npm && echo "  ✅ npm $(npm -v)"
command_exists docker && echo "  ✅ Docker $(docker -v 2>/dev/null | cut -d' ' -f3 | cut -d',' -f1)"

echo ""
print_status "🚀 Next Steps:"
echo "  1. Start the application:"
echo "     ./startwallet.sh"
echo ""
echo "  2. Stop the application:"
echo "     ./stopwallet.sh"
echo ""
echo "  3. Access the application:"
echo "     Frontend: http://localhost:3000"
echo "     Backend:  http://localhost:8080/api"
echo "     Database: localhost:5433"
echo ""

if [[ "$OS" == "macOS" ]] && ! command_exists docker; then
    print_warning "📝 Note: Please start Docker Desktop manually before running the application"
fi

if ! docker info >/dev/null 2>&1 && command_exists docker; then
    print_warning "📝 Note: Docker is installed but not running. Please start Docker before running the application"
fi

echo "======================================="
print_status "Happy coding! 🚀💰"
echo ""