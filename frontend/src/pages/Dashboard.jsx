import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Divider,
  useTheme,
  Tooltip as MuiTooltip
} from '@mui/material';
import {
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Add as AddIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log("Tentative de récupération des données...");
      
      const response = await fetch('http://localhost:8000/api/dashboard/stats');
      console.log("Réponse reçue:", response);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log("Données reçues:", data);
      
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
      color: theme.palette.primary.main,
      onClick: () => navigate('/clients'),
      action: {
        icon: <AddIcon />,
        label: 'Nouveau client',
        onClick: () => navigate('/clients')
      }
    },
    {
      title: 'Factures',
      value: stats?.factures.total || 0,
      icon: <ReceiptIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.success.main,
      onClick: () => navigate('/factures'),
      action: {
        icon: <AssessmentIcon />,
        label: 'Voir les factures',
        onClick: () => navigate('/factures')
      }
    },
    {
      title: 'Chiffre d\'affaires',
      value: `${(stats?.factures.montant_total?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) || '0')}`,
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.warning.main,
      subtext: 'Total des factures'
    }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          Aucune donnée disponible
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* En-tête */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
          Tableau de Bord
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/clients')}
          >
            Nouveau Client
          </Button>
          <Button
            variant="outlined"
            startIcon={<ReceiptIcon />}
            onClick={() => navigate('/factures')}
          >
            Gérer les Factures
          </Button>
        </Stack>
      </Stack>

      {/* Cartes principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {mainCards.map((card, index) => (
          <Grid item xs={12} md={4} key={index}>
            <MuiTooltip title={card.action ? card.action.label : ''}>
              <Paper
                sx={{
                  p: 3,
                  cursor: card.onClick ? 'pointer' : 'default',
                  transition: 'all 0.3s ease',
                  '&:hover': card.onClick ? {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[4]
                  } : {},
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onClick={card.onClick}
                elevation={2}
              >
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: 2, 
                      bgcolor: `${card.color}15`
                    }}>
                      {React.cloneElement(card.icon, { sx: { color: card.color } })}
                    </Box>
                    {card.action && (
                      <MuiTooltip title={card.action.label}>
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            card.action.onClick();
                          }}
                          startIcon={card.action.icon}
                        >
                          {card.action.label}
                        </Button>
                      </MuiTooltip>
                    )}
                  </Stack>
                  <Box>
                    <Typography color="textSecondary" variant="h6" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {card.value}
                    </Typography>
                    {card.subtext && (
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        {card.subtext}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Paper>
            </MuiTooltip>
          </Grid>
        ))}
      </Grid>

      {/* Graphiques */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }} elevation={2}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Évolution des factures
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ height: 400, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.evolution}>
                  <XAxis 
                    dataKey="mois"
                    tick={{ fill: theme.palette.text.secondary }}
                    tickLine={{ stroke: theme.palette.divider }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
                    }}
                  />
                  <YAxis 
                    tick={{ fill: theme.palette.text.secondary }}
                    tickLine={{ stroke: theme.palette.divider }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`
                    }}
                    formatter={(value) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="montant_total" 
                    fill={theme.palette.primary.main}
                    name="Montant des factures"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }} elevation={2}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              État des factures
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ height: 400, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { 
                        name: 'Payées', 
                        value: stats.factures.payees 
                      },
                      { 
                        name: 'En attente', 
                        value: stats.factures.en_attente 
                      }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill={theme.palette.success.main} />
                    <Cell fill={theme.palette.warning.main} />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 