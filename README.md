# 💰 Crypto Wallet Application

A full-stack cryptocurrency wallet application built with **Java 21 + Spring Boot** backend and **React + TypeScript** frontend, featuring Bitcoin and USDT (TRC-20) wallet management.

## 🚀 Quick Start

### Prerequisites

Before running the application, ensure you have the following installed:

- **Java 21** or later
- **Maven 3.6+**
- **Node.js 16+** and **npm**
- **Git** (optional, for cloning)

### 🎯 One-Command Startup

```bash
# Start both backend and frontend
./startwallet.sh

# Stop both services
./stopwallet.sh
```

### 📋 Manual Setup (Alternative)

If you prefer to run services manually:

#### Backend (Spring Boot)
```bash
cd backend
mvn spring-boot:run
```

#### Frontend (React)
```bash
cd frontend
npm install  # First time only
npm start
```

## 🌐 Application URLs

Once started, access the application at:

- **🖥️ Main Application**: http://localhost:3000
- **🔧 Backend API**: http://localhost:8080/api
- **🗄️ Database Console**: http://localhost:8080/h2-console
  - JDBC URL: `jdbc:h2:mem:testdb`
  - Username: `sa`
  - Password: (leave empty)

## 📱 Features

### 🔐 Authentication
- **User Registration**: Create new accounts with secure password hashing
- **Login System**: Secure authentication with session management
- **Auto-Login**: Remember user sessions between visits

### 💼 Wallet Management
- **Multi-Currency Support**: Bitcoin (BTC) and USDT (TRC-20)
- **Wallet Creation**: Generate secure wallets with private keys
- **Balance Tracking**: Real-time balance updates
- **Address Management**: Secure address generation

### 💸 Transactions
- **Send Crypto**: Transfer Bitcoin and USDT to any address
- **Transaction History**: Complete transaction log with status tracking
- **Fee Calculation**: Automatic fee estimation
- **Transaction Status**: Pending, Confirmed, Failed states

### 📱 Mobile-Responsive Design
- **Mobile-First**: Optimized for all screen sizes
- **Touch-Friendly**: Large buttons and intuitive gestures
- **Modern UI**: Glass morphism design with smooth animations
- **Responsive Navigation**: Adaptive navigation for all devices

## 🛠️ Technology Stack

### Backend
- **Java 21** - Latest LTS version
- **Spring Boot 3.2** - Application framework
- **Spring Data JPA** - Database abstraction
- **Spring Security** - Authentication & authorization
- **H2 Database** - In-memory database for development
- **Lombok** - Reduce boilerplate code
- **Maven** - Dependency management

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Modern CSS** - Custom responsive design
- **Axios** - HTTP client
- **Local Storage** - Session persistence

### Crypto Libraries
- **BitcoinJ** - Bitcoin operations
- **Web3j** - Ethereum/Tron operations

## 📂 Project Structure

```
cryptowallet/
├── backend/                 # Spring Boot application
│   ├── src/main/java/
│   │   └── com/cryptowallet/
│   │       ├── controller/  # REST controllers
│   │       ├── service/     # Business logic
│   │       ├── repository/  # Data access
│   │       ├── entity/      # JPA entities
│   │       ├── dto/         # Data transfer objects
│   │       └── config/      # Configuration
│   ├── src/main/resources/
│   │   └── application.yml  # Application configuration
│   └── pom.xml             # Maven dependencies
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript types
│   │   └── styles/          # CSS styles
│   ├── public/              # Static assets
│   └── package.json         # npm dependencies
├── logs/                    # Application logs
├── startwallet.sh          # Startup script
├── stopwallet.sh           # Stop script
└── README.md               # This file
```

## 🔧 Scripts Documentation

### startwallet.sh
**Comprehensive startup script that:**
- ✅ Checks all prerequisites (Java, Maven, Node.js, npm)
- 🔄 Stops any existing instances on ports 3000 and 8080
- 🚀 Starts backend and frontend in correct order
- ⏱️ Waits for services to be ready before proceeding
- 📊 Shows real-time startup progress
- 📝 Creates detailed logs in `logs/` directory
- 🎯 Provides all necessary URLs and information

### stopwallet.sh
**Clean shutdown script that:**
- 🛑 Gracefully stops all services
- 🧹 Cleans up hanging processes
- ✅ Verifies all services are stopped
- 📋 Provides manual cleanup commands if needed

## 🔐 API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login

### Users
- `GET /api/users/{id}` - Get user by ID
- `GET /api/users/username/{username}` - Get user by username
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Wallets
- `POST /api/wallets/user/{userId}` - Create wallet
- `GET /api/wallets/user/{userId}` - Get user wallets
- `GET /api/wallets/{walletId}` - Get wallet by ID
- `POST /api/wallets/{walletId}/refresh-balance` - Refresh balance

### Transactions
- `POST /api/transactions/send` - Send transaction
- `GET /api/transactions/wallet/{walletId}` - Get wallet transactions
- `GET /api/transactions/user/{userId}` - Get user transactions
- `GET /api/transactions/hash/{txHash}` - Get transaction by hash

## 🚀 Development

### Running in Development Mode

1. **Start Backend in Development Mode:**
   ```bash
   cd backend
   mvn spring-boot:run -Dspring-boot.run.profiles=dev
   ```

2. **Start Frontend in Development Mode:**
   ```bash
   cd frontend
   npm start
   ```

### Building for Production

1. **Build Backend:**
   ```bash
   cd backend
   mvn clean package
   java -jar target/crypto-wallet-backend-0.0.1-SNAPSHOT.jar
   ```

2. **Build Frontend:**
   ```bash
   cd frontend
   npm run build
   # Serve the build directory with a static server
   ```

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use:**
   ```bash
   # Kill processes on specific ports
   lsof -ti:8080 | xargs kill -9
   lsof -ti:3000 | xargs kill -9
   ```

2. **Java Version Issues:**
   ```bash
   # Check Java version
   java -version
   # Should be 21 or later
   ```

3. **Maven Issues:**
   ```bash
   # Clean and reinstall dependencies
   cd backend
   mvn clean install
   ```

4. **Node.js Issues:**
   ```bash
   # Clear npm cache and reinstall
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

### Log Files

Check the log files for detailed error information:
- **Backend**: `logs/backend.log`
- **Frontend**: `logs/frontend.log`

### Real-time Log Monitoring

```bash
# Monitor backend logs
tail -f logs/backend.log

# Monitor frontend logs  
tail -f logs/frontend.log
```

## 🔒 Security Notes

- This is a **development application** with placeholder crypto implementations
- **Do not use in production** without implementing real blockchain integrations
- Private keys are stored in plain text for development purposes
- Always use HTTPS in production environments

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the log files in the `logs/` directory
2. Ensure all prerequisites are installed
3. Try running `./stopwallet.sh` then `./startwallet.sh`
4. Check if ports 3000 and 8080 are available

---

**Happy Trading! 🚀💰**