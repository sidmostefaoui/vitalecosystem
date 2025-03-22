import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Stack,
  Paper,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon } from '@mui/icons-material';

const FactureList = () => {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFactures();
  }, []);

  const fetchFactures = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/factures');
      if (!response.ok) throw new Error('Erreur réseau');
      const data = await response.json();
      setFactures(data);
    } catch (error) {
      setError('Impossible de charger les factures');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { field: 'numero', headerName: 'Numéro', width: 150 },
    { 
      field: 'date_emission', 
      headerName: 'Date d\'émission', 
      width: 150,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString('fr-FR')
    },
    { 
      field: 'date_echeance', 
      headerName: 'Date d\'échéance', 
      width: 150,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString('fr-FR')
    },
    { 
      field: 'montant', 
      headerName: 'Montant', 
      width: 150,
      valueFormatter: (params) => `${params.value.toLocaleString('fr-FR')} DA`
    },
    { 
      field: 'statut', 
      headerName: 'Statut', 
      width: 150,
      renderCell: (params) => (
        <Paper 
          sx={{ 
            bgcolor: params.value === 'payée' ? 'success.light' : 'warning.light',
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            color: 'white'
          }}
        >
          {params.value}
        </Paper>
      )
    },
    { field: 'description', headerName: 'Description', width: 300 },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Factures
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
        >
          Nouvelle Facture
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <DataGrid
        rows={factures}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10, 25, 50]}
        autoHeight
        disableRowSelectionOnClick
        disableColumnSelector
      />
    </Box>
  );
};

export default FactureList; 