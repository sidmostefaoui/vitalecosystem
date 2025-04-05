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

/**
 * BonsPassageForfait page displays all bons de passage forfait in a DataGrid
 */
const BonsPassageForfait = () => {
  const [bonsPassage, setBonsPassage] = useState([]);
  const [clients, setClients] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all necessary data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch bons de passage
        const bonsPassageResponse = await fetch('http://localhost:8000/api/bon-passage-forfait');
        if (!bonsPassageResponse.ok) {
          throw new Error(`Erreur HTTP ${bonsPassageResponse.status}`);
        }
        const bonsPassageData = await bonsPassageResponse.json();

        // Fetch clients
        const clientsResponse = await fetch('http://localhost:8000/api/clients');
        if (!clientsResponse.ok) {
          throw new Error(`Erreur HTTP ${clientsResponse.status}`);
        }
        const clientsData = await clientsResponse.json();
        
        // Fetch contracts
        const contractsResponse = await fetch('http://localhost:8000/api/contrats-forfait');
        if (!contractsResponse.ok) {
          throw new Error(`Erreur HTTP ${contractsResponse.status}`);
        }
        const contractsData = await contractsResponse.json();

        // Update state with fetched data
        setBonsPassage(bonsPassageData);
        setClients(clientsData);
        setContracts(contractsData);
        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(`Erreur lors de la récupération des données: ${error.message}`);
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
      width: 200, 
      flex: 1,
      headerClassName: 'super-app-theme--header',
      valueGetter: (params) => {
        const client = clients.find(c => c.id === params.row.client_id);
        return client ? client.nom : `Client ID: ${params.row.client_id}`;
      }
    },
    { 
      field: 'poids_collecte', 
      headerName: 'Poids collecté', 
      width: 150,
      headerClassName: 'super-app-theme--header',
      valueFormatter: (params) => `${params.value} kg`
    },
    { 
      field: 'exces_poids', 
      headerName: 'Excès de poids', 
      width: 150,
      headerClassName: 'super-app-theme--header',
      valueFormatter: (params) => `${params.value} kg`
    },
    { 
      field: 'montant', 
      headerName: 'Montant', 
      width: 150,
      headerClassName: 'super-app-theme--header',
      valueFormatter: (params) => `${params.value.toLocaleString()} DA`,
      align: 'right'
    },
    {
      field: 'contract_info',
      headerName: 'Contrat',
      width: 200,
      flex: 1,
      headerClassName: 'super-app-theme--header',
      valueGetter: (params) => {
        const contract = contracts.find(c => c.id === params.row.contrat_id);
        return contract 
          ? `Du ${contract.date_debut} au ${contract.date_fin}`
          : `Contrat ID: ${params.row.contrat_id}`;
      }
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
        Bons de Passage
      </Typography>

      <Paper elevation={3} sx={{ width: '100%', mb: 4, p: 3 }}>
        <Box sx={{ height: 650, width: '100%' }}>
          <DataGrid
            rows={bonsPassage}
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

export default BonsPassageForfait; 