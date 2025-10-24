import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { removeNotification } from '../../store/slices/notificationSlice';
import { cn } from '../../utils/cn';

const Toast: React.FC = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(state => state.notifications.notifications);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-700';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-900 dark:border-red-700';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900 dark:border-yellow-700';
      case 'info':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-700';
      default:
        return 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700';
    }
  };

  return createPortal(
    <div className="fixed top-4 left-4 z-50 space-y-2 w-full max-w-md md:top-4 md:left-4 sm:top-2 sm:left-2 sm:max-w-none">
      {notifications.slice(0, 5).map((notification) => (
        <ToastItem
          key={notification.id}
          notification={notification}
          onRemove={() => dispatch(removeNotification(notification.id))}
          icon={getIcon(notification.type)}
          backgroundColor={getBackgroundColor(notification.type)}
        />
      ))}
    </div>,
    document.body
  );
};

interface ToastItemProps {
  notification: any;
  onRemove: () => void;
  icon: React.ReactNode;
  backgroundColor: string;
}

const ToastItem: React.FC<ToastItemProps> = ({
  notification,
  onRemove,
  icon,
  backgroundColor,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onRemove]);

  return (
    <div
      className={cn(
        'w-full min-w-[280px] max-w-md border rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-in-out',
        backgroundColor,
        'animate-in slide-in-from-left'
      )}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">
          {icon}
        </div>
        <div className="ml-3 w-0 flex-1 pr-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
            {notification.title}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 break-words">
            {notification.message}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0 flex items-start pt-0.5">
          <button
            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 dark:hover:text-gray-300"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;