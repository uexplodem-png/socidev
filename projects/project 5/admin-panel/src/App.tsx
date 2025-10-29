import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { validateToken, setLoading } from './store/slices/authSlice';
import Layout from './components/layout/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ProtectedRouteWithPermission } from './components/ProtectedRouteWithPermission';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Orders from './pages/Orders';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';
// Newly added pages
import Balance from './pages/Balance';
import Withdrawals from './pages/Withdrawals';
import SocialAccounts from './pages/SocialAccounts';
import Devices from './pages/Devices';
import Analytics from './pages/Analytics';
import PlatformsServices from './pages/PlatformsServices';
import TaskSubmissions from './pages/TaskSubmissions';
// Import the typed dispatch hook
import { useAppDispatch } from './store';

// Component to handle token validation on app load
const AppInitializer: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Check if there's a token in localStorage and validate it
    const token = localStorage.getItem('token');
    if (token) {
      // Set loading state to true before validation
      dispatch(setLoading(true));
      dispatch(validateToken());
    }
  }, [dispatch]);

  return <>{/* This component doesn't render anything */}</>;
};

function App() {
  return (
    <Provider store={store}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppInitializer />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute requireAdmin={true}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Dashboard - requires analytics.view */}
            <Route path="dashboard" element={
              <ProtectedRouteWithPermission permission="analytics.view">
                <Dashboard />
              </ProtectedRouteWithPermission>
            } />

            {/* Users - requires users.view */}
            <Route path="users" element={
              <ProtectedRouteWithPermission permission="users.view">
                <Users />
              </ProtectedRouteWithPermission>
            } />

            {/* Orders - requires orders.view */}
            <Route path="orders" element={
              <ProtectedRouteWithPermission permission="orders.view">
                <Orders />
              </ProtectedRouteWithPermission>
            } />

            {/* Tasks - requires tasks.view */}
            <Route path="tasks" element={
              <ProtectedRouteWithPermission permission="tasks.view">
                <Tasks />
              </ProtectedRouteWithPermission>
            } />
            <Route path="tasks/:id" element={
              <ProtectedRouteWithPermission permission="tasks.view">
                <TaskDetail />
              </ProtectedRouteWithPermission>
            } />

            {/* Task Submissions - requires tasks.view */}
            <Route path="task-submissions" element={
              <ProtectedRouteWithPermission permission="tasks.view">
                <TaskSubmissions />
              </ProtectedRouteWithPermission>
            } />

            {/* Balance - requires balance.view */}
            <Route path="balance" element={
              <ProtectedRouteWithPermission permission="balance.view">
                <Balance />
              </ProtectedRouteWithPermission>
            } />

            {/* Withdrawals - requires withdrawals.view */}
            <Route path="withdrawals" element={
              <ProtectedRouteWithPermission permission="withdrawals.view">
                <Withdrawals />
              </ProtectedRouteWithPermission>
            } />

            {/* Social Accounts - requires social_accounts.view */}
            <Route path="social-accounts" element={
              <ProtectedRouteWithPermission permission="social_accounts.view">
                <SocialAccounts />
              </ProtectedRouteWithPermission>
            } />

            {/* Devices - requires devices.view */}
            <Route path="devices" element={
              <ProtectedRouteWithPermission permission="devices.view">
                <Devices />
              </ProtectedRouteWithPermission>
            } />

            {/* Analytics - requires analytics.view */}
            <Route path="analytics" element={
              <ProtectedRouteWithPermission permission="analytics.view">
                <Analytics />
              </ProtectedRouteWithPermission>
            } />

            {/* Platforms & Services - requires platforms.view */}
            <Route path="platforms-services" element={
              <ProtectedRouteWithPermission permission="platforms.view">
                <PlatformsServices />
              </ProtectedRouteWithPermission>
            } />

            {/* Audit Logs - requires audit_logs.view */}
            <Route path="audit-logs" element={
              <ProtectedRouteWithPermission permission="audit_logs.view">
                <AuditLogs />
              </ProtectedRouteWithPermission>
            } />

            {/* Settings - requires settings.view */}
            <Route path="settings" element={
              <ProtectedRouteWithPermission permission="settings.view">
                <Settings />
              </ProtectedRouteWithPermission>
            } />
          </Route>
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;