import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Snackbar,
  Alert,
  Typography,
  CircularProgress
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add as AddIcon } from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { fr } from 'date-fns/locale';

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClient, setNewClient] = useState({
    nom: '',
    specialite: '',
    mode_passage: '',
    dernier_passage: null,
    agent: '',
    tel: '',
    adresse: '',
    montant_mensuel: '',
    date_recrutement: null
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const columns = [
    { field: 'nom', headerName: 'Nom', width: 150 },
    { field: 'specialite', headerName: 'Spécialité', width: 130 },
    { 
      field: 'mode_passage', 
      headerName: 'Mode de passage', 
      width: 130,
      valueFormatter: (params) => `${params.value} jours`
    },
    { 
      field: 'dernier_passage', 
      headerName: 'Dernier passage',
      width: 130,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString('fr-FR')
    },
    { field: 'agent', headerName: 'Agent', width: 130 },
    { field: 'tel', headerName: 'Téléphone', width: 130 },
    { field: 'adresse', headerName: 'Adresse', width: 200 },
    { 
      field: 'montant_mensuel', 
      headerName: 'Montant mensuel',
      width: 130,
      valueFormatter: (params) => `${params.value} DA`
    },
    { 
      field: 'date_recrutement', 
      headerName: 'Date recrutement',
      width: 130,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString('fr-FR')
    }
  ];

  const fetchClients = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/clients');
      if (!response.ok) throw new Error('Erreur réseau');
      const data = await response.json();
      setClients(data);
    } catch (error) {
      setError('Impossible de charger les clients');
      showSnackbar('Erreur lors du chargement des clients', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      // Format the dates to ISO string before sending
      const formattedClient = {
        ...newClient,
        dernier_passage: newClient.dernier_passage?.toISOString().split('T')[0],
        date_recrutement: newClient.date_recrutement?.toISOString().split('T')[0],
        // Ensure numeric fields are numbers, not strings
        mode_passage: parseInt(newClient.mode_passage),
        montant_mensuel: parseInt(newClient.montant_mensuel)
      };

      const response = await fetch('http://localhost:8000/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedClient),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Erreur lors de l\'ajout');
      }

      await fetchClients();
      setNewClient({
        nom: '',
        specialite: '',
        mode_passage: '',
        dernier_passage: null,
        agent: '',
        tel: '',
        adresse: '',
        montant_mensuel: '',
        date_recrutement: null
      });
      setIsAddingClient(false);
      showSnackbar('Client ajouté avec succès', 'success');
    } catch (error) {
      showSnackbar(error.message || 'Erreur lors de l\'ajout du client', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Box sx={{ height: 600, width: '100%' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
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
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <DataGrid
          rows={clients}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          autoHeight
          disableRowSelectionOnClick
          disableColumnSelector
          hideFooterSelectedRowCount
        />

        <Dialog open={isAddingClient} onClose={() => setIsAddingClient(false)} maxWidth="md" fullWidth>
          <DialogTitle>Ajouter un nouveau client</DialogTitle>
          <form onSubmit={handleAddClient}>
            <DialogContent>
              <Stack spacing={2}>
                <TextField
                  label="Nom"
                  value={newClient.nom}
                  onChange={(e) => setNewClient({ ...newClient, nom: e.target.value })}
                  required
                  fullWidth
                />
                <TextField
                  label="Spécialité"
                  value={newClient.specialite}
                  onChange={(e) => setNewClient({ ...newClient, specialite: e.target.value })}
                  required
                  fullWidth
                />
                <TextField
                  label="Mode de passage (jours)"
                  type="number"
                  value={newClient.mode_passage}
                  onChange={(e) => setNewClient({ ...newClient, mode_passage: e.target.value })}
                  required
                  fullWidth
                  inputProps={{ min: 1, max: 30 }}
                />
                <DatePicker
                  label="Dernier passage"
                  value={newClient.dernier_passage}
                  onChange={(date) => setNewClient({ ...newClient, dernier_passage: date })}
                  renderInput={(params) => <TextField {...params} required fullWidth />}
                />
                <TextField
                  label="Agent"
                  value={newClient.agent}
                  onChange={(e) => setNewClient({ ...newClient, agent: e.target.value })}
                  required
                  fullWidth
                />
                <TextField
                  label="Téléphone"
                  value={newClient.tel}
                  onChange={(e) => setNewClient({ ...newClient, tel: e.target.value })}
                  required
                  fullWidth
                  helperText="Format: 0XXXXXXXXX"
                />
                <TextField
                  label="Adresse"
                  value={newClient.adresse}
                  onChange={(e) => setNewClient({ ...newClient, adresse: e.target.value })}
                  required
                  fullWidth
                  multiline
                  rows={2}
                />
                <TextField
                  label="Montant mensuel (DA)"
                  type="number"
                  value={newClient.montant_mensuel}
                  onChange={(e) => setNewClient({ ...newClient, montant_mensuel: e.target.value })}
                  required
                  fullWidth
                  inputProps={{ min: 1 }}
                />
                <DatePicker
                  label="Date recrutement"
                  value={newClient.date_recrutement}
                  onChange={(date) => setNewClient({ ...newClient, date_recrutement: date })}
                  renderInput={(params) => <TextField {...params} required fullWidth />}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsAddingClient(false)}>Annuler</Button>
              <Button type="submit" variant="contained">Enregistrer</Button>
            </DialogActions>
          </form>
        </Dialog>

        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default ClientList; 