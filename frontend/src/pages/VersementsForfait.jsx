import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import { DataGrid, frFR } from '@mui/x-data-grid';
import { format, parse } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { API_URL } from '../App';

/**
 * VersementsForfait page displays all versements forfait in a DataGrid
 */
const VersementsForfait = () => {
  const [versements, setVersements] = useState([]);
  const [clients, setClients] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch versements
        const versementsResponse = await fetch(`${API_URL}/versements-forfait`);
        if (!versementsResponse.ok) {
          throw new Error(`Erreur HTTP: ${versementsResponse.status}`);
        }
        const versementsData = await versementsResponse.json();
        setVersements(versementsData);
        
        // Fetch clients for reference
        const clientsResponse = await fetch(`${API_URL}/clients`);
        if (!clientsResponse.ok) {
          throw new Error(`Erreur HTTP: ${clientsResponse.status}`);
        }
        const clientsData = await clientsResponse.json();
        setClients(clientsData);
        
        // Fetch contracts for reference
        const contractsResponse = await fetch(`${API_URL}/contrats-forfait`);
        if (!contractsResponse.ok) {
          throw new Error(`Erreur HTTP: ${contractsResponse.status}`);
        }
        const contractsData = await contractsResponse.json();
        setContracts(contractsData);
        
        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(`Erreur lors du chargement des données: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Create columns configuration for DataGrid
  const columns = [
    { 
      field: 'date', 
      headerName: 'Date', 
      width: 120,
      headerClassName: 'super-app-theme--header',
    },
    { 
      field: 'client_name', 
      headerName: 'Client', 
      width: 250, 
      flex: 1,
      headerClassName: 'super-app-theme--header',
      valueGetter: (params) => {
        const client = clients.find(c => c.id === params.row.client_id);
        return client ? client.nom : `Client ID: ${params.row.client_id}`;
      }
    },
    { 
      field: 'contract_info', 
      headerName: 'Contrat', 
      width: 250, 
      flex: 1,
      headerClassName: 'super-app-theme--header',
      valueGetter: (params) => {
        const contract = contracts.find(c => c.id === params.row.contrat_id);
        return contract 
          ? `Du ${contract.date_debut} au ${contract.date_fin} - ${contract.montant} DA`
          : `Contrat ID: ${params.row.contrat_id}`;
      }
    },
    { 
      field: 'montant', 
      headerName: 'Montant', 
      width: 150,
      headerClassName: 'super-app-theme--header',
      valueFormatter: (params) => `${params.value.toLocaleString()} DA`,
      align: 'right'
    }
  ];

  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Versements Forfaits
      </Typography>

      <Paper elevation={3} sx={{ width: '100%', mb: 4, p: 3 }}>
        <Box sx={{ height: 650, width: '100%' }}>
          <DataGrid
            rows={versements}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
              sorting: {
                sortModel: [{ field: 'date', sort: 'desc' }],
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            disableColumnSelector
            disableColumnFilter
            hideFooterSelectedRowCount
            localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
            sx={{
              '& .super-app-theme--header': {
                fontWeight: 'bold',
              },
            }}
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default VersementsForfait; 