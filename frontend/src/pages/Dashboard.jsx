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
} from '@mui/icons-material';

/**
 * Dashboard component - Main entry point of the application.
 * Displays a grid of cards representing the main sections of the application.
 * Fetches dashboard statistics from the API.
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  /**
   * Fetches dashboard statistics from the API.
   * Updates the component state with the retrieved data.
   * Handles loading state and potential errors.
   */
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/dashboard/stats');
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles navigation when a card is clicked.
   * Converts the card title to a URL-friendly format.
   * 
   * @param {string} title - The title of the card that was clicked
   */
  const handleCardClick = (title) => {
    // Navigate to a nested route for each card
    const path = title.toLowerCase().replace(/\s+/g, '-');
    navigate(`/${path}`);
  };

  // Define the main navigation cards
  const mainCards = [
    {
      title: 'Régime Forfait',
      icon: <RegimeForfaitIcon sx={{ fontSize: 60 }} />,
      onClick: () => handleCardClick('Régime Forfait'),
    },
    {
      title: 'Régime Réel',
      icon: <RegimeReelIcon sx={{ fontSize: 60 }} />,
      onClick: () => handleCardClick('Régime Réel'),
    },
    {
      title: 'Inventaire',
      icon: <InventaireIcon sx={{ fontSize: 60 }} />,
      onClick: () => handleCardClick('Inventaire'),
    },
    {
      title: 'Achats',
      icon: <AchatsIcon sx={{ fontSize: 60 }} />,
      onClick: () => handleCardClick('Achats'),
    },
    {
      title: 'Agents',
      icon: <AgentsIcon sx={{ fontSize: 60 }} />,
      onClick: () => handleCardClick('Agents'),
    },
  ];

  // Display loading indicator while fetching data
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Display error message if data fetching failed
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

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
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
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