import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import MissionTimeline from '../components/planning/MissionTimeline';
import { useMissions } from '../hooks/useMissions';
import MissionForm from '../components/planning/MissionForm';

const TestMissionTimeline = () => {
  const { missions, loading, error, deleteMission, updateMission } = useMissions();
  const [editingMission, setEditingMission] = React.useState(null);

  const handleEdit = (mission) => {
    setEditingMission(mission);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette mission ?')) {
      try {
        await deleteMission(id);
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
      }
    }
  };

  const handleUpdate = async (data) => {
    try {
      await updateMission(editingMission.id, data);
      setEditingMission(null);
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ p: 3 }}>
        Erreur: {error}
      </Typography>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Timeline des Missions
      </Typography>
      
      <MissionTimeline
        missions={missions}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />

      <MissionForm
        open={!!editingMission}
        onClose={() => setEditingMission(null)}
        mission={editingMission}
        onSubmit={handleUpdate}
        chauffeurs={[
          { id: 1, nom: 'Dupont', prenom: 'Jean' },
          { id: 2, nom: 'Martin', prenom: 'Pierre' }
        ]}
        clients={[
          { id: 1, entreprise: 'Entreprise A' },
          { id: 2, entreprise: 'Entreprise B' }
        ]}
      />
    </Box>
  );
};

export default TestMissionTimeline; 