import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { login } from '../store/slices/authSlice';
import { addNotification } from '../store/slices/notificationSlice';
import Button from '../components/ui/Button';
import { LoginCredentials } from '../types';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading } = useAppSelector(state => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/dashboard';
  const errorMessage = (location.state as any)?.error || null;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginCredentials>({
    resolver: yupResolver(schema),
  });

  // Show error message from ProtectedRoute if present
  useEffect(() => {
    if (errorMessage) {
      dispatch(addNotification({
        type: 'error',
        title: 'Access Denied',
        message: errorMessage,
      }));
    }
  }, [errorMessage, dispatch]);

  const onSubmit = async (data: LoginCredentials) => {
    try {
      await dispatch(login(data)).unwrap();

      dispatch(addNotification({
        type: 'success',
        title: 'Welcome back!',
        message: 'You have successfully logged in.',
      }));

      navigate(from, { replace: true });
    } catch (error: any) {
      let errorMessage = 'Invalid email or password. Please try again.';

      // Check if it's an admin access error
      if (error && error.message === 'Access denied. Admin privileges required.') {
        errorMessage = 'Access denied. Only administrators can access the admin panel.';
      }

      dispatch(addNotification({
        type: 'error',
        title: 'Login Failed',
        message: errorMessage,
      }));
    }
  };

  const fillDemoCredentials = (role: 'admin' | 'manager' | 'moderator' | 'readonly') => {
    const credentials = {
      admin: { email: 'admin@example.com', password: 'AdminPassword123!' },
      manager: { email: 'manager@example.com', password: 'DemoManager123!' },
      moderator: { email: 'moderator@example.com', password: 'DemoModerator123!' },
      readonly: { email: 'readonly@example.com', password: 'DemoReadonly123!' },
    };

    setValue('email', credentials[role].email);
    setValue('password', credentials[role].password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Admin Panel Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Social Developer Platform Administration
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                placeholder="Enter your email"
                disabled={loading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4"
            >
              Sign In
            </Button>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                  Demo Credentials
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillDemoCredentials('admin')}
                disabled={loading}
              >
                Admin Demo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillDemoCredentials('manager')}
                disabled={loading}
              >
                Manager Demo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillDemoCredentials('moderator')}
                disabled={loading}
              >
                Moderator Demo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillDemoCredentials('readonly')}
                disabled={loading}
              >
                Readonly Demo
              </Button>
            </div>
          </div>

          <div className="text-center">
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <p className="mb-2">Available Demo Accounts:</p>
              <div className="space-y-1 text-xs">
                <p><strong>Admin:</strong> admin@example.com / AdminPassword123!</p>
                <p><strong>Manager:</strong> manager@example.com / DemoManager123!</p>
                <p><strong>Moderator:</strong> moderator@example.com / DemoModerator123!</p>
                <p><strong>Readonly:</strong> readonly@example.com / DemoReadonly123!</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;