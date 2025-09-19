# 🛡️ Crypto Wallet Admin Panel

A comprehensive administrative dashboard for managing the crypto wallet application with full CRUD operations, analytics, and monitoring capabilities.

## 🌟 Features

### 🔐 Admin Authentication
- **Secure Login**: Role-based authentication system
- **Admin Roles**: Super Admin, Admin, Moderator, Support
- **Session Management**: Persistent login sessions
- **Password Security**: Encrypted password storage

### 📊 Dashboard & Analytics
- **System Overview**: Real-time statistics and metrics
- **User Analytics**: Registration trends and active users
- **Wallet Statistics**: Multi-currency wallet tracking
- **Transaction Monitoring**: Volume and status analytics
- **Performance Metrics**: System health indicators

### 👥 User Management
- **User Directory**: Complete user listing with search
- **User Details**: Comprehensive user information
- **Status Control**: Activate/deactivate user accounts
- **Activity Tracking**: User registration and activity logs
- **Advanced Search**: Filter by status, date, and more

### 💼 Wallet Management
- **Wallet Overview**: All wallets across the platform
- **Multi-Currency**: Bitcoin and USDT (TRC-20) support
- **Balance Monitoring**: Real-time balance tracking
- **Status Management**: Activate/deactivate wallets
- **Balance Refresh**: Manual balance synchronization
- **Address Tracking**: Complete wallet address management

### 📈 Transaction Monitoring
- **Transaction Log**: Complete transaction history
- **Status Tracking**: Pending, confirmed, failed transactions
- **Transaction Details**: Hash, addresses, amounts, fees
- **Real-time Updates**: Live transaction monitoring
- **Advanced Filtering**: By status, type, date, amount
- **Export Capabilities**: Transaction data export

### ⚙️ Admin Settings
- **Profile Management**: Update admin profiles
- **Password Changes**: Secure password updates
- **Admin Creation**: Create new administrative accounts
- **Role Management**: Assign and modify admin roles
- **Account Information**: Complete admin account details

## 🏗️ Technical Architecture

### Backend Components

#### Entities
- `Admin` - Administrative user accounts
- Enhanced `User`, `Wallet`, `Transaction` repositories

#### Services
- `AdminService` - Admin account management
- `AdminStatsService` - System analytics and statistics
- Enhanced existing services with admin capabilities

#### Controllers
- `AdminController` - Admin authentication and management
- `AdminDashboardController` - Dashboard data and operations

#### Security
- Role-based access control
- Password encryption
- Session management
- API endpoint protection

### Frontend Components

#### Authentication
- `AdminLogin` - Secure admin login interface
- Session persistence and management

#### Dashboard
- `AdminDashboard` - Main administrative interface
- `AdminStats` - System statistics and analytics
- Navigation and routing system

#### Management Interfaces
- `UserManagement` - User administration
- `WalletManagement` - Wallet administration
- `TransactionManagement` - Transaction monitoring
- `AdminSettings` - Admin configuration

#### Features
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Live data refresh
- **Advanced Search**: Multi-field search capabilities
- **Pagination**: Efficient data browsing
- **Sorting**: Flexible data sorting options
- **Filtering**: Advanced filtering system

## 🚀 Getting Started

### Prerequisites
- Java 21+ with Spring Boot backend running
- Node.js 16+ with React frontend
- PostgreSQL database
- All main application components installed

### Admin Panel Setup

1. **Start the Backend**:
   ```bash
   cd backend
   mvn spring-boot:run
   ```

2. **Start the Frontend**:
   ```bash
   cd frontend
   npm start
   ```

3. **Access Admin Panel**:
   - Main App: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin (when implemented with routing)

### Initial Admin Account

Create the first admin account through the database or API:

```sql
INSERT INTO admins (username, email, password, first_name, last_name, role, active, created_at, updated_at)
VALUES ('admin', 'admin@cryptowallet.com', '$2a$10$encoded_password', 'System', 'Administrator', 'SUPER_ADMIN', true, NOW(), NOW());
```

