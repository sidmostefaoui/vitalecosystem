import React from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
} from '@mui/material';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getRedirectPath = () => {
    switch (user?.role) {
      case 'chauffeur':
        return '/mes-missions';
      case 'dispatcher':
        return '/planning';
      case 'admin':
        return '/';
      default:
        return '/login';
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <ErrorIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Accès non autorisé
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate(getRedirectPath())}
            sx={{ mt: 2 }}
          >
            Retourner à ma page d'accueil
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Unauthorized; 