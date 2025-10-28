# SociDev - Social Media Management Platform

A comprehensive full-stack social media management platform with advanced security features, task management, and RBAC (Role-Based Access Control).

## 🚀 Features

- **Multi-Platform Support**: Instagram, YouTube, TikTok, Facebook, X (Twitter)
- **Task Management**: Create, assign, and track social media tasks
- **Order System**: Place orders for social media services
- **Balance Management**: Deposits, withdrawals, and transaction tracking
- **RBAC**: Role-based access control with mode-specific permissions
- **Security**: 2FA, email verification, account lockout, rate limiting
- **Admin Panel**: Comprehensive admin dashboard with settings management
- **Audit Logs**: Track all admin actions and user activities
- **Feature Flags**: Enable/disable modules dynamically
- **Maintenance Mode**: Put system in maintenance with admin bypass

## 📋 Tech Stack

### Backend
- Node.js + Express
- Sequelize ORM
- MySQL/MariaDB
- JWT Authentication
- Bcrypt password hashing
- Speakeasy (TOTP 2FA)

### Frontend
- React + TypeScript
- Vite
- TanStack Query
- React Router
- Tailwind CSS
- Dark mode support

### Admin Panel
- React + TypeScript
- Vite
- TanStack Table
- i18n support (EN/TR)

## 🔧 Installation

### Prerequisites
- Node.js 18+ 
- MySQL/MariaDB
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend_combined
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your production settings
```

**IMPORTANT**: Change these in .env:
- `JWT_SECRET` - Use a strong random secret (minimum 32 characters)
- `DB_PASSWORD` - Your database password
- `DB_HOST` - Your database host
- `CORS_ORIGIN` - Your production domain
- `NODE_ENV=production`

4. Run database migrations:
```bash
npm run migrate
```

5. (Optional) Seed initial data:
```bash
npm run seed
```

6. Start the server:
```bash
npm start
```

Backend runs on `http://localhost:3000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
# Create .env file
echo "VITE_API_URL=https://api.yourdomain.com" > .env
```

4. Build for production:
```bash
npm run build
```

5. Deploy the `dist` folder to your hosting service

### Admin Panel Setup

1. Navigate to admin-panel directory:
```bash
cd admin-panel
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
# Create .env file
echo "VITE_API_URL=https://api.yourdomain.com" > .env
```

4. Build for production:
```bash
npm run build
```

5. Deploy the `dist` folder to your hosting service

## 🔒 Security Checklist

Before going live:

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Change `SESSION_SECRET` to a strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Use strong database password
- [ ] Configure CORS to your production domain only
- [ ] Enable HTTPS (SSL/TLS certificates)
- [ ] Set up database backups
- [ ] Configure email SMTP for verification emails
- [ ] Review and set feature flags via admin panel
- [ ] Create admin accounts with strong passwords
- [ ] Enable 2FA for all admin accounts
- [ ] Review RBAC roles and permissions
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting settings
- [ ] Review password policy settings
- [ ] Test maintenance mode

## 👤 Default Admin Account

After seeding, default admin credentials:
- Email: `admin@example.com`
- Password: `Admin123!`

**⚠️ CHANGE THESE IMMEDIATELY AFTER FIRST LOGIN!**

## 📖 System Settings

Access admin panel → Settings to configure:

### General
- Site name
- Maintenance mode
- Registration settings
- Task and withdrawal limits

### Feature Flags
- Enable/disable: Orders, Tasks, Transactions, Users modules
- Granular control per feature

### Access Control (RBAC)
- Manage roles and permissions
- Mode-specific permissions (task_giver, task_completer)

### Modes
- Task Giver: Email verification, minimum balance requirements
- Task Completer: Verification and completion rate settings

### Security
- Authentication: Email verification, 2FA enforcement
- Account Protection: Login attempts, lockout duration
- Password Policy: Length, complexity requirements

## 📊 Database Schema

### Core Tables
- `users` - User accounts with authentication
- `orders` - Service orders
- `tasks` - Task assignments
- `transactions` - Financial transactions
- `withdrawals` - Withdrawal requests

### Security Tables
- `audit_logs` - Admin action tracking
- `action_logs` - User activity tracking
- `sessions` - User sessions
- `devices` - Trusted devices

### RBAC Tables
- `roles` - Role definitions
- `permissions` - Permission definitions
- `user_roles` - User-role assignments
- `role_permissions` - Role-permission mappings

### Platform Tables
- `platforms` - Social media platforms
- `services` - Available services per platform
- `social_accounts` - User social media accounts

### Settings Table
- `system_settings` - All system configuration (JSON)

## 🔗 API Endpoints

### Public Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/settings/public` - Public settings

### User Endpoints (Authenticated)
- `GET /api/orders` - User orders
- `GET /api/tasks/available` - Available tasks
- `POST /api/balance/deposit` - Add balance
- `POST /api/balance/withdraw` - Withdraw balance
- `GET /api/settings/features` - Feature flags

### Admin Endpoints (Admin Role Required)
- `GET /api/admin/users` - User management
- `GET /api/admin/audit-logs` - Audit logs
- `GET /api/admin/settings` - System settings
- `PUT /api/admin/settings` - Update settings
- `GET /api/admin/rbac/roles` - RBAC management

## 📈 Monitoring

### Logs Location
- Backend logs: `backend_combined/logs/`
- Error logs: `backend_combined/logs/error.log`
- Combined logs: `backend_combined/logs/combined.log`

### Metrics to Monitor
- Failed login attempts
- Account lockouts
- API response times
- Database query performance
- Rate limit hits
- Error rates

## 🐛 Troubleshooting

### Database Connection Issues
Check `.env` configuration and ensure MySQL is running

### CORS Errors
Update `CORS_ORIGIN` in `.env` to match your frontend domain

### JWT Errors
Ensure `JWT_SECRET` is set and consistent across restarts

### Migration Errors
Run migrations in order: `npm run migrate`

## 📝 License

Proprietary - All rights reserved

## 🤝 Support

For support, contact: support@yourdomain.com

## 🔄 Updates

Check GitHub repository for latest updates and security patches:
https://github.com/uexplodem-png/socidev

---

**Version**: 1.0.0  
**Last Updated**: October 28, 2025  
**Status**: Production Ready ✅
