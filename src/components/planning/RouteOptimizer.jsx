import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import MissionMap from './MissionMap';

// Optimisation des tournées
const RouteOptimizer = ({ missions }) => {
  const [optimizedRoute, setOptimizedRoute] = useState([]);

  const optimizeRoute = () => {
    // Algorithme d'optimisation
  };

  return (
    <Box>
      <Button onClick={optimizeRoute}>Optimiser la tournée</Button>
      <MissionMap missions={optimizedRoute} />
    </Box>
  );
};

export default RouteOptimizer; 