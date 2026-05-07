#!/bin/bash
# start.sh — single host-mode entry point for the dev workstation flow.
# Container-mode startup is handled by the Dockerfile entrypoint (java -jar /app/app.jar).
#
# Replaces the previously duplicated startwallet.sh + startwallet-admin.sh pair —
# both scripts were ~95% identical (same color helpers, same DB selection, same wait loop).
# The legacy filenames remain as thin shims that exec this script for backward compat.

set -u

echo "🚀 Starting Crypto Wallet Application..."
echo "========================================================"

# --- Colors --------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

print_status()  { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error()   { echo -e "${RED}[ERROR]${NC} $1"; }
print_admin()   { echo -e "${PURPLE}[ADMIN]${NC} $1"; }
print_feature() { echo -e "${CYAN}[FEATURE]${NC} $1"; }

# --- Args ----------------------------------------------------------------
DATABASE_MODE="auto"
WITH_ADMIN_BOOTSTRAP=true   # both legacy scripts always provisioned admin; keep that default

usage() {
    cat <<EOF
Usage: $0 [OPTIONS]

Options:
  --database MODE    Set database mode (auto|h2|postgres)
  --h2               Force H2 in-memory database
  --postgres         Force PostgreSQL (requires Docker)
  --no-admin         Skip the initial admin-account bootstrap
  --help             Show this help

Examples:
  $0                 # Auto-detect database, bootstrap admin
  $0 --h2            # Force H2 database
  $0 --postgres      # Force PostgreSQL
EOF
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --database)  DATABASE_MODE="$2"; shift 2 ;;
        --h2)        DATABASE_MODE="h2"; shift ;;
        --postgres)  DATABASE_MODE="postgres"; shift ;;
        --no-admin)  WITH_ADMIN_BOOTSTRAP=false; shift ;;
        --help|-h)   usage; exit 0 ;;
        *)           print_error "Unknown option: $1"; usage; exit 1 ;;
    esac
done

# --- Helpers -------------------------------------------------------------
check_port() {
    lsof -Pi :"$1" -sTCP:LISTEN -t >/dev/null 2>&1
}

kill_port_processes() {
    local port=$1 service_name=$2
    if check_port "$port"; then
        print_warning "$service_name is already running on port $port. Stopping existing process..."
        lsof -ti:"$port" | xargs kill -9 2>/dev/null
        sleep 2
        if check_port "$port"; then
            print_error "Failed to stop existing $service_name process on port $port"
            return 1
        fi
        print_success "Stopped existing $service_name process"
    fi
}

