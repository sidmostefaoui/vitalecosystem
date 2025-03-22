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
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  const mainCards = [
    {
      title: 'Clients',
      value: stats?.total_clients || 0,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      onClick: () => navigate('/clients'),
    },
    {
      title: 'Factures',
      value: stats?.factures?.total || 0,
      icon: <ReceiptIcon sx={{ fontSize: 40 }} />,
      onClick: () => navigate('/factures'),
    },
    {
      title: 'Chiffre d\'affaires',
      value: stats?.factures?.montant_total?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '0',
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      subtext: 'Total des factures'
    },
    {
      title: 'Notifications',
      value: stats?.notifications?.total || 0,
      icon: <NotificationsIcon sx={{ fontSize: 40 }} />,
      subtext: 'Messages non lus'
    }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Tableau de Bord
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        {mainCards.map((card, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Paper
              sx={{
                p: 3,
                cursor: card.onClick ? 'pointer' : 'default',
                '&:hover': card.onClick ? {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                } : {},
              }}
              onClick={card.onClick}
            >
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {card.icon}
                </Box>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {card.title}
                  </Typography>
                  <Typography variant="h4">
                    {card.value}
                  </Typography>
                  {card.subtext && (
                    <Typography variant="body2" color="text.secondary">
                      {card.subtext}
                    </Typography>
                  )}
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