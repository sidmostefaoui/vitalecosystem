import React from 'react';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  LocalShipping as ShippingIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const getStatusColor = (status) => {
  switch (status) {
    case 'planifié': return 'primary';
    case 'en_cours': return 'warning';
    case 'terminé': return 'success';
    case 'annulé': return 'error';
    default: return 'default';
  }
};

const MissionTimeline = ({ 
  missions, 
  onEdit, 
  onDelete,
  loading = false 
}) => {
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'PPP', { locale: fr });
    } catch (error) {
      console.error('Date invalide:', dateString);
      return 'Date invalide';
    }
  };

  const sortedMissions = [...missions].sort(
    (a, b) => {
      try {
        return new Date(a.date_debut) - new Date(b.date_debut);
      } catch (error) {
        return 0;
      }
    }
  );

  return (
    <Timeline position="alternate">
      {sortedMissions.map((mission) => (
        <TimelineItem key={mission.id}>
          <TimelineOppositeContent>
            <Typography variant="body2" color="textSecondary">
              {formatDate(mission.date_debut)}
              <br />
              {mission.date_debut ? new Date(mission.date_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
            </Typography>
          </TimelineOppositeContent>

          <TimelineSeparator>
            <TimelineDot color={getStatusColor(mission.statut)}>
              <ShippingIcon />
            </TimelineDot>
            <TimelineConnector />
          </TimelineSeparator>

          <TimelineContent>
            <Paper elevation={3} sx={{ p: 2, maxWidth: 400 }}>
              <Box sx={{ mb: 1 }}>
                <Chip
                  label={mission.statut}
                  color={getStatusColor(mission.statut)}
                  size="small"
                  sx={{ mb: 1 }}
                />
              </Box>

              <Typography variant="h6" component="h3" gutterBottom>
                {mission.type_mission}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {mission.chauffeur_nom}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BusinessIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {mission.client_entreprise}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ScheduleIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  Durée: {(() => {
                    const diff = new Date(mission.date_fin) - new Date(mission.date_debut);
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    return `${hours}h${minutes.toString().padStart(2, '0')}`;
                  })()}
                </Typography>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 2 
              }}>
                <Box>
                  <Typography variant="caption" display="block">
                    De: {mission.adresse_pickup.ville}
                  </Typography>
                  <Typography variant="caption" display="block">
                    À: {mission.adresse_delivery.ville}
                  </Typography>
                </Box>
                
                <Box>
                  <Tooltip title="Modifier">
                    <IconButton 
                      size="small" 
                      onClick={() => onEdit(mission)}
                      disabled={loading}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <IconButton 
                      size="small" 
                      onClick={() => onDelete(mission.id)}
                      disabled={loading}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Paper>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
};

export default MissionTimeline; 