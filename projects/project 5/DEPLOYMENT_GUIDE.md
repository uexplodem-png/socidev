# Production Deployment Guide

## 🚀 Pre-Deployment Checklist

### 1. Environment Configuration ✅

**Backend (.env)**
```bash
NODE_ENV=production
DB_DIALECT=mysql
DB_HOST=your-production-database-host
DB_USERNAME=your-production-username
DB_PASSWORD=STRONG-PASSWORD-HERE
DB_NAME=socidev_production
JWT_SECRET=CHANGE-TO-STRONG-RANDOM-SECRET-MIN-32-CHARS
CORS_ORIGIN=https://yourdomain.com
PORT=3000
BCRYPT_SALT_ROUNDS=12
LOG_LEVEL=error
```

**Frontend (.env)**
```bash
VITE_API_URL=https://api.yourdomain.com
```

**Admin Panel (.env)**
```bash
VITE_API_URL=https://api.yourdomain.com
```

### 2. Security Hardening ✅

- [ ] Generate strong JWT_SECRET: `openssl rand -base64 32`
- [ ] Generate strong SESSION_SECRET: `openssl rand -base64 32`
- [ ] Use strong database password
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure firewall rules (allow only 80, 443, 3306)
- [ ] Set up fail2ban for SSH protection
- [ ] Disable root login via SSH
- [ ] Configure database to allow only localhost connections

### 3. Database Setup ✅

```bash
# Create production database
mysql -u root -p
CREATE DATABASE socidev_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'socidev_user'@'localhost' IDENTIFIED BY 'STRONG-PASSWORD';
GRANT ALL PRIVILEGES ON socidev_production.* TO 'socidev_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Run migrations
cd backend_combined
npm run migrate
```

### 4. Build Applications ✅

```bash
# Backend - No build needed (Node.js)
cd backend_combined
npm install --production

# Frontend
cd frontend
npm install
npm run build
# Deploy dist/ folder

# Admin Panel
cd admin-panel
npm install
npm run build
# Deploy dist/ folder
```

---

## 🌐 Deployment Options

### Option 1: VPS (DigitalOcean, Linode, AWS EC2)

#### A. Backend Deployment with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start backend
cd backend_combined
pm2 start npm --name "socidev-backend" -- start

# Configure PM2 to start on boot
pm2 startup
pm2 save

# Monitor logs
pm2 logs socidev-backend
```

#### B. Nginx Configuration

```nginx
# /etc/nginx/sites-available/socidev-api
server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
    limit_req zone=api_limit burst=20 nodelay;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    root /var/www/socidev-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Admin Panel
server {
    listen 443 ssl http2;
    server_name admin.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/admin.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.yourdomain.com/privkey.pem;

    root /var/www/socidev-admin;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable sites:
```bash
sudo ln -s /etc/nginx/sites-available/socidev-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### C. SSL Certificates (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificates
sudo certbot --nginx -d api.yourdomain.com
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo certbot --nginx -d admin.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Option 2: Docker Deployment

#### docker-compose.yml

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: socidev-mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: socidev_production
      MYSQL_USER: socidev_user
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped
    networks:
      - socidev-network

  backend:
    build: ./backend_combined
    container_name: socidev-backend
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USERNAME: socidev_user
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: socidev_production
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - mysql
    restart: unless-stopped
    networks:
      - socidev-network

  frontend:
    build: ./frontend
    container_name: socidev-frontend
    ports:
      - "5174:80"
    restart: unless-stopped

  admin:
    build: ./admin-panel
    container_name: socidev-admin
    ports:
      - "5173:80"
    restart: unless-stopped

volumes:
  mysql_data:

networks:
  socidev-network:
    driver: bridge
```

---

## 📊 Post-Deployment Tasks

### 1. Database Optimization

```sql
-- Add indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_action_logs_created_at ON action_logs(created_at DESC);
CREATE INDEX idx_orders_user_id ON orders(user_id, created_at DESC);
CREATE INDEX idx_tasks_user_id ON tasks(user_id, status);
CREATE INDEX idx_transactions_user_id ON transactions(user_id, created_at DESC);

-- Optimize tables
OPTIMIZE TABLE users, orders, tasks, transactions, audit_logs, action_logs;
```

### 2. Create Admin Account

```bash
# Via API or directly in database
curl -X POST https://api.yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "STRONG-PASSWORD",
    "firstName": "Admin",
    "lastName": "User"
  }'

# Then manually update role in database
UPDATE user_roles SET role_id = 1 WHERE user_id = 1;
```

### 3. Configure System Settings

Login to admin panel and configure:

1. **General Settings**
   - Set site name
   - Configure limits (tasks, withdrawals)

2. **Feature Flags**
   - Enable/disable modules as needed
   - Test each module

3. **Security Settings**
   - Set max login attempts: 5
   - Set lockout duration: 30 minutes
   - Configure password policy
   - Enable 2FA enforcement for admins

4. **Modes Settings**
   - Set task giver requirements
   - Set minimum balance if needed

### 4. Monitoring Setup

#### A. Application Monitoring

```bash
# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Install monitoring dashboard
pm2 install pm2-server-monit
```

#### B. Database Monitoring

```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow-query.log';
```

#### C. Disk Space Monitoring

```bash
# Add to crontab
0 * * * * df -h | mail -s "Disk Space Report" admin@yourdomain.com
```

### 5. Backup Strategy

#### A. Database Backups

```bash
# Create backup script
cat > /opt/backup-database.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/database"
mkdir -p $BACKUP_DIR

mysqldump -u socidev_user -p$DB_PASSWORD socidev_production > $BACKUP_DIR/backup_$DATE.sql
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
EOF

chmod +x /opt/backup-database.sh

# Add to crontab (daily at 2 AM)
0 2 * * * /opt/backup-database.sh
```

#### B. File Backups

```bash
# Backup uploads folder
0 3 * * * tar -czf /backups/uploads_$(date +\%Y\%m\%d).tar.gz /var/www/socidev/backend_combined/uploads/
```

---

## 🔍 Testing

### 1. Health Checks

```bash
# Backend health
curl https://api.yourdomain.com/api/health

# Test login
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 2. Load Testing (Optional)

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test API
ab -n 1000 -c 10 https://api.yourdomain.com/api/settings/public
```

---

## 🚨 Emergency Procedures

### Maintenance Mode

```bash
# Enable via admin panel or direct database
mysql -u socidev_user -p
UPDATE system_settings SET value = 'true' WHERE key = 'general.maintenanceMode';
```

### Rollback

```bash
# PM2 rollback
pm2 stop socidev-backend
cd backend_combined
git checkout previous-commit-hash
npm install
pm2 restart socidev-backend

# Database rollback
mysql -u socidev_user -p socidev_production < /backups/database/backup_YYYYMMDD.sql
```

---

## 📞 Support Contacts

- **Emergency**: emergency@yourdomain.com
- **DevOps**: devops@yourdomain.com
- **Database Issues**: dba@yourdomain.com

---

**Deployment Date**: _____________  
**Deployed By**: _____________  
**Server IP**: _____________  
**Domain**: _____________
