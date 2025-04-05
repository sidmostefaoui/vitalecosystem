import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Stack,
  Button
} from '@mui/material';
import {
  Article as ArticleIcon,
  Settings as SettingsIcon,
  BarChart as ChartIcon,
  ViewList as ListIcon,
  Add as AddIcon,
  History as HistoryIcon,
  People as PeopleIcon,
  Payment as PaymentIcon,
  LocalShipping as ShippingIcon,
  Storefront as FournisseursIcon,
  Receipt as BonsAchatsIcon,
} from '@mui/icons-material';

/**
 * SubMenu component - Renders a submenu with different options based on the provided title.
 * Used for various sections of the application like Régime Forfait, Régime Réel, etc.
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - The title of the submenu, determines which options to display
 */
const SubMenu = ({ title }) => {
  const navigate = useNavigate();
  
  // Create different menu items based on the title
  let menuItems = [];
  
  // Specific submenu for Régime Forfait with client management, payments, and delivery notes
  if (title === "Régime Forfait") {
    menuItems = [
      {
        title: 'Clients',
        icon: <PeopleIcon sx={{ fontSize: 60 }} />,
        onClick: () => navigate('/clients')
      },
      {
        title: 'Versements',
        icon: <PaymentIcon sx={{ fontSize: 60 }} />,
        onClick: () => navigate('/versements-forfait')
      },
      {
        title: 'Bons de passage',
        icon: <ShippingIcon sx={{ fontSize: 60 }} />,
        onClick: () => navigate('/bons-passage-forfait')
      },
    ];
  } 
  // Empty submenu for Régime Réel
  else if (title === "Régime Réel") {
    menuItems = [];
  }
  // Specific submenu for Achats section with Fournisseurs and Bons d'achats
  else if (title === "Achats") {
    menuItems = [
      {
        title: 'Fournisseurs',
        icon: <FournisseursIcon sx={{ fontSize: 60 }} />,
        onClick: () => navigate('/fournisseurs')
      },
      {
        title: 'Bons d\'achats',
        icon: <BonsAchatsIcon sx={{ fontSize: 60 }} />,
        onClick: () => navigate('/bon-achats')
      },
    ];
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>
        {title}
      </Typography>
      <Grid container spacing={4}>
        {menuItems.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 6,
                }
              }}
              onClick={item.onClick}
            >
              {item.icon}
              <Typography variant="h6" sx={{ mt: 2, fontWeight: 'bold' }}>
                {item.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SubMenu; 