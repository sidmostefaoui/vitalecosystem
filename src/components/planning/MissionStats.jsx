import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  LinearProgress,
} from '@mui/material';
import {
  Today as TodayIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <Paper sx={{ p: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Box sx={{ 
        backgroundColor: `${color}15`, 
        p: 1, 
        borderRadius: 2,
        mr: 2 
      }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h6" component="div">
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Box>
    </Box>
    {subtitle && (
      <Typography variant="caption" color="text.secondary">
        {subtitle}
      </Typography>
    )}
  </Paper>
);

const MissionStats = ({ missions }) => {
  // Calcul des statistiques
  const stats = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const missionsDuJour = missions.filter(mission => {
      const missionDate = new Date(mission.date_debut);
      return missionDate >= today && missionDate < new Date(today.getTime() + 24*60*60*1000);
    });

    const missionsTerminees = missions.filter(m => m.statut === 'terminé');
    const missionsEnCours = missions.filter(m => m.statut === 'en_cours');
    const missionsPlanifiees = missions.filter(m => m.statut === 'planifié');

    // Calcul des missions par jour sur les 7 derniers jours
    const last7Days = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const count = missions.filter(mission => {
        const missionDate = new Date(mission.date_debut);
        missionDate.setHours(0, 0, 0, 0);
        return missionDate.getTime() === date.getTime();
      }).length;
      return {
        date: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
        missions: count
      };
    }).reverse();

    return {
      missionsDuJour: missionsDuJour.length,
      totalMissions: missions.length,
      missionsTerminees: missionsTerminees.length,
      missionsEnCours: missionsEnCours.length,
      missionsPlanifiees: missionsPlanifiees.length,
      tauxCompletion: missions.length ? (missionsTerminees.length / missions.length) * 100 : 0,
      missionsParJour: last7Days
    };
  }, [missions]);

  return (
    <Grid container spacing={3}>
      {/* Statistiques principales */}
      <Grid item xs={12} md={3}>
        <StatCard
          title="Missions aujourd'hui"
          value={stats.missionsDuJour}
          icon={<TodayIcon sx={{ color: theme => theme.palette.primary.main }} />}
          color={theme => theme.palette.primary.main}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <StatCard
          title="Missions en cours"
          value={stats.missionsEnCours}
          icon={<ShippingIcon sx={{ color: theme => theme.palette.warning.main }} />}
          color={theme => theme.palette.warning.main}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <StatCard
          title="Missions terminées"
          value={stats.missionsTerminees}
          icon={<CheckCircleIcon sx={{ color: theme => theme.palette.success.main }} />}
          color={theme => theme.palette.success.main}
          subtitle={`${stats.tauxCompletion.toFixed(1)}% du total`}
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <StatCard
          title="Missions planifiées"
          value={stats.missionsPlanifiees}
          icon={<TimelineIcon sx={{ color: theme => theme.palette.info.main }} />}
          color={theme => theme.palette.info.main}
        />
      </Grid>

      {/* Graphique des missions par jour */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Évolution des missions
          </Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.missionsParJour}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="missions" fill="#1e3a5f" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      {/* Taux de complétion */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Taux de complétion global
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ flex: 1, mr: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={stats.tauxCompletion}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {stats.tauxCompletion.toFixed(1)}%
            </Typography>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default MissionStats; 