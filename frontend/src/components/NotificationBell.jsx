import React from 'react';
import { IconButton, Badge } from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';

const NotificationBell = () => {
  return (
    <IconButton color="inherit">
      <Badge badgeContent={0} color="error">
        <NotificationsIcon />
      </Badge>
    </IconButton>
  );
};

export default NotificationBell; 