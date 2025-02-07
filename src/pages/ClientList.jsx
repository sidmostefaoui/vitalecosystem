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

const ClientList = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClient, setNewClient] = useState({
    nom: '',
    prenom: '',
    email: '',
    entreprise: '',
    crnc: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'nom', headerName: 'Nom', width: 130 },
    { field: 'prenom', headerName: 'Prénom', width: 130 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'entreprise', headerName: 'Entreprise', width: 200 },
    { field: 'crnc', headerName: 'CRNC', width: 130 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <IconButton
            color="primary"
            size="small"
            onClick={() => navigate(`/clients/${params.row.id}`)}
          >
            <VisibilityIcon />
          </IconButton>
          <IconButton
            color="primary"
            size="small"
            onClick={() => navigate(`/clients/${params.row.id}`)}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            size="small"
            onClick={() => handleDeleteClient(params.row.id)}
          >
            <DeleteIcon />
          </IconButton>
        </Stack>
      ),
    },
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
      const response = await fetch('http://localhost:8000/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient),
      });
      if (!response.ok) throw new Error('Erreur lors de l\'ajout');
      await fetchClients();
      setNewClient({ nom: '', prenom: '', email: '', entreprise: '', crnc: '' });
      setIsAddingClient(false);
      showSnackbar('Client ajouté avec succès', 'success');
    } catch (error) {
      showSnackbar('Erreur lors de l\'ajout du client', 'error');
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
        { v: 'Prénom', t: 's', s: { font: { bold: true } } },
        { v: 'Email', t: 's', s: { font: { bold: true } } },
        { v: 'Entreprise', t: 's', s: { font: { bold: true } } },
        { v: 'CRNC', t: 's', s: { font: { bold: true } } }
      ],
      // Données des clients
      ...clients.map(client => [
        client.nom,
        client.prenom,
        client.email,
        client.entreprise,
        client.crnc
      ])
    ];

    const ws = xlsxUtils.aoa_to_sheet(clientsData);
    const wb = xlsxUtils.book_new();
    xlsxUtils.book_append_sheet(wb, ws, 'Clients');

    // Ajustement des largeurs de colonnes
    ws['!cols'] = [
      { wch: 15 }, // Nom
      { wch: 15 }, // Prénom
      { wch: 30 }, // Email
      { wch: 25 }, // Entreprise
      { wch: 15 }  // CRNC
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
          prenom: row[1],
          email: row[2],
          entreprise: row[3],
          crnc: row[4]
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
        checkboxSelection
        disableSelectionOnClick
        loading={loading}
      />

      <Dialog open={isAddingClient} onClose={() => setIsAddingClient(false)} maxWidth="sm" fullWidth>
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
                label="Prénom"
                value={newClient.prenom}
                onChange={(e) => setNewClient({ ...newClient, prenom: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Email"
                type="email"
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Entreprise"
                value={newClient.entreprise}
                onChange={(e) => setNewClient({ ...newClient, entreprise: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="CRNC"
                value={newClient.crnc}
                onChange={(e) => setNewClient({ ...newClient, crnc: e.target.value })}
                required
                fullWidth
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
  );
};

export default ClientList; 