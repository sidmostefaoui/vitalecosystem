import React from 'react';
import { Button } from '@mui/material';
import MissionForm from '../components/planning/MissionForm';
import { useMissions } from '../hooks/useMissions';

const TestMissionForm = () => {
  const [open, setOpen] = React.useState(false);
  const { createMission, loading, error } = useMissions();

  const handleSubmit = async (data) => {
    try {
      await createMission(data);
      setOpen(false);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  return (
    <div>
      <Button onClick={() => setOpen(true)}>
        Nouvelle Mission
      </Button>
      <MissionForm
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        chauffeurs={[
          { id: 1, nom: 'Dupont', prenom: 'Jean' },
          { id: 2, nom: 'Martin', prenom: 'Pierre' }
        ]}
        clients={[
          { id: 1, entreprise: 'Entreprise A' },
          { id: 2, entreprise: 'Entreprise B' }
        ]}
      />
    </div>
  );
};

export default TestMissionForm; 