wait_for_service() {
    local port=$1 service_name=$2 max_attempts=30 attempt=1
    print_status "Waiting for $service_name to start on port $port..."
    while [ $attempt -le $max_attempts ]; do
        if check_port "$port"; then
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

setup_admin_account() {
    [ "$WITH_ADMIN_BOOTSTRAP" = "true" ] || { print_status "Skipping admin bootstrap (--no-admin)"; return 0; }
    print_admin "Setting up admin account..."
    sleep 3

    local admin_count
    admin_count=$(curl -s http://localhost:8080/api/admin/stats/count 2>/dev/null)

    if [ "$admin_count" = "0" ]; then
        print_admin "Creating initial admin account..."
        local response
        response=$(curl -s -X POST http://localhost:8080/api/admin/register \
            -H "Content-Type: application/json" \
            -d '{
                "username": "admin",
                "email": "admin@cryptowallet.com",
                "password": "admin123",
                "firstName": "System",
                "lastName": "Administrator",
                "role": "SUPER_ADMIN"
            }' 2>/dev/null)
        if echo "$response" | grep -q '"success":true'; then
            print_success "✅ Initial admin account created!"
            print_admin "   👤 Username: admin"
            print_admin "   🔑 Password: admin123"
            print_admin "   🛡️  Role: SUPER_ADMIN"
            print_warning "   ⚠️  Change the default password after first login"
        else
            print_error "❌ Failed to create initial admin account"
        fi
    else
        print_success "✅ Admin account already exists (count: $admin_count)"
    fi
}

check_database() {
    if [ "$DATABASE_MODE" = "postgres" ] || [ "$DATABASE_MODE" = "auto" ]; then
        if command -v docker &> /dev/null && docker info &> /dev/null 2>&1; then
            if docker ps | grep -q cryptowallet-postgres; then
                print_success "PostgreSQL container is running"
                return 0
            elif docker ps -a | grep -q cryptowallet-postgres; then
                print_status "Starting existing PostgreSQL container..."
                docker start cryptowallet-postgres
                sleep 5
                return 0
            elif [ "$DATABASE_MODE" = "auto" ]; then
                print_warning "PostgreSQL not available, falling back to H2"
                DATABASE_MODE="h2"
                return 1
            else
                print_error "PostgreSQL container not found"
                return 1
            fi
        elif [ "$DATABASE_MODE" = "auto" ]; then
            print_warning "Docker not available, using H2 database"
            DATABASE_MODE="h2"
            return 1
        else
            print_error "Docker not available for PostgreSQL"
            return 1
        fi
    fi
    return 1
}

# --- Pre-flight ----------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

[ -d "$BACKEND_DIR" ]  || { print_error "Backend directory not found: $BACKEND_DIR"; exit 1; }
[ -d "$FRONTEND_DIR" ] || { print_error "Frontend directory not found: $FRONTEND_DIR"; exit 1; }

print_status "Checking prerequisites..."
for cmd in java mvn node npm; do
    if ! command -v "$cmd" &> /dev/null; then
        print_error "$cmd is not installed or not in PATH"
        exit 1
    fi
done

# --- DB selection --------------------------------------------------------
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

# --- Stop stale processes ------------------------------------------------
print_status "Checking for existing processes..."
kill_port_processes 8080 "Backend"
kill_port_processes 3000 "Frontend"

# --- Start postgres if needed --------------------------------------------
if [ "$DATABASE_MODE" = "postgres" ]; then
    print_status "🐘 Starting PostgreSQL database..."
    if command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d postgres
    else
        docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d postgres
    fi

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
        print_error "❌ PostgreSQL failed to start within 60 seconds — falling back to H2"
        DATABASE_MODE="h2"
        SPRING_PROFILE="h2"
        DB_INFO="H2 Console: http://localhost:8080/h2-console"
    fi
fi

echo ""
mkdir -p "$SCRIPT_DIR/logs"
print_status "Starting services..."
echo ""

# --- Backend -------------------------------------------------------------
print_status "🔧 Starting Spring Boot Backend with $DATABASE_MODE database..."
cd "$BACKEND_DIR"
MAVEN_CMD=$([ -f "./mvnw" ] && echo "./mvnw" || echo "mvn")

if [ "$SPRING_PROFILE" = "h2" ]; then
    nohup $MAVEN_CMD spring-boot:run -Dspring-boot.run.profiles=h2 > "$SCRIPT_DIR/logs/backend.log" 2>&1 &
else
    nohup $MAVEN_CMD spring-boot:run > "$SCRIPT_DIR/logs/backend.log" 2>&1 &
fi
BACKEND_PID=$!

if wait_for_service 8080 "Backend"; then
    echo ""
    print_success "✅ Backend started successfully!"
    print_status "   📍 API: http://localhost:8080/api"
    [ "$DATABASE_MODE" = "h2" ] && print_status "   🗄️  Database Console: http://localhost:8080/h2-console"
else
    print_error "❌ Backend failed to start — check $SCRIPT_DIR/logs/backend.log"
    exit 1
fi

setup_admin_account
echo ""

# --- Frontend ------------------------------------------------------------
print_status "⚛️  Starting React Frontend..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    if ! npm install; then
        print_error "Failed to install frontend dependencies"
        exit 1
    fi
fi

nohup npm start > "$SCRIPT_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!

if wait_for_service 3000 "Frontend"; then
    echo ""
    print_success "✅ Frontend started successfully!"
    print_status "   🌐 Application: http://localhost:3000"
else
    print_error "❌ Frontend failed to start — check $SCRIPT_DIR/logs/frontend.log"
    exit 1
fi

# --- Banner --------------------------------------------------------------
echo ""
echo "========================================================"
print_success "🎉 Crypto Wallet Application Started!"
echo "========================================================"
echo ""
print_feature "📱 User Application:    http://localhost:3000"
print_feature "🛡️  Admin Panel:        Access via admin login on main app"
print_feature "🔧 Backend API:         http://localhost:8080/api"
print_feature "$DB_INFO"
echo ""
if [ "$WITH_ADMIN_BOOTSTRAP" = "true" ]; then
    print_admin "🛡️  ADMIN PANEL ACCESS:"
    print_admin "   👤 Admin Username:   admin"
    print_admin "   🔑 Admin Password:   admin123"
    print_admin "   🛡️  Admin Role:       SUPER_ADMIN"
    echo ""
fi
print_status "Process IDs:  Backend=$BACKEND_PID  Frontend=$FRONTEND_PID"
print_status "Logs:         $SCRIPT_DIR/logs/{backend,frontend}.log"
echo ""
print_warning "To stop: ./stopwallet.sh"
echo ""

trap 'echo ""; print_warning "Script interrupted. Applications still running."; exit 0' INT

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
