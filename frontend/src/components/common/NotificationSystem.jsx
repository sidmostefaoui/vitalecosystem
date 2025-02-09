import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useNotifications } from '../../hooks/useNotifications';

const NotificationSystem = () => {
  const { notifications, removeNotification } = useNotifications();

  return notifications.map(notification => (
    <Snackbar
      key={notification.id}
      open={true}
      autoHideDuration={6000}
      onClose={() => removeNotification(notification.id)}
    >
      <Alert 
        severity={notification.type}
        onClose={() => removeNotification(notification.id)}
      >
        {notification.message}
      </Alert>
    </Snackbar>
  ));
};

export default NotificationSystem; 