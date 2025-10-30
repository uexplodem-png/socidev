import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  CreditCard,
  Smartphone,
  ListTodo,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Globe,
  CheckCircle,
  FileText,
  DollarSign
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { toggleSidebar } from '../../store/slices/themeSlice';
import { usePermissions } from '../../hooks/usePermissions';
import { cn } from '../../utils/cn';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    permission: 'analytics.view',
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users,
    permission: 'users.view',
  },
  {
    name: 'Orders',
    href: '/orders',
    icon: ShoppingCart,
    permission: 'orders.view',
  },
  {
    name: 'Balance Management',
    href: '/balance',
    icon: DollarSign,
    permission: 'transactions.view',
  },
  {
    name: 'Withdrawals',
    href: '/withdrawals',
    icon: CreditCard,
    permission: 'withdrawals.view',
  },
  {
    name: 'Social Accounts',
    href: '/social-accounts',
    icon: Smartphone,
    permission: 'social_accounts.view',
  },
  {
    name: 'Tasks',
    href: '/tasks',
    icon: ListTodo,
    permission: 'tasks.view',
  },
  {
    name: 'Task Submissions',
    href: '/task-submissions',
    icon: CheckCircle,
    permission: 'tasks.view',
  },
  {
    name: 'Devices',
    href: '/devices',
    icon: Smartphone,
    permission: 'devices.view',
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    permission: 'analytics.view',
  },
  {
    name: 'Platforms & Services',
    href: '/platforms-services',
    icon: Globe,
    permission: 'platforms.view',
  },
  {
    name: 'Logs',
    href: '/audit-logs',
    icon: FileText,
    permission: 'audit_logs.view',
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    permission: 'settings.view',
  },
];

const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { sidebarCollapsed } = useAppSelector(state => state.theme);
  const { hasPermission } = usePermissions();
  const location = useLocation();

  const filteredNavigation = navigation.filter(item => hasPermission(item.permission));

  return (
    <div
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 dark:bg-gray-900 dark:border-gray-700',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
        {!sidebarCollapsed && (
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Admin Panel
          </h1>
        )}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-8 px-4">
        <ul className="space-y-2">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
                    sidebarCollapsed && 'justify-center'
                  )}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="ml-3">{item.name}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;