import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
} from '@mui/material';
import {
  Map as MapIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const MesMissions = () => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/missions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        setMissions(data);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMissions();
  }, [token]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'planifié': return 'info';
      case 'en_cours': return 'warning';
      case 'terminé': return 'success';
      case 'annulé': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return <Typography>Chargement...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Mes Missions
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {missions.map((mission) => (
              <TableRow key={mission.id}>
                <TableCell>
                  {new Date(mission.date_debut).toLocaleDateString()}
                </TableCell>
                <TableCell>{mission.client_id}</TableCell>
                <TableCell>{mission.type_mission}</TableCell>
                <TableCell>
                  <Chip 
                    label={mission.statut}
                    color={getStatusColor(mission.statut)}
                  />
                </TableCell>
                <TableCell>
                  <IconButton 
                    color="primary"
                    onClick={() => {/* Afficher la carte */}}
                  >
                    <MapIcon />
                  </IconButton>
                  {mission.statut === 'planifié' && (
                    <>
                      <IconButton 
                        color="success"
                        onClick={() => {/* Démarrer la mission */}}
                      >
                        <CheckCircleIcon />
                      </IconButton>
                      <IconButton 
                        color="error"
                        onClick={() => {/* Annuler la mission */}}
                      >
                        <CancelIcon />
                      </IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default MesMissions; 