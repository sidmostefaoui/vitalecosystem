import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Stack,
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
  Engineering as EmployeIcon,
  Assignment as ContratIcon,
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
      },
      {
        title: 'Bons de livraisons',
        icon: <ShippingIcon sx={{ fontSize: 60 }} />,
      },
    ];
  } 
  // Specific submenu for Achats section with Fournisseurs and Bons d'achats
  else if (title === "Achats") {
    menuItems = [
      {
        title: 'Fournisseurs',
        icon: <FournisseursIcon sx={{ fontSize: 60 }} />,
      },
      {
        title: 'Bons d\'achats',
        icon: <BonsAchatsIcon sx={{ fontSize: 60 }} />,
      },
    ];
  }
  // Specific submenu for Agents section with Employés and Contrats
  else if (title === "Agents") {
    menuItems = [
      {
        title: 'Employés',
        icon: <EmployeIcon sx={{ fontSize: 60 }} />,
      },
      {
        title: 'Contrats',
        icon: <ContratIcon sx={{ fontSize: 60 }} />,
      },
    ];
  }
  else {
    // Default submenu options for other sections
    menuItems = [
      {
        title: 'Gérer',
        icon: <ListIcon sx={{ fontSize: 60 }} />,
      },
      {
        title: 'Ajouter',
        icon: <AddIcon sx={{ fontSize: 60 }} />,
      },
      {
        title: 'Rapports',
        icon: <ChartIcon sx={{ fontSize: 60 }} />,
      },
      {
        title: 'Historique',
        icon: <HistoryIcon sx={{ fontSize: 60 }} />,
      },
      {
        title: 'Documents',
        icon: <ArticleIcon sx={{ fontSize: 60 }} />,
      },
      {
        title: 'Paramètres',
        icon: <SettingsIcon sx={{ fontSize: 60 }} />,
      },
    ];
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Submenu title */}
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>
        {title}
      </Typography>

      {/* Grid of menu options */}
      <Grid container spacing={4}>
        {menuItems.map((item, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Paper
              sx={{
                p: 3,
                height: '240px',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3,
                },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onClick={item.onClick}
            >
              <Stack spacing={5} sx={{ height: '100%', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                {/* Icon */}
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  {item.icon}
                </Box>
                {/* Title only */}
                <Box>
                  <Typography variant="h5">
                    {item.title}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SubMenu; 