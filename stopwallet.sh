#!/bin/bash

# Crypto Wallet Stop Script
# This script stops both the Spring Boot backend and React frontend

echo "🛑 Stopping Crypto Wallet Application..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to stop processes on a specific port
stop_port_processes() {
    local port=$1
    local service_name=$2
    
    if check_port $port; then
        print_status "Stopping $service_name on port $port..."
        
        # Get PIDs of processes using the port
        local pids=$(lsof -ti:$port)
        
        if [ -n "$pids" ]; then
            # First try graceful shutdown
            echo $pids | xargs kill -TERM 2>/dev/null
            sleep 3
            
            # Check if processes are still running
            if check_port $port; then
                print_warning "Processes still running, forcing shutdown..."
                echo $pids | xargs kill -9 2>/dev/null
                sleep 2
            fi
            
            # Final check
            if check_port $port; then
                print_error "Failed to stop $service_name on port $port"
                return 1
            else
                print_success "$service_name stopped successfully"
                return 0
            fi
        fi
    else
        print_status "$service_name is not running on port $port"
        return 0
    fi
}

# Stop Spring Boot applications (backend)
print_status "🔧 Stopping Spring Boot Backend..."
if pgrep -f "spring-boot:run" > /dev/null; then
    pkill -f "spring-boot:run"
    sleep 2
    if pgrep -f "spring-boot:run" > /dev/null; then
        print_warning "Force killing Spring Boot processes..."
        pkill -9 -f "spring-boot:run"
    fi
    print_success "Spring Boot backend stopped"
else
    print_status "Spring Boot backend was not running"
fi

# Stop React applications (frontend)  
print_status "⚛️  Stopping React Frontend..."
if pgrep -f "npm start" > /dev/null; then
    pkill -f "npm start"
    sleep 2
    if pgrep -f "npm start" > /dev/null; then
        print_warning "Force killing npm start processes..."
        pkill -9 -f "npm start"
    fi
    print_success "React frontend stopped"
else
    print_status "React frontend was not running"
fi

# Stop any remaining Node.js processes related to React
if pgrep -f "react-scripts start" > /dev/null; then
    print_status "Stopping react-scripts processes..."
    pkill -f "react-scripts start"
    sleep 1
fi

# Stop processes by port as backup
stop_port_processes 8080 "Backend Service"
stop_port_processes 3000 "Frontend Service"

# Stop any Java processes that might be hanging
print_status "🧹 Cleaning up any remaining Java processes..."
java_pids=$(pgrep -f "java.*spring-boot")
if [ -n "$java_pids" ]; then
    print_warning "Found hanging Java processes, stopping them..."
    echo $java_pids | xargs kill -TERM 2>/dev/null
    sleep 2
    # Force kill if still running
    java_pids=$(pgrep -f "java.*spring-boot")
    if [ -n "$java_pids" ]; then
        echo $java_pids | xargs kill -9 2>/dev/null
    fi
fi

# Final verification
echo ""
print_status "🔍 Final verification..."

services_stopped=true

if check_port 8080; then
    print_error "Backend is still running on port 8080"
    services_stopped=false
fi

if check_port 3000; then
    print_error "Frontend is still running on port 3000"  
    services_stopped=false
fi

echo ""
if [ "$services_stopped" = true ]; then
    print_success "✅ All Crypto Wallet services stopped successfully!"
    echo ""
    print_status "Ports 3000 and 8080 are now available"
    print_status "You can restart the application using: ./startwallet.sh"
else
    print_error "❌ Some services may still be running"
    echo ""
    print_warning "You may need to manually kill remaining processes:"
    print_warning "  lsof -ti:8080 | xargs kill -9"
    print_warning "  lsof -ti:3000 | xargs kill -9"
fi

echo ""
echo "========================================"