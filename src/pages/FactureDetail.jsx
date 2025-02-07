import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Grid,
  Divider,
  Stack,
  Link,
  CircularProgress,
  Breadcrumbs,
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Receipt as ReceiptIcon,
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

const FactureDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [facture, setFacture] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFactureDetails();
  }, [id]);

  const fetchFactureDetails = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/factures/${id}`);
      if (response.ok) {
        const data = await response.json();
        setFacture(data);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!facture) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" color="error">Facture non trouvée</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête avec navigation et actions */}
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/factures')}
              sx={{ mb: 2 }}
            >
              Retour aux factures
            </Button>
            <Breadcrumbs aria-label="breadcrumb">
              <Link 
                component="button" 
                onClick={() => navigate('/factures')}
                sx={{ textDecoration: 'none', color: 'text.secondary' }}
              >
                Factures
              </Link>
              <Typography color="text.primary">Facture {facture.numero}</Typography>
            </Breadcrumbs>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
            >
              Imprimer
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => {/* Logique de téléchargement */}}
            >
              Télécharger PDF
            </Button>
          </Stack>
        </Stack>

        {/* Contenu principal */}
        <Paper elevation={1} sx={{ p: 4, borderRadius: 2 }}>
          <Grid container spacing={4}>
            {/* En-tête de facture */}
            <Grid item xs={12}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
                    Facture {facture.numero}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Émise le {new Date(facture.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Typography>
                </Box>
                <Chip
                  label={facture.statut === 'payée' ? 'Payée' : 'En attente'}
                  color={facture.statut === 'payée' ? 'success' : 'warning'}
                  size="large"
                  sx={{ 
                    px: 2,
                    py: 2.5,
                    borderRadius: 2,
                    '& .MuiChip-label': {
                      fontSize: '1rem',
                      fontWeight: 500
                    }
                  }}
                />
              </Stack>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Informations client */}
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                p: 3, 
                bgcolor: 'background.default',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                  Informations client
                </Typography>
                <Stack spacing={2}>
                  <Link 
                    component="button"
                    onClick={() => navigate(`/clients/${facture.client_id}`)}
                    sx={{ 
                      textDecoration: 'none',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        borderRadius: 1
                      }
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <BusinessIcon color="primary" />
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {facture.client_entreprise}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {facture.client_prenom} {facture.client_nom}
                        </Typography>
                      </Box>
                    </Stack>
                  </Link>
                </Stack>
              </Box>
            </Grid>

            {/* Détails facture */}
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                p: 3, 
                bgcolor: 'background.default',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                  Détails facture
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" color="text.secondary">Montant total</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {facture.montant.toLocaleString('fr-FR')} €
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Type de prestation
                    </Typography>
                    <Typography variant="body1">
                      {facture.type.charAt(0).toUpperCase() + facture.type.slice(1)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Description
                    </Typography>
                    <Typography variant="body1">
                      {facture.description}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Stack>
    </Box>
  );
};

export default FactureDetail; 