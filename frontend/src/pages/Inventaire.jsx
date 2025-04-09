import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Stack,
  Alert
} from '@mui/material';
import { DataGrid, frFR } from '@mui/x-data-grid';
import { API_URL } from '../App';

/**
 * Inventaire component - Displays a list of products in inventory with quantities and last prices
 */
const Inventaire = () => {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/inventaire`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      setInventory(data);
      setError(null);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'inventaire:', error);
      setError(`Erreur lors du chargement de l'inventaire: ${error.message}`);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  // Define the columns for the DataGrid
  const columns = [
    { 
      field: 'produit', 
      headerName: 'Produit', 
      width: 350,
      headerAlign: 'left',
      flex: 1
    },
    { 
      field: 'qte', 
      headerName: 'Qté', 
      width: 120,
      align: 'center',
      headerAlign: 'center',
    },
    { 
      field: 'prix_dernier', 
      headerName: 'Prix d\'achat (Dernier)', 
      width: 220,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params) => `${params.value.toFixed(2)} DA`,
    }
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
          Inventaire
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <DataGrid
        rows={inventory}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10, 25, 50]}
        autoHeight
        disableRowSelectionOnClick
        disableColumnSelector
        hideFooterSelectedRowCount
        localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
        sx={{
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 'bold',
          }
        }}
      />
    </Box>
  );
};

export default Inventaire; 