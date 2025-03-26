import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  AssignmentTurnedIn as RegimeForfaitIcon,
  BarChart as RegimeReelIcon,
  Warehouse as InventaireIcon,
  ShoppingCart as AchatsIcon,
  Engineering as AgentsIcon,
  Category as ProduitsServicesIcon,
} from '@mui/icons-material';

/**
 * Dashboard component - Main entry point of the application.
 * Displays a grid of cards representing the main sections of the application.
 * Fetches dashboard statistics from the API.
 */
const Dashboard = () => {
  const navigate = useNavigate();

  // Define the main navigation cards
  const mainCards = [
    {
      title: 'Régime Forfait',
      icon: <RegimeForfaitIcon sx={{ fontSize: 60 }} />,
      onClick: () => navigate('/regime-forfait'),
    },
    {
      title: 'Régime Réel',
      icon: <RegimeReelIcon sx={{ fontSize: 60 }} />,
    },
    {
      title: 'Inventaire',
      icon: <InventaireIcon sx={{ fontSize: 60 }} />,
      onClick: () => navigate('/inventaire'),
    },
    {
      title: 'Produits & Services',
      icon: <ProduitsServicesIcon sx={{ fontSize: 60 }} />,
      onClick: () => navigate('/produits-services'),
    },
    {
      title: 'Achats',
      icon: <AchatsIcon sx={{ fontSize: 60 }} />,
      onClick: () => navigate('/achats'),
    },
    {
      title: 'Agents',
      icon: <AgentsIcon sx={{ fontSize: 60 }} />,
      onClick: () => navigate('/agents'),
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Dashboard title */}
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>
        Tableau de Bord
      </Typography>

      {/* Grid of main navigation cards */}
      <Grid container spacing={4}>
        {mainCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Paper
              sx={{
                p: 3,
                height: '240px',
                cursor: card.title === 'Régime Réel' ? 'default' : 'pointer',
                '&:hover': {
                  transform: card.title === 'Régime Réel' ? 'none' : 'translateY(-4px)',
                  boxShadow: card.title === 'Régime Réel' ? 1 : 3
                },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center', // Center content vertically
                alignItems: 'center', // Center content horizontally
              }}
              onClick={card.onClick}
            >
              <Stack spacing={5} sx={{ height: '100%', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  {card.icon}
                </Box>
                <Box>
                  <Typography variant="h5">
                    {card.title}
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

export default Dashboard; 