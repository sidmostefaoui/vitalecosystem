// Composant de chargement global
import React from 'react';
import { Backdrop, CircularProgress, Typography } from '@mui/material';

export const LoadingOverlay = ({ open, message }) => (
  <Backdrop open={open} sx={{ zIndex: 9999, color: '#fff' }}>
    <Box sx={{ textAlign: 'center' }}>
      <CircularProgress color="inherit" />
      <Typography sx={{ mt: 2 }}>{message}</Typography>
    </Box>
  </Backdrop>
); 