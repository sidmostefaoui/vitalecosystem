import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    fetchNotifications();
    // Rafraîchir les notifications toutes les minutes
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/notifications/echeances', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getNotificationIcon = (type, priorite) => {
    switch (type) {
      case 'renouvellement':
        return priorite === 'haute' ? 
          <WarningIcon color="error" /> : 
          <InfoIcon color="info" />;
      case 'mission':
        return <CheckCircleIcon color="success" />;
      default:
        return <InfoIcon />;
    }
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={notifications.length} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 400,
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Notifications</Typography>
        </Box>
        <Divider />
        <List sx={{ p: 0 }}>
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <ListItem key={notif.id} sx={{ 
                '&:hover': { backgroundColor: 'action.hover' }
              }}>
                <ListItemIcon>
                  {getNotificationIcon(notif.type, notif.priorite)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="subtitle2">
                      {notif.type === 'renouvellement' 
                        ? `Renouvellement - ${notif.client}`
                        : notif.message}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      {notif.type === 'renouvellement'
                        ? `Échéance dans ${notif.jours_restants} jours`
                        : notif.date}
                    </Typography>
                  }
                />
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText
                primary={
                  <Typography align="center" color="text.secondary">
                    Aucune notification
                  </Typography>
                }
              />
            </ListItem>
          )}
        </List>
      </Menu>
    </>
  );
};

export default NotificationBell; 