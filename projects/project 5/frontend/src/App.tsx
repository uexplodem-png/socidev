import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import HomePage from "./pages/home/index";
import DashboardPage from "./pages/dashboard/index";
import { LoginPage } from "./pages/login/index";
import { RegisterPage } from "./pages/register/index";
import { NewOrderPage } from "./pages/new-order/index";
import { MyOrdersPage } from "./pages/my-orders/index";
import { AddBalancePage } from "./pages/add-balance/index";
import { WithdrawBalancePage } from "./pages/withdraw-balance/index";
import { AddDevicesPage } from "./pages/add-devices/index";
import { MyDevicesPage } from "./pages/my-devices/index";
import { InstagramAccountsPage } from "./pages/my-accounts/instagram/accounts/index";
import { InstagramAccountDetailsPage } from "./pages/my-accounts/instagram/accounts/[id]";
import { YoutubeAccountsPage } from "./pages/my-accounts/youtube";
import { YoutubeAccountDetailsPage } from "./pages/my-accounts/youtube/[id]";
import ProfilePage from "./pages/profile/index";
import SettingsPage from "./pages/settings/index";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { UserModeProvider } from "./context/UserModeContext";
import { BalanceProvider } from "./context/BalanceContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ProtectedRouteWithPermission } from "./components/ProtectedRouteWithPermission";
import { TasksPage } from "./pages/tasks";
import TestPage from "./pages/test";
import { MaintenanceBanner } from "./components/MaintenanceBanner";
import Maintenance from "./pages/Maintenance";
import { useFeatureFlags } from "./hooks/useFeatureFlags";



function AppRoutes() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isMaintenanceMode, loading: settingsLoading } = useFeatureFlags(isAuthenticated);

  // Show loading spinner while checking authentication
  if (isLoading || settingsLoading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>;
  }

  // Check maintenance mode - only show to non-privileged users
  if (isMaintenanceMode()) {
    const userRoles = user?.roles?.map(r => r.key) || [];
    const isPrivilegedUser = userRoles.includes('super_admin') || 
                             userRoles.includes('admin') || 
                             userRoles.includes('moderator');
    
    if (!isPrivilegedUser) {
      return <Maintenance />;
    }
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path='/'
        element={
          isAuthenticated ? (
            <Navigate to='/dashboard' replace />
          ) : (
            <Layout>
              <HomePage />
            </Layout>
          )
        }
      />
      <Route
        path='/login'
        element={
          isAuthenticated ? <Navigate to='/dashboard' replace /> : <LoginPage />
        }
      />
      <Route
        path='/register'
        element={
          isAuthenticated ? (
            <Navigate to='/dashboard' replace />
          ) : (
            <RegisterPage />
          )
        }
      />
      <Route
        path='/test'
        element={
          <Layout>
            <TestPage />
          </Layout>
        }
      />

      {/* Protected routes */}
      <Route
        path='/dashboard'
        element={
          <ProtectedRouteWithPermission permission='dashboard.view'>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRouteWithPermission>
        }
      />

      {/* Task Giver Only Routes */}
      <Route
        path='/new-order'
        element={
          <ProtectedRouteWithPermission permission='orders.create'>
            <Layout>
              <NewOrderPage />
            </Layout>
          </ProtectedRouteWithPermission>
        }
      />
      <Route
        path='/my-orders'
        element={
          <ProtectedRouteWithPermission permission='orders.view'>
            <Layout>
              <MyOrdersPage />
            </Layout>
          </ProtectedRouteWithPermission>
        }
      />
      <Route
        path='/add-balance'
        element={
          <ProtectedRouteWithPermission permission='transactions.create'>
            <Layout>
              <AddBalancePage />
            </Layout>
          </ProtectedRouteWithPermission>
        }
      />

      {/* Common Protected Routes */}
      <Route
        path='/withdraw-balance'
        element={
          <ProtectedRouteWithPermission permission='withdrawals.create'>
            <Layout>
              <WithdrawBalancePage />
            </Layout>
          </ProtectedRouteWithPermission>
        }
      />
      <Route
        path='/add-devices'
        element={
          <ProtectedRouteWithPermission permission='devices.create'>
            <Layout>
              <AddDevicesPage />
            </Layout>
          </ProtectedRouteWithPermission>
        }
      />
      <Route
        path='/my-devices'
        element={
          <ProtectedRouteWithPermission permission='devices.view'>
            <Layout>
              <MyDevicesPage />
            </Layout>
          </ProtectedRouteWithPermission>
        }
      />

      {/* Instagram Routes */}
      <Route
        path='/my-accounts/instagram'
        element={
          <ProtectedRouteWithPermission permission='accounts.view'>
            <Layout>
              <InstagramAccountsPage />
            </Layout>
          </ProtectedRouteWithPermission>
        }
      />
      <Route
        path='/my-accounts/instagram/:id'
        element={
          <ProtectedRouteWithPermission permission='accounts.view'>
            <Layout>
              <InstagramAccountDetailsPage />
            </Layout>
          </ProtectedRouteWithPermission>
        }
      />

      {/* YouTube Routes */}
      <Route
        path='/my-accounts/youtube'
        element={
          <ProtectedRouteWithPermission permission='accounts.view'>
            <Layout>
              <YoutubeAccountsPage />
            </Layout>
          </ProtectedRouteWithPermission>
        }
      />
      <Route
        path='/my-accounts/youtube/:id'
        element={
          <ProtectedRouteWithPermission permission='accounts.view'>
            <Layout>
              <YoutubeAccountDetailsPage />
            </Layout>
          </ProtectedRouteWithPermission>
        }
      />

      {/* Task Routes */}
      <Route
        path='/tasks'
        element={
          <ProtectedRouteWithPermission permission='tasks.view'>
            <Layout>
              <TasksPage />
            </Layout>
          </ProtectedRouteWithPermission>
        }
      />

      {/* Profile & Settings Routes */}
      <Route
        path='/profile'
        element={
          <ProtectedRoute>
            <Layout>
              <ProfilePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/settings'
        element={
          <ProtectedRoute>
            <Layout>
              <SettingsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Catch all route */}
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <UserModeProvider>
          <BalanceProvider>
            <MaintenanceBanner />
            <AppRoutes />
          </BalanceProvider>
        </UserModeProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;