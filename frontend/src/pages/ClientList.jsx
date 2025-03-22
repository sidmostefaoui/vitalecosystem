import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { utils as xlsxUtils, read as xlsxRead, writeFile as xlsxWriteFile } from 'xlsx';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { fr } from 'date-fns/locale';

const ClientList = () => {
  const navigate = useNavigate();
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
    { field: 'nom', headerName: 'Nom', width: 150, resizable: true },
    { field: 'specialite', headerName: 'Spécialité', width: 130, resizable: true },
    { 
      field: 'mode_passage', 
      headerName: 'Mode de passage', 
      width: 130,
      resizable: true,
      valueFormatter: (params) => `${params.value} jours`
    },
    { 
      field: 'dernier_passage', 
      headerName: 'Dernier passage',
      width: 130,
      resizable: true,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString('fr-FR')
    },
    { field: 'agent', headerName: 'Agent', width: 130, resizable: true },
    { field: 'tel', headerName: 'Téléphone', width: 130, resizable: true },
    { field: 'adresse', headerName: 'Adresse', width: 200, resizable: true },
    { 
      field: 'montant_mensuel', 
      headerName: 'Montant mensuel',
      width: 130,
      resizable: true,
      valueFormatter: (params) => `${params.value} DA`
    },
    { 
      field: 'date_recrutement', 
      headerName: 'Date recrutement',
      width: 130,
      resizable: true,
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

  const handleDeleteClient = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;
    try {
      const response = await fetch(`http://localhost:8000/api/clients/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      await fetchClients();
      showSnackbar('Client supprimé avec succès', 'success');
    } catch (error) {
      showSnackbar('Erreur lors de la suppression', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleExportClients = () => {
    const clientsData = [
      // En-têtes
      [{ v: 'LISTE DES CLIENTS', t: 's', s: { font: { bold: true, size: 14 } } }],
      [],
      [
        { v: 'Nom', t: 's', s: { font: { bold: true } } },
        { v: 'Spécialité', t: 's', s: { font: { bold: true } } },
        { v: 'Mode de passage', t: 's', s: { font: { bold: true } } },
        { v: 'Dernier passage', t: 's', s: { font: { bold: true } } },
        { v: 'Agent', t: 's', s: { font: { bold: true } } },
        { v: 'Téléphone', t: 's', s: { font: { bold: true } } },
        { v: 'Adresse', t: 's', s: { font: { bold: true } } },
        { v: 'Montant mensuel', t: 's', s: { font: { bold: true } } },
        { v: 'Date recrutement', t: 's', s: { font: { bold: true } } }
      ],
      // Données des clients
      ...clients.map(client => [
        client.nom,
        client.specialite,
        client.mode_passage,
        client.dernier_passage,
        client.agent,
        client.tel,
        client.adresse,
        client.montant_mensuel,
        client.date_recrutement
      ])
    ];

    const ws = xlsxUtils.aoa_to_sheet(clientsData);
    const wb = xlsxUtils.book_new();
    xlsxUtils.book_append_sheet(wb, ws, 'Clients');

    // Ajustement des largeurs de colonnes
    ws['!cols'] = [
      { wch: 15 }, // Nom
      { wch: 15 }, // Spécialité
      { wch: 15 }, // Mode de passage
      { wch: 15 }, // Dernier passage
      { wch: 15 }, // Agent
      { wch: 15 }, // Téléphone
      { wch: 25 }, // Adresse
      { wch: 15 }, // Montant mensuel
      { wch: 15 }  // Date recrutement
    ];

    xlsxWriteFile(wb, `liste_clients_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportClients = async (event) => {
    try {
      const file = event.target.files[0];
      const reader = new FileReader();

      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = xlsxRead(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = xlsxUtils.sheet_to_json(worksheet, { header: 1 });

        // Ignorer les lignes d'en-tête
        const clients = jsonData.slice(3).map(row => ({
          nom: row[0],
          specialite: row[1],
          mode_passage: row[2],
          dernier_passage: row[3],
          agent: row[4],
          tel: row[5],
          adresse: row[6],
          montant_mensuel: row[7],
          date_recrutement: row[8]
        }));

        // Envoyer les clients au backend
        for (const client of clients) {
          await fetch('http://localhost:8000/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(client)
          });
        }

        await fetchClients();
        showSnackbar('Clients importés avec succès', 'success');
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      showSnackbar('Erreur lors de l\'import', 'error');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Box sx={{ height: 600, width: '100%' }}>
        <Stack direction="row" spacing={2} justifyContent="flex-end" mb={2}>
          <input
            type="file"
            accept=".xlsx"
            style={{ display: 'none' }}
            id="import-file"
            onChange={handleImportClients}
          />
          <label htmlFor="import-file">
            <Button
              variant="contained"
              color="secondary"
              component="span"
            >
              Importer Clients
            </Button>
          </label>
          <Button
            variant="contained"
            color="primary"
            onClick={handleExportClients}
          >
            Exporter Clients
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsAddingClient(true)}
          >
            Nouveau Client
          </Button>
        </Stack>

        <DataGrid
          rows={clients}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          loading={loading}
          disableColumnSelector
          autoHeight
          showColumnRightBorder={false}
          showCellRightBorder={false}
          disableRowSelectionOnClick
          disableMultipleRowSelection
          hideFooterSelectedRowCount
          columnVisibilityModel={{
            nom: true,
            specialite: true,
            mode_passage: true,
            dernier_passage: true,
            agent: true,
            tel: true,
            adresse: true,
            montant_mensuel: true,
            date_recrutement: true
          }}
          columnResize
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
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default ClientList; 