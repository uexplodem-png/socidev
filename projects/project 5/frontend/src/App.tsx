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

  // Check maintenance mode - ONLY for authenticated users who are not privileged
  // Allow login/register pages to be accessible so admins can login
  const currentPath = window.location.pathname;
  const isPublicAuthPage = currentPath === '/login' || currentPath === '/register';
  
  if (isMaintenanceMode() && !isPublicAuthPage) {
    // If user is authenticated, check their role
    if (isAuthenticated) {
      const userRoles = user?.roles?.map(r => r.key) || [];
      const isPrivilegedUser = userRoles.includes('super_admin') ||
        userRoles.includes('admin') ||
        userRoles.includes('moderator');

      // Regular users see maintenance page
      if (!isPrivilegedUser) {
        return <Maintenance />;
      }
    } else {
      // Not authenticated and not on auth page - show maintenance
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
            isMaintenanceMode() ? <Maintenance /> : (
              <Layout>
                <HomePage />
              </Layout>
            )
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
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Task Giver Only Routes */}
      <Route
        path='/new-order'
        element={
          <ProtectedRoute>
            <Layout>
              <NewOrderPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/my-orders'
        element={
          <ProtectedRoute>
            <Layout>
              <MyOrdersPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/add-balance'
        element={
          <ProtectedRoute>
            <Layout>
              <AddBalancePage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Common Protected Routes */}
      <Route
        path='/withdraw-balance'
        element={
          <ProtectedRoute>
            <Layout>
              <WithdrawBalancePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/add-devices'
        element={
          <ProtectedRoute>
            <Layout>
              <AddDevicesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/my-devices'
        element={
          <ProtectedRoute>
            <Layout>
              <MyDevicesPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Instagram Routes */}
      <Route
        path='/my-accounts/instagram'
        element={
          <ProtectedRoute>
            <Layout>
              <InstagramAccountsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/my-accounts/instagram/:id'
        element={
          <ProtectedRoute>
            <Layout>
              <InstagramAccountDetailsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* YouTube Routes */}
      <Route
        path='/my-accounts/youtube'
        element={
          <ProtectedRoute>
            <Layout>
              <YoutubeAccountsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path='/my-accounts/youtube/:id'
        element={
          <ProtectedRoute>
            <Layout>
              <YoutubeAccountDetailsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Task Routes */}
      <Route
        path='/tasks'
        element={
          <ProtectedRoute>
            <Layout>
              <TasksPage />
            </Layout>
          </ProtectedRoute>
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