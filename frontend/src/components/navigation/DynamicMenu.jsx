import React from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Box,
  Typography,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  Description as DescriptionIcon,
  DirectionsCar as DirectionsCarIcon,
  CalendarMonth as CalendarMonthIcon,
  LocalShipping as MissionIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const menuConfig = {
  admin: [
    { text: 'Tableau de bord', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Clients', icon: <PeopleIcon />, path: '/clients' },
    { text: 'Factures', icon: <ReceiptIcon />, path: '/factures' },
    { text: 'Chauffeurs', icon: <DirectionsCarIcon />, path: '/chauffeurs' },
    { text: 'Planning', icon: <CalendarMonthIcon />, path: '/planning' },
    { text: 'Paramètres', icon: <SettingsIcon />, path: '/settings' },
  ],
  dispatcher: [
    { text: 'Planning', icon: <CalendarMonthIcon />, path: '/planning' },
    { text: 'Chauffeurs', icon: <DirectionsCarIcon />, path: '/chauffeurs' },
    { text: 'Paramètres', icon: <SettingsIcon />, path: '/settings' },
  ],
  chauffeur: [
    { text: 'Mes Missions', icon: <MissionIcon />, path: '/mes-missions' },
    { text: 'Mon Planning', icon: <CalendarMonthIcon />, path: '/mon-planning' },
    { text: 'Paramètres', icon: <SettingsIcon />, path: '/settings' },
  ],
};

const DynamicMenu = ({ onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const menuItems = menuConfig[user?.role] || [];

  const handleNavigation = (path) => {
    navigate(path);
    onClose?.();
  };

  return (
    <>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
          {user?.username}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}
        </Typography>
      </Box>
      <Divider />
      <List sx={{ px: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&:hover': {
                  backgroundColor: 'primary.light',
                  '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: 500,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );
};

export default DynamicMenu; 