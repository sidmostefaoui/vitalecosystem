import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  useTheme,
  CircularProgress,
  Alert
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const FactureList = () => {
  const theme = useTheme();
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
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des factures');
      }
      const data = await response.json();
      setFactures(data);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Impossible de charger les factures');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { 
      field: 'numero', 
      headerName: 'N° Facture', 
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'date', 
      headerName: 'Date', 
      width: 130,
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleDateString('fr-FR');
      }
    },
    {
      field: 'client',
      headerName: 'Client',
      width: 250,
      valueGetter: (params) => `${params.row.client_entreprise} (${params.row.client_nom} ${params.row.client_prenom})`,
      renderCell: (params) => (
        <Typography variant="body2">
          <strong>{params.row.client_entreprise}</strong>
          <br />
          {params.row.client_nom} {params.row.client_prenom}
        </Typography>
      )
    },
    {
      field: 'montant',
      headerName: 'Montant',
      width: 130,
      type: 'number',
      valueFormatter: (params) => {
        if (params.value == null) return '';
        return params.value.toLocaleString('fr-FR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      },
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {params.value.toLocaleString('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </Typography>
      )
    },
    {
      field: 'statut',
      headerName: 'Statut',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value === 'payée' ? 'Payée' : 'En attente'}
          color={params.value === 'payée' ? 'success' : 'warning'}
          size="small"
          sx={{ minWidth: 100 }}
        />
      )
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 300,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          {params.value}
        </Typography>
      )
    }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <Stack spacing={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Liste des Factures
        </Typography>
        <Paper sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={factures}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            sx={{
              '& .MuiDataGrid-cell': {
                borderBottom: `1px solid ${theme.palette.divider}`,
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: theme.palette.background.default,
                borderBottom: `2px solid ${theme.palette.divider}`,
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          />
        </Paper>
      </Stack>
    </Box>
  );
};

export default FactureList; 