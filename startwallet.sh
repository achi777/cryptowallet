#!/bin/bash

# Enhanced Crypto Wallet Startup Script with Admin Panel Support
# This script starts both the Spring Boot backend and React frontend with admin capabilities

echo "🚀 Starting Crypto Wallet Application with Admin Panel..."
echo "========================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

print_admin() {
    echo -e "${PURPLE}[ADMIN]${NC} $1"
}

print_feature() {
    echo -e "${CYAN}[FEATURE]${NC} $1"
}

# Parse command line arguments
DATABASE_MODE="auto"
while [[ $# -gt 0 ]]; do
    case $1 in
        --database)
            DATABASE_MODE="$2"
            shift 2
            ;;
        --h2)
            DATABASE_MODE="h2"
            shift
            ;;
        --postgres)
            DATABASE_MODE="postgres"
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --database MODE    Set database mode (auto|h2|postgres)"
            echo "  --h2              Use H2 in-memory database"
            echo "  --postgres        Use PostgreSQL database"
            echo "  --help            Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                # Auto-detect database"
            echo "  $0 --h2           # Force H2 database"
            echo "  $0 --postgres     # Force PostgreSQL"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

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

# Function to test admin API and create initial admin if needed
setup_admin_account() {
    print_admin "Setting up admin account..."
    
    # Wait a bit for the backend to be fully ready
    sleep 3
    
    # Check if admin account exists
    ADMIN_COUNT=$(curl -s http://localhost:8080/api/admin/stats/count 2>/dev/null)
    
    if [ "$ADMIN_COUNT" = "0" ]; then
        print_admin "Creating initial admin account..."
        
        ADMIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/admin/register \
            -H "Content-Type: application/json" \
            -d '{
                "username": "admin",
                "email": "admin@cryptowallet.com",
                "password": "admin123",
                "firstName": "System",
                "lastName": "Administrator",
                "role": "SUPER_ADMIN"
            }' 2>/dev/null)
        
        if echo "$ADMIN_RESPONSE" | grep -q '"success":true'; then
            print_success "✅ Initial admin account created successfully!"
            print_admin "   👤 Username: admin"
            print_admin "   🔑 Password: admin123"
            print_admin "   🛡️  Role: SUPER_ADMIN"
            print_warning "   ⚠️  Please change the default password after first login"
        else
            print_error "❌ Failed to create initial admin account"
        fi
    else
        print_success "✅ Admin account already exists (count: $ADMIN_COUNT)"
    fi
}

# Function to check database connectivity
check_database() {
    if [ "$DATABASE_MODE" = "postgres" ] || [ "$DATABASE_MODE" = "auto" ]; then
        # Check if Docker is available and PostgreSQL container exists
        if command -v docker &> /dev/null && docker info &> /dev/null 2>&1; then
            if docker ps | grep -q cryptowallet-postgres; then
                print_success "PostgreSQL container is running"
                return 0
            elif docker ps -a | grep -q cryptowallet-postgres; then
                print_status "Starting existing PostgreSQL container..."
                docker start cryptowallet-postgres
                sleep 5
                return 0
            else
                if [ "$DATABASE_MODE" = "auto" ]; then
                    print_warning "PostgreSQL not available, falling back to H2"
                    DATABASE_MODE="h2"
                    return 1
                else
                    print_error "PostgreSQL container not found"
                    return 1
                fi
            fi
        else
            if [ "$DATABASE_MODE" = "auto" ]; then
                print_warning "Docker not available, using H2 database"
                DATABASE_MODE="h2"
                return 1
            else
                print_error "Docker not available for PostgreSQL"
                return 1
            fi
        fi
    fi
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

# Determine database mode
print_status "Determining database configuration..."
check_database

if [ "$DATABASE_MODE" = "h2" ]; then
    print_status "🗄️  Using H2 in-memory database"
    SPRING_PROFILE="h2"
    DB_INFO="H2 Console: http://localhost:8080/h2-console"
else
    print_status "🐘 Using PostgreSQL database"
    SPRING_PROFILE="default"
    DB_INFO="PostgreSQL: localhost:5433 (cryptowallet db)"
fi

# Stop any existing processes
print_status "Checking for existing processes..."
kill_port_processes 8080 "Backend"
kill_port_processes 3000 "Frontend"

# Start PostgreSQL if needed
if [ "$DATABASE_MODE" = "postgres" ]; then
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
        print_status "Falling back to H2 database..."
        DATABASE_MODE="h2"
        SPRING_PROFILE="h2"
        DB_INFO="H2 Console: http://localhost:8080/h2-console"
    fi
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

# Start backend in background with appropriate profile
if [ "$SPRING_PROFILE" = "h2" ]; then
    nohup $MAVEN_CMD spring-boot:run -Dspring-boot.run.profiles=h2 > "$SCRIPT_DIR/logs/backend.log" 2>&1 &
else
    nohup $MAVEN_CMD spring-boot:run > "$SCRIPT_DIR/logs/backend.log" 2>&1 &
fi
BACKEND_PID=$!

# Wait for backend to start
if wait_for_service 8080 "Backend"; then
    echo ""
    print_success "✅ Backend started successfully!"
    print_status "   📍 API: http://localhost:8080/api"
    if [ "$DATABASE_MODE" = "h2" ]; then
        print_status "   🗄️  Database Console: http://localhost:8080/h2-console"
    fi
else
    print_error "❌ Backend failed to start"
    print_status "Check logs: $SCRIPT_DIR/logs/backend.log"
    exit 1
fi

# Setup admin account
setup_admin_account

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
echo "========================================================"
print_success "🎉 Crypto Wallet Application with Admin Panel Started!"
echo "========================================================"
echo ""
print_feature "📱 User Application:    http://localhost:3000"
print_feature "🛡️  Admin Panel:        Access via admin login on main app"
print_feature "🔧 Backend API:         http://localhost:8080/api"
print_feature "$DB_INFO"
echo ""
print_admin "🛡️  ADMIN PANEL ACCESS:"
print_admin "   📍 Login URL:        http://localhost:3000"
print_admin "   👤 Admin Username:   admin"
print_admin "   🔑 Admin Password:   admin123"
print_admin "   🛡️  Admin Role:       SUPER_ADMIN"
echo ""
print_feature "🌟 ADMIN PANEL FEATURES:"
print_feature "   📊 System Dashboard  - Real-time statistics and analytics"
print_feature "   👥 User Management   - Complete user administration"
print_feature "   💼 Wallet Management - Multi-currency wallet control"
print_feature "   📈 Transaction Monitor - Full transaction oversight"
print_feature "   ⚙️  Admin Settings   - Profile and admin account management"
echo ""
print_status "Process IDs:"
print_status "  Backend PID:   $BACKEND_PID"
print_status "  Frontend PID:  $FRONTEND_PID"
echo ""
print_status "📋 Log files:"
print_status "  Backend:  $SCRIPT_DIR/logs/backend.log"
print_status "  Frontend: $SCRIPT_DIR/logs/frontend.log"
echo ""
print_warning "To stop the applications, run:"
print_warning "  ./stopwallet.sh"
print_warning "Or manually: kill $BACKEND_PID $FRONTEND_PID"
echo ""
print_status "🔍 To monitor logs in real-time:"
print_status "  Backend:  tail -f $SCRIPT_DIR/logs/backend.log"
print_status "  Frontend: tail -f $SCRIPT_DIR/logs/frontend.log"
echo ""
print_admin "🔐 SECURITY NOTES:"
print_admin "   • Change default admin password after first login"
print_admin "   • Admin panel has role-based access control"
print_admin "   • This is a development setup - secure before production"
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