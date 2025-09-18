#!/bin/bash

# Crypto Wallet Startup Script
# This script starts both the Spring Boot backend and React frontend

echo "🚀 Starting Crypto Wallet Application..."
echo "========================================"

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

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to kill processes on specific ports
kill_port_processes() {
    local port=$1
    local service_name=$2
    
    if check_port $port; then
        print_warning "$service_name is already running on port $port. Stopping existing process..."
        lsof -ti:$port | xargs kill -9 2>/dev/null
        sleep 2
        if check_port $port; then
            print_error "Failed to stop existing $service_name process on port $port"
            return 1
        else
            print_success "Stopped existing $service_name process"
        fi
    fi
    return 0
}

# Function to wait for service to start
wait_for_service() {
    local port=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to start on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if check_port $port; then
            print_success "$service_name is running on port $port"
            return 0
        fi
        
        printf "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo ""
    print_error "$service_name failed to start within 60 seconds"
    return 1
}

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Check if directories exist
if [ ! -d "$BACKEND_DIR" ]; then
    print_error "Backend directory not found: $BACKEND_DIR"
    exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
    print_error "Frontend directory not found: $FRONTEND_DIR"
    exit 1
fi

# Check if Java is installed
if ! command -v java &> /dev/null; then
    print_error "Java is not installed or not in PATH"
    print_status "Please install Java 21 or later"
    exit 1
fi

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    print_error "Maven is not installed or not in PATH"
    print_status "Please install Maven"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed or not in PATH"
    print_status "Please install Node.js"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed or not in PATH"
    print_status "Please install npm"
    exit 1
fi

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    print_status "Please install Docker"
    exit 1
fi

if ! docker info &> /dev/null; then
    print_warning "Docker daemon is not accessible. Trying to start containers anyway..."
    sleep 2
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
    print_error "Docker Compose is not available"
    print_status "Please install Docker Compose"
    exit 1
fi

# Stop any existing processes
print_status "Checking for existing processes..."
kill_port_processes 8080 "Backend"
kill_port_processes 3000 "Frontend"
kill_port_processes 5433 "PostgreSQL"

# Start PostgreSQL with Docker Compose
print_status "🐘 Starting PostgreSQL database..."
if command -v docker-compose &> /dev/null; then
    docker-compose up -d postgres
else
    docker compose up -d postgres
fi

# Wait for PostgreSQL to be ready
print_status "Waiting for PostgreSQL to be ready..."
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if docker exec cryptowallet-postgres pg_isready -U cryptouser -d cryptowallet &> /dev/null; then
        print_success "✅ PostgreSQL is ready!"
        break
    fi
    
    printf "."
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo ""
    print_error "❌ PostgreSQL failed to start within 60 seconds"
    print_status "Check Docker logs: docker logs cryptowallet-postgres"
    exit 1
fi

echo ""

# Create log directory
mkdir -p "$SCRIPT_DIR/logs"

print_status "Starting services..."
echo ""

# Start Backend
print_status "🔧 Starting Spring Boot Backend..."
cd "$BACKEND_DIR"

# Check if Maven wrapper exists, otherwise use system Maven
if [ -f "./mvnw" ]; then
    MAVEN_CMD="./mvnw"
else
    MAVEN_CMD="mvn"
fi

# Start backend in background
nohup $MAVEN_CMD spring-boot:run > "$SCRIPT_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
if wait_for_service 8080 "Backend"; then
    echo ""
    print_success "✅ Backend started successfully!"
    print_status "   📍 API: http://localhost:8080/api"
    print_status "   🗄️  Database Console: http://localhost:8080/h2-console"
else
    print_error "❌ Backend failed to start"
    print_status "Check logs: $SCRIPT_DIR/logs/backend.log"
    exit 1
fi

echo ""

# Start Frontend
print_status "⚛️  Starting React Frontend..."
cd "$FRONTEND_DIR"

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install frontend dependencies"
        exit 1
    fi
fi

# Start frontend in background
nohup npm start > "$SCRIPT_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
if wait_for_service 3000 "Frontend"; then
    echo ""
    print_success "✅ Frontend started successfully!"
    print_status "   🌐 Application: http://localhost:3000"
else
    print_error "❌ Frontend failed to start"
    print_status "Check logs: $SCRIPT_DIR/logs/frontend.log"
    exit 1
fi

echo ""
echo "========================================"
print_success "🎉 Crypto Wallet Application Started!"
echo "========================================"
echo ""
print_status "📱 Frontend:     http://localhost:3000"
print_status "🔧 Backend API:  http://localhost:8080/api"
print_status "🐘 PostgreSQL:   localhost:5433 (cryptowallet db)"
echo ""
print_status "Process IDs:"
print_status "  Backend PID:   $BACKEND_PID"
print_status "  Frontend PID:  $FRONTEND_PID"
echo ""
print_status "📋 Log files:"
print_status "  Backend:  $SCRIPT_DIR/logs/backend.log"
print_status "  Frontend: $SCRIPT_DIR/logs/frontend.log"
echo ""
print_warning "To stop the applications, use:"
print_warning "  kill $BACKEND_PID $FRONTEND_PID"
print_warning "Or run: pkill -f 'spring-boot:run' && pkill -f 'npm start'"
echo ""
print_status "🔍 To monitor logs in real-time:"
print_status "  Backend:  tail -f $SCRIPT_DIR/logs/backend.log"
print_status "  Frontend: tail -f $SCRIPT_DIR/logs/frontend.log"
echo ""

# Optional: Open browser automatically (uncomment if desired)
# if command -v open &> /dev/null; then
#     print_status "🌐 Opening browser..."
#     open http://localhost:3000
# elif command -v xdg-open &> /dev/null; then
#     print_status "🌐 Opening browser..."
#     xdg-open http://localhost:3000
# fi

echo "Press Ctrl+C to stop monitoring, or close this terminal."
echo "Applications will continue running in the background."
echo ""

# Keep script running to show it's active
trap 'echo ""; print_warning "Script interrupted. Applications are still running."; exit 0' INT

# Monitor the processes
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        print_error "Backend process stopped unexpectedly!"
        break
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        print_error "Frontend process stopped unexpectedly!"
        break
    fi
    
    sleep 10
done