import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Snackbar,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormHelperText
} from '@mui/material';
import { DataGrid, frFR, GridActionsCellItem } from '@mui/x-data-grid';
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { useNavigate } from 'react-router-dom';

/**
 * Clients component - Manages clients data with creation and deletion operations
 */
const Clients = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [agents, setAgents] = useState([]);
  const [error, setError] = useState(null);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [newClient, setNewClient] = useState({
    nom: '',
    specialite: '',
    tel: '',
    mode: 30,
    agent: '',
    etat_contrat: 'Actif',
    debut_contrat: new Date(),
    fin_contrat: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formErrors, setFormErrors] = useState({});

  // Define the columns for DataGrid with delete actions
  const columns = [
    { 
      field: 'id', 
      headerName: 'ID', 
      width: 70,
      headerClassName: 'super-app-theme--header'
    },
    { 
      field: 'nom', 
      headerName: 'Nom', 
      width: 200,
      flex: 1,
      headerClassName: 'super-app-theme--header'
    },
    {
      field: 'specialite',
      headerName: 'Spécialité',
      width: 150,
      flex: 1,
      headerClassName: 'super-app-theme--header'
    },
    {
      field: 'tel',
      headerName: 'Tél',
      width: 120,
      headerClassName: 'super-app-theme--header'
    },
    {
      field: 'mode',
      headerName: 'Mode',
      width: 100,
      headerClassName: 'super-app-theme--header',
      valueFormatter: (params) => `${params.value} jours`
    },
    {
      field: 'agent',
      headerName: 'Agent',
      width: 150,
      headerClassName: 'super-app-theme--header'
    },
    {
      field: 'etat_contrat',
      headerName: 'État Contrat',
      width: 120,
      headerClassName: 'super-app-theme--header',
      renderCell: (params) => {
        let color;
        switch (params.value) {
          case 'Actif':
            color = 'green';
            break;
          case 'En Pause':
            color = 'orange';
            break;
          case 'Terminé':
            color = 'red';
            break;
          default:
            color = 'inherit';
        }
        return <span style={{ color }}>{params.value}</span>;
      }
    },
    {
      field: 'debut_contrat',
      headerName: 'Début Contrat',
      width: 130,
      headerClassName: 'super-app-theme--header'
    },
    {
      field: 'fin_contrat',
      headerName: 'Fin Contrat',
      width: 130,
      headerClassName: 'super-app-theme--header'
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: '',
      width: 120,
      headerClassName: 'super-app-theme--header',
      getActions: (params) => [
        <GridActionsCellItem
          icon={<PersonIcon />}
          label="Profil"
          onClick={() => handleProfileClick(params.row)}
          sx={{ color: '#2196F3' }}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Supprimer"
          onClick={() => handleDeleteClick(params.row)}
          sx={{ color: '#F44336' }}
        />
      ]
    }
  ];

  // Helper function to handle API responses and errors
  const handleApiError = async (response) => {
    if (!response.ok) {
      let errorMessage = `Erreur HTTP: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        // If parsing the error response fails, use the default message
      }
      throw new Error(errorMessage);
    }
    return response.json();
  };

  // Fetch clients from the API
  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/clients');
      const data = await handleApiError(response);
      setClients(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError(`Erreur lors du chargement des clients: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch agents for the dropdown
  const fetchAgents = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/agents');
      const data = await handleApiError(response);
      setAgents(data);
    } catch (error) {
      console.error('Error fetching agents:', error);
      showSnackbar('Erreur lors du chargement des agents', 'error');
    }
  };

  useEffect(() => {
    fetchClients();
    fetchAgents();
  }, []);

  // Validate form data
  const validateForm = () => {
    const errors = {};
    
    if (!newClient.nom.trim()) {
      errors.nom = 'Le nom est requis';
    }
    
    if (!newClient.tel.trim()) {
      errors.tel = 'Le numéro de téléphone est requis';
    } else if (!/^0\d{8,9}$/.test(newClient.tel)) {
      errors.tel = 'Le numéro doit commencer par 0 et contenir 9 ou 10 chiffres';
    }
    
    if (!newClient.agent) {
      errors.agent = "L'agent est requis";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle adding a new client
  const handleAddClient = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // Format dates for API
      const formattedClient = {
        ...newClient,
        debut_contrat: format(newClient.debut_contrat, 'dd/MM/yyyy'),
        fin_contrat: format(newClient.fin_contrat, 'dd/MM/yyyy')
      };
      
      // Send the new client to the API
      const response = await fetch('http://localhost:8000/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedClient),
      });

      await handleApiError(response);
      
      // Refresh the clients list
      await fetchClients();
      
      // Reset form and close dialog
      setNewClient({
        nom: '',
        specialite: '',
        tel: '',
        mode: 30,
        agent: '',
        etat_contrat: 'Actif',
        debut_contrat: new Date(),
        fin_contrat: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      });
      setIsAddingClient(false);
      showSnackbar('Client ajouté avec succès', 'success');
    } catch (error) {
      showSnackbar(error.message || 'Erreur lors de l\'ajout du client', 'error');
    }
  };

  // Handle opening the delete confirmation dialog
  const handleDeleteClick = (client) => {
    setClientToDelete(client);
    setDeleteConfirmOpen(true);
  };

  // Handle confirming the deletion
  const handleDeleteConfirm = async () => {
    try {
      // Send the delete request to the API
      const response = await fetch(`http://localhost:8000/api/clients/${clientToDelete.id}`, {
        method: 'DELETE',
      });

      await handleApiError(response);
      
      // Refresh the data
      await fetchClients();
      
      // Close dialog and show success message
      setDeleteConfirmOpen(false);
      showSnackbar('Client supprimé avec succès', 'success');
    } catch (error) {
      showSnackbar(error.message || 'Erreur lors de la suppression du client', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Handle opening the profile page
  const handleProfileClick = (client) => {
    navigate(`/clients/${client.id}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Clients
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddingClient(true)}
        >
          Nouveau Client
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ height: 650, width: '100%' }}>
        <DataGrid
          rows={clients}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 25]}
          autoHeight
          disableColumnSelector
          hideFooterSelectedRowCount
          localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
          sx={{
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 'bold'
            }
          }}
        />
      </Box>

      {/* Add Client Dialog */}
      <Dialog open={isAddingClient} onClose={() => setIsAddingClient(false)} maxWidth="md" fullWidth>
        <DialogTitle>Ajouter un nouveau client</DialogTitle>
        <form onSubmit={handleAddClient}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                label="Nom"
                value={newClient.nom}
                onChange={(e) => setNewClient({ ...newClient, nom: e.target.value })}
                fullWidth
                required
                margin="normal"
                error={!!formErrors.nom}
                helperText={formErrors.nom}
              />
              
              <TextField
                label="Spécialité"
                value={newClient.specialite}
                onChange={(e) => setNewClient({ ...newClient, specialite: e.target.value })}
                fullWidth
                margin="normal"
              />
              
              <TextField
                label="Téléphone"
                value={newClient.tel}
                onChange={(e) => setNewClient({ ...newClient, tel: e.target.value })}
                fullWidth
                required
                margin="normal"
                error={!!formErrors.tel}
                helperText={formErrors.tel}
              />
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="mode-label">Mode (jours)</InputLabel>
                <Select
                  labelId="mode-label"
                  value={newClient.mode}
                  label="Mode (jours)"
                  onChange={(e) => setNewClient({ ...newClient, mode: e.target.value })}
                >
                  <MenuItem value={30}>30 jours</MenuItem>
                  <MenuItem value={60}>60 jours</MenuItem>
                  <MenuItem value={90}>90 jours</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal" error={!!formErrors.agent}>
                <InputLabel id="agent-label">Agent</InputLabel>
                <Select
                  labelId="agent-label"
                  value={newClient.agent}
                  label="Agent"
                  onChange={(e) => setNewClient({ ...newClient, agent: e.target.value })}
                  required
                >
                  {agents.map((agent) => (
                    <MenuItem key={agent.id} value={agent.nom}>
                      {agent.nom}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.agent && <FormHelperText>{formErrors.agent}</FormHelperText>}
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="etat-label">État Contrat</InputLabel>
                <Select
                  labelId="etat-label"
                  value={newClient.etat_contrat}
                  label="État Contrat"
                  onChange={(e) => setNewClient({ ...newClient, etat_contrat: e.target.value })}
                >
                  <MenuItem value="Actif">Actif</MenuItem>
                  <MenuItem value="En Pause">En Pause</MenuItem>
                  <MenuItem value="Terminé">Terminé</MenuItem>
                </Select>
              </FormControl>
              
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <DatePicker
                    label="Début Contrat"
                    value={newClient.debut_contrat}
                    onChange={(date) => setNewClient({ ...newClient, debut_contrat: date })}
                    slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
                  />
                  
                  <DatePicker
                    label="Fin Contrat"
                    value={newClient.fin_contrat}
                    onChange={(date) => setNewClient({ ...newClient, fin_contrat: date })}
                    slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
                  />
                </Box>
              </LocalizationProvider>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsAddingClient(false)}>Annuler</Button>
            <Button type="submit" variant="contained" color="primary">Ajouter</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le client <strong>{clientToDelete?.nom}</strong> ?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Annuler</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Clients; 