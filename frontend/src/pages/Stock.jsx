import React, { useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Stack
} from '@mui/material';
import { DataGrid, frFR } from '@mui/x-data-grid';

/**
 * Stock component - Displays a list of products in stock with quantities and prices
 */
const Stock = () => {
  const [loading, setLoading] = useState(false);
  
  // Sample data for the stock
  const stockItems = [
    { id: 1, produit: 'Sacs poubelle industriels 100L', qte: 250, prixAchat: 125.50 },
    { id: 2, produit: 'Conteneurs plastiques 240L', qte: 35, prixAchat: 4500.00 },
    { id: 3, produit: 'Gants de protection', qte: 100, prixAchat: 450.75 },
    { id: 4, produit: 'Désinfectant industriel 5L', qte: 45, prixAchat: 1200.00 },
    { id: 5, produit: 'Masques FFP2', qte: 500, prixAchat: 85.25 }
  ];

  // Define the columns for the DataGrid
  const columns = [
    { 
      field: 'produit', 
      headerName: 'Produit', 
      width: 350,
      headerAlign: 'left',
    },
    { 
      field: 'qte', 
      headerName: 'Qté', 
      width: 120,
      align: 'center',
      headerAlign: 'center',
    },
    { 
      field: 'prixAchat', 
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
          Stock
        </Typography>
      </Stack>

      <DataGrid
        rows={stockItems}
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

export default Stock; 