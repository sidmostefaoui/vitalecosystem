import React from 'react';
import { Box, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const MonPlanning = () => {
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Mon Planning
      </Typography>
      <Typography variant="body1">
        Bienvenue {user?.username} dans votre planning personnel
      </Typography>
    </Box>
  );
};

export default MonPlanning; 