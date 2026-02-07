import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { notificationService } from '../api/services';
import toast from 'react-hot-toast';

const AutoClearNotifications = () => {
  const location = useLocation();

  useEffect(() => {
    const clearNotificationsForPage = async () => {
      try {
        // Clear order notifications when visiting orders page
        if (location.pathname === '/orders') {
          const response = await notificationService.clearOrderNotifications();
          if (response.data.modifiedCount > 0) {
            toast.success(`Cleared ${response.data.modifiedCount} order notifications`, {
              duration: 2000,
            });
          }
        }
        
        // Clear subscriber notifications when visiting newsletter subscribers page
        if (location.pathname === '/newsletter/subscribers') {
          const response = await notificationService.clearSubscriberNotifications();
          if (response.data.modifiedCount > 0) {
            toast.success(`Cleared ${response.data.modifiedCount} subscriber notifications`, {
              duration: 2000,
            });
          }
        }
      } catch (error) {
        console.error('Failed to clear notifications:', error);
      }
    };

    clearNotificationsForPage();
  }, [location.pathname]);

  return null;
};

export default AutoClearNotifications;