Or use the registration endpoint:
```bash
curl -X POST http://localhost:8080/api/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@cryptowallet.com",
    "password": "securepassword123",
    "firstName": "System",
    "lastName": "Administrator",
    "role": "SUPER_ADMIN"
  }'
```

## 📋 Admin Roles & Permissions

### 🔱 Super Admin
- Full system access
- Create/manage other admins
- System configuration
- All user and transaction operations

### 👨‍💼 Admin
- User management
- Wallet management
- Transaction monitoring
- System statistics access

### 🛡️ Moderator
- User account management
- Transaction monitoring
- Limited administrative functions

### 🎧 Support
- Read-only access
- User support functions
- Transaction inquiry access

## 🔧 API Endpoints

### Admin Authentication
- `POST /api/admin/login` - Admin login
- `POST /api/admin/register` - Create admin account
- `GET /api/admin/{id}` - Get admin details
- `PUT /api/admin/{id}` - Update admin
- `DELETE /api/admin/{id}` - Delete admin

### Dashboard & Analytics
- `GET /api/admin/dashboard/stats` - System statistics
- `GET /api/admin/dashboard/analytics/*` - Various analytics endpoints

### User Management
- `GET /api/admin/dashboard/users` - List users
- `GET /api/admin/dashboard/users/search` - Search users
- `PUT /api/admin/dashboard/users/{id}/toggle-status` - Toggle user status

### Wallet Management
- `GET /api/admin/dashboard/wallets` - List wallets
- `POST /api/admin/dashboard/wallets/{id}/refresh-balance` - Refresh balance
- `PUT /api/admin/dashboard/wallets/{id}/toggle-status` - Toggle wallet status

### Transaction Management
- `GET /api/admin/dashboard/transactions` - List transactions
- `GET /api/admin/dashboard/transactions/pending` - Pending transactions
- `GET /api/admin/dashboard/transactions/search` - Search transactions

## 📊 Statistics & Monitoring

### System Metrics
- Total users and active users
- Wallet counts by currency
- Transaction volumes and counts
- Daily registration and activity stats

### Real-time Monitoring
- Pending transaction queue
- System health indicators
- Failure rate monitoring
- Performance metrics

### Analytics
- User registration trends
- Transaction volume analysis
- Currency-specific statistics
- Time-based analytics

## 🔒 Security Features

### Authentication
- Secure password hashing
- Session management
- Role-based access control
- Login attempt monitoring

### Authorization
- Endpoint-level permissions
- Role-based feature access
- Action logging and auditing
- Secure admin operations

### Data Protection
- Input validation
- SQL injection prevention
- XSS protection
- CSRF protection

## 🎨 User Interface

### Design Features
- Modern, responsive design
- Intuitive navigation
- Real-time data updates
- Mobile-optimized interface

### User Experience
- Advanced search and filtering
- Efficient pagination
- Sortable data tables
- Quick action buttons
- Status indicators

## 📈 Performance & Scalability

### Optimization
- Efficient database queries
- Pagination for large datasets
- Optimized API endpoints
- Frontend performance optimization

### Monitoring
- Real-time statistics
- Performance metrics
- System health monitoring
- Error tracking and logging

## 🛠️ Development & Customization

### Adding New Features
1. Create backend entity/service/controller
2. Add corresponding API endpoints
3. Implement frontend components
4. Update routing and navigation

### Customizing the Interface
- Modify component styles in `/styles/admin.css`
- Update dashboard layouts
- Add new statistics and metrics
- Customize user workflows

## 📞 Support & Maintenance

### Monitoring
- Check system statistics regularly
- Monitor pending transactions
- Review user activity logs
- Maintain admin accounts

### Updates
- Regular security updates
- Feature enhancements
- Performance optimizations
- Bug fixes and improvements

---

**🔐 Admin Panel**: Comprehensive administrative control for the Crypto Wallet platform with enterprise-grade features and security.