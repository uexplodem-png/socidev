# SociDev Backend - Installation & Usage Guide

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env` file in backend_combined directory:
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=socidev
DB_PORT=3306

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 3. Setup Database (First Time Only)
```bash
npm run setup
```

This command will:
- ✅ Run all migrations (create tables)
- ✅ Run all seeders (load default data)
  - 45 permissions
  - 5 roles
  - 135 admin role mappings
  - Default email templates
  - System settings

### 4. Start Development Server
```bash
npm run dev
```

Server will start on `http://localhost:3000`

---

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with auto-reload |
| `npm run setup` | Initial database setup (migrate + seed) |
| `npm run migrate` | Run pending migrations |
| `npm run migrate:undo` | Undo last migration |
| `npm run seed` | Run all seeders |
| `npm run seed:undo` | Undo all seeders |
| `npm run db:reset` | Reset database (undo all → migrate → seed) |
| `npm run db:init` | Initialize database (migrate → seed) |
| `npm test` | Run tests |
| `npm run lint` | Check code style |
| `npm run lint:fix` | Fix code style issues |

---

## 🗄️ Database Management

### Reset Database (Clear + Reload)
```bash
npm run db:reset
```

### Only Migrations (No Seeders)
```bash
npm run migrate
```

### Only Seeders (No Migrations)
```bash
npm run seed
```

### Undo Last Migration
```bash
npm run migrate:undo
```

### Undo All Seeders
```bash
npm run seed:undo
```

---

## 📊 Default Data Loaded by Seeders

### Roles (5)
- `super_admin` - Full system access
- `admin` - Administrative access
- `moderator` - Moderation access
- `task_giver` - Can create tasks
- `task_doer` - Can execute tasks

### Permissions (45)
Grouped by category:
- User Management (6)
- Financial Operations (6)
- Task Management (5)
- Order Management (4)
- Content Management (7)
- System Management (3)
- RBAC Management (3)
- Analytics & Dashboard (2)
- Email Management (6)
- API Management (3)

### Admin Role Permissions (135)
- super_admin: 45 permissions (all)
- admin: ~30-35 permissions
- moderator: ~15-20 permissions

---

## 🔧 Troubleshooting

### "No permissions found in database"
Run seeders:
```bash
npm run seed
```

### "No roles found in database"
Run seeders:
```bash
npm run seed
```

### Database connection error
1. Check MySQL is running
2. Verify `.env` credentials
3. Ensure database exists: `CREATE DATABASE socidev;`

### Port 3000 already in use
Kill existing process:
```bash
lsof -ti:3000 | xargs kill -9
```

---

## 📚 API Documentation

Once server is running, visit:
- Swagger UI: `http://localhost:3000/api/docs`

---

## 🏗️ Project Structure

```
backend_combined/
├── config/          # Database config
├── migrations/      # Database migrations (table structures)
├── seeders/         # Database seeders (default data)
├── src/
│   ├── config/      # App configuration
│   ├── controllers/ # Route controllers
│   ├── middleware/  # Express middleware
│   ├── models/      # Sequelize models
│   ├── routes/      # API routes
│   ├── services/    # Business logic
│   ├── utils/       # Utility functions
│   └── server.js    # App entry point
└── uploads/         # File uploads
```

---

## 🔐 Security Notes

- Change default JWT_SECRET in production
- Use strong database password
- Enable HTTPS in production
- Review CORS settings for production
- Keep dependencies updated

---

## 📝 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| DB_HOST | Yes | MySQL host |
| DB_USER | Yes | MySQL username |
| DB_PASSWORD | Yes | MySQL password |
| DB_NAME | Yes | Database name |
| DB_PORT | No | MySQL port (default: 3306) |
| PORT | No | Server port (default: 3000) |
| NODE_ENV | Yes | development/production |
| JWT_SECRET | Yes | JWT signing key |
| JWT_EXPIRES_IN | No | Token expiry (default: 7d) |
| CORS_ORIGIN | Yes | Frontend URL |

---

## 🚦 Development Workflow

1. **First time setup:**
   ```bash
   npm install
   npm run setup
   npm run dev
   ```

2. **Daily development:**
   ```bash
   npm run dev
   ```

3. **After pulling new migrations:**
   ```bash
   npm run migrate
   ```

4. **Reset everything (fresh start):**
   ```bash
   npm run db:reset
   ```

---

## 📦 Production Deployment

1. Set environment to production:
   ```env
   NODE_ENV=production
   ```

2. Run database setup:
   ```bash
   npm run setup
   ```

3. Start server:
   ```bash
   npm start
   ```

Or use process manager (PM2):
```bash
pm2 start src/server.js --name socidev-backend
```

---

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Run tests: `npm test`
4. Run linter: `npm run lint:fix`
5. Create pull request

---

## 📄 License

MIT License - See LICENSE file for details
