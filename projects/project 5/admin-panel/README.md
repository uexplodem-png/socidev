# Social Developer Platform - Admin Panel

A comprehensive, production-quality admin panel for the Social Developer Platform (socidev) built with React, TypeScript, and Tailwind CSS. This is a complete frontend-only implementation with realistic mock data and simulated backend interactions.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm

### Installation & Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd socidev-admin-panel
   npm install
   ```

2. **Generate Seed Data**
   ```bash
   node scripts/generate-seed.js
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access the Admin Panel**
   - Open your browser to `http://localhost:5173`
   - Use demo credentials to login

## 🔐 Demo Credentials

### Admin Access (Full permissions)
- **Email:** `admin@example.com`  
- **Password:** `DemoAdmin123!`

### Viewer Access (Limited permissions)  
- **Email:** `viewer@example.com`
- **Password:** `DemoViewer123!`

## 📊 Features Overview

### Core Admin Features
- **Dashboard** - KPI cards, interactive charts, real-time analytics
- **Users Management** - User profiles, bulk actions, role management
- **Orders Management** - Order tracking, refunds, status updates
- **Tasks Management** - Task approval workflow, bulk operations
- **Transactions** - Financial monitoring, CSV export, filtering
- **Audit Logs** - Complete action history, security tracking
- **Settings** - System configuration, data management

### Technical Features
- **Responsive Design** - Works on mobile, tablet, and desktop
- **Real-time Updates** - Optimistic UI patterns with mock data
- **Advanced Filtering** - Search, sort, and filter across all data tables
- **Data Export** - CSV export functionality for reports
- **Role-based Access** - Admin vs viewer permission levels
- **Toast Notifications** - User feedback for all actions
- **Loading States** - Proper loading indicators throughout

### Mock Data & API Simulation
- **200+ Users** with realistic profiles and activity
- **500+ Orders** across Instagram and YouTube platforms  
- **1200+ Tasks** with various approval states
- **800+ Transactions** with different payment types
- **300+ Audit Log entries** tracking all admin actions
- **MSW Integration** - Complete API simulation without backend

## 🏗️ Architecture Overview

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── Layout/         # Layout components (AdminLayout)
│   └── ProtectedRoute.tsx
├── contexts/           # React Context providers
│   └── AuthContext.tsx
├── data/              # Mock data and seed files
│   └── seed-data.json
├── lib/               # External library configurations
│   └── msw/          # Mock Service Worker setup
├── pages/             # Page components
│   ├── Dashboard.tsx
│   ├── Users.tsx
│   ├── Orders.tsx
│   ├── Tasks.tsx
│   ├── Transactions.tsx
│   ├── AuditLogs.tsx
│   └── Settings.tsx
└── scripts/           # Utility scripts
    └── generate-seed.js
```

### Tech Stack
- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **State Management:** React Context API
- **Data Tables:** TanStack Table v8
- **Charts:** Recharts
- **API Mocking:** Mock Service Worker (MSW)
- **Mock Data:** Faker.js
- **Icons:** Lucide React
- **Notifications:** React Hot Toast

### Key Design Decisions
- **Client-side only** - No backend required, works offline
- **Modular architecture** - Clean separation of concerns
- **Mock-first approach** - Realistic data simulation
- **Production-ready patterns** - Enterprise-level code quality

## 📱 Responsive Design

The admin panel is fully responsive with breakpoints:
- **Mobile:** `< 768px` - Collapsible sidebar, stacked layouts
- **Tablet:** `768px - 1024px` - Responsive grids and tables  
- **Desktop:** `> 1024px` - Full sidebar, multi-column layouts

## 🔧 Configuration & Customization

### Regenerating Mock Data
```bash
node scripts/generate-seed.js
```
This creates fresh realistic data for all entities.

### Resetting to Seed Data
Use the "Reset to Seed Data" button in Settings to restore original mock data during runtime.

### Customizing Mock Data
Edit `scripts/generate-seed.js` to modify:
- Data quantities (users, orders, tasks, etc.)
- Data relationships and patterns
- Realistic value ranges
- Platform-specific configurations

## 🧪 Testing

The application includes unit tests for critical components:
- Authentication flow and protected routes
- Task approval workflow  
- User role modification
- Mock API integration

```bash
npm test
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview  
```

The built application is completely static and can be deployed to any static hosting service (Netlify, Vercel, GitHub Pages, etc.).

## 📄 API Documentation

The mock API follows RESTful conventions with endpoints:

### Admin Endpoints
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/dashboard/charts` - Chart data  
- `GET /api/admin/users` - User management
- `GET /api/admin/orders` - Order management
- `GET /api/admin/tasks` - Task management
- `GET /api/admin/transactions` - Transaction history
- `GET /api/admin/audit-logs` - Audit log entries
- `GET/PUT /api/admin/settings` - System settings

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/validate` - Token validation

All endpoints support pagination, filtering, and sorting parameters.

## 🔍 Key Features Deep Dive

### Dashboard Analytics
- Real-time KPI monitoring
- Interactive trend charts (7/30/90 day periods)
- Order status distribution
- Recent activity tracking

### User Management  
- Advanced filtering and search
- Bulk operations (ban, suspend, activate)
- Role management (admin/user)
- Activity history tracking

### Task Approval Workflow
- Pending approval queue
- Individual and bulk approval
- Rejection with reason tracking
- Audit trail for all actions

### Financial Monitoring
- Transaction history with filtering
- CSV export for accounting
- Payment method tracking
- Balance reconciliation

### System Administration
- Complete audit trail
- Settings management with live updates
- Data reset functionality
- Security monitoring

## 🤝 Contributing

This is a demo/portfolio project, but contributions are welcome:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality  
4. Submit a pull request

## 📝 License

This project is open source and available under the MIT License.

## 🆘 Support

For questions or issues:
- Check the README for setup instructions
- Review the mock data structure in `src/data/seed-data.json`
- Examine the MSW handlers in `src/lib/msw/handlers.js`

## 🎯 Production Readiness

This admin panel demonstrates enterprise-level patterns:
- ✅ Role-based access control
- ✅ Comprehensive error handling  
- ✅ Loading and empty states
- ✅ Responsive design
- ✅ Accessibility considerations
- ✅ Performance optimizations
- ✅ Clean, maintainable code structure
- ✅ Complete audit trail
- ✅ Data export capabilities
- ✅ System administration tools

Perfect for showcasing modern React development skills and admin panel best practices.