import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PictureAsPdfIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { utils as xlsxUtils, writeFile as xlsxWriteFile } from 'xlsx';
import { generateInvoicePDF } from '../components/InvoicePDF';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import fr from 'date-fns/locale/fr';

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [client, setClient] = useState(null);
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newFacture, setNewFacture] = useState({
    numero: '',
    date: new Date().toISOString().split('T')[0],
    montant: '',
    description: '',
    type: 'service'
  });
  const [periodDialog, setPeriodDialog] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });

  // Colonnes pour le DataGrid des factures
  const factureColumns = [
    { field: 'numero', headerName: 'Numéro', width: 130 },
    { field: 'type', headerName: 'Type', width: 130 },
    { field: 'date', headerName: 'Date', width: 130 },
    { 
      field: 'montant', 
      headerName: 'Montant', 
      width: 130,
      type: 'number',
      valueFormatter: (params) => {
        if (params.value === null || params.value === undefined) return '';
        return Number(params.value).toFixed(2);
      }
    },
    { field: 'description', headerName: 'Description', width: 200 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <IconButton
            color="primary"
            onClick={() => handleGenerateInvoicePDF(params.row)}
            size="small"
          >
            <PictureAsPdfIcon />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => handleDeleteFacture(params.row.id)}
            size="small"
          >
            <DeleteIcon />
          </IconButton>
        </Stack>
      ),
    },
  ];

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [clientRes, facturesRes] = await Promise.all([
        fetch(`http://localhost:8000/api/clients/${id}`),
        fetch(`http://localhost:8000/api/clients/${id}/factures`)
      ]);

      if (!clientRes.ok) throw new Error('Client non trouvé');

      const clientData = await clientRes.json();
      const facturesData = await facturesRes.json();

      setClient(clientData);
      setFactures(facturesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFacture = async (e) => {
    e.preventDefault();
    
    // Validation du montant
    const montant = Number(newFacture.montant);
    if (isNaN(montant) || montant <= 0) {
      setError('Le montant doit être un nombre positif');
      return;
    }

    try {
      const factureData = {
        numero: newFacture.numero,
        date: newFacture.date,
        montant: montant,
        description: newFacture.description,
        type: newFacture.type,
        statut: "en attente"
      };

      console.log('Données envoyées:', factureData);

      const response = await fetch(`http://localhost:8000/api/clients/${id}/factures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(factureData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors de l\'ajout de la facture');
      }

      const responseData = await response.json();
      console.log('Réponse du serveur:', responseData);

      // Mettre à jour la liste des factures
      const updatedFactures = [...factures, responseData];
      setFactures(updatedFactures);
      
      setOpenDialog(false);
      setNewFacture({
        numero: '',
        date: new Date().toISOString().split('T')[0],
        montant: '',
        description: '',
        type: 'service',
      });
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
    }
  };

  const handleDeleteFacture = async (factureId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette facture ?')) return;
    try {
      const response = await fetch(`http://localhost:8000/api/clients/${id}/factures/${factureId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExportExcel = () => {
    // Préparation des données du client avec formatage
    const clientData = [
      [{ v: 'INFORMATIONS CLIENT', t: 's', s: { font: { bold: true, size: 14 } } }],
      ['Nom', client.nom],
      ['Prénom', client.prenom],
      ['Email', client.email],
      ['Entreprise', client.entreprise],
      ['CRNC', client.crnc],
      [],
      [{ v: 'LISTE DES FACTURES', t: 's', s: { font: { bold: true, size: 14 } } }],
      // En-têtes des colonnes avec style
      [
        { v: 'Numéro', t: 's', s: { font: { bold: true } } },
        { v: 'Type', t: 's', s: { font: { bold: true } } },
        { v: 'Date', t: 's', s: { font: { bold: true } } },
        { v: 'Montant (€)', t: 's', s: { font: { bold: true } } },
        { v: 'Description', t: 's', s: { font: { bold: true } } },
        { v: 'Statut', t: 's', s: { font: { bold: true } } }
      ]
    ];

    // Ajout des factures avec formatage des montants
    factures.forEach(facture => {
      clientData.push([
        facture.numero,
        facture.type,
        facture.date,
        { v: facture.montant, t: 'n', z: '#,##0.00€' },
        facture.description,
        facture.statut
      ]);
    });

    // Création du workbook avec styles
    const ws = xlsxUtils.aoa_to_sheet(clientData);
    const wb = xlsxUtils.book_new();
    xlsxUtils.book_append_sheet(wb, ws, 'Données Client');

    // Ajustement des largeurs de colonnes
    ws['!cols'] = [
      { wch: 15 }, // Numéro
      { wch: 12 }, // Type
      { wch: 12 }, // Date
      { wch: 12 }, // Montant
      { wch: 40 }, // Description
      { wch: 12 }  // Statut
    ];

    // Export du fichier
    xlsxWriteFile(wb, `client_${client.nom}_${client.prenom}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleGenerateInvoicePDF = (facture) => {
    try {
      const doc = generateInvoicePDF(facture, client);
      doc.save(`facture_${facture.numero}_${client.nom}.pdf`);
    } catch (error) {
      setError('Erreur lors de la génération de la facture PDF');
    }
  };

  // Fonction pour générer la facture par période
  const handleGenerateInvoiceForPeriod = () => {
    const filteredFactures = factures.filter(facture => {
      const factureDate = new Date(facture.date);
      return factureDate >= dateRange.startDate && factureDate <= dateRange.endDate;
    });

    if (filteredFactures.length === 0) {
      setError('Aucune facture trouvée pour cette période');
      return;
    }

    const totalAmount = filteredFactures.reduce((sum, facture) => sum + facture.montant, 0);
    const invoiceData = {
      ...filteredFactures[0],
      numero: `RECAP-${new Date().getTime()}`,
      date: new Date().toISOString().split('T')[0],
      montant: totalAmount,
      description: `Récapitulatif des factures du ${dateRange.startDate.toLocaleDateString()} au ${dateRange.endDate.toLocaleDateString()}`,
      details: filteredFactures
    };

    const doc = generateInvoicePDF(invoiceData, client, true);
    doc.save(`recap_factures_${client.nom}_${dateRange.startDate.toLocaleDateString()}_${dateRange.endDate.toLocaleDateString()}.pdf`);
    setPeriodDialog(false);
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!client) return <Alert severity="warning">Client non trouvé</Alert>;

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">
            {client.prenom} {client.nom}
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="success"
              onClick={handleExportExcel}
            >
              Exporter en Excel
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => navigate('/contract')}
            >
              Générer un contrat
            </Button>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/clients')}
            >
              Retour
            </Button>
          </Stack>
        </Stack>

        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
          <Tab label="Informations" />
          <Tab label="Factures" />
        </Tabs>

        {tabValue === 0 ? (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">Nom</Typography>
              <Typography variant="body1">{client.nom}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2">Prénom</Typography>
              <Typography variant="body1">{client.prenom}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2">Email</Typography>
              <Typography variant="body1">{client.email}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2">Entreprise</Typography>
              <Typography variant="body1">{client.entreprise}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2">CRNC</Typography>
              <Typography variant="body1">{client.crnc}</Typography>
            </Grid>
          </Grid>
        ) : (
          <Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              sx={{ mb: 2 }}
            >
              Nouvelle Facture
            </Button>

            <DataGrid
              rows={factures}
              columns={factureColumns}
              pageSize={5}
              rowsPerPageOptions={[5, 10]}
              autoHeight
              disableSelectionOnClick
              sx={{ minHeight: 400 }}
            />

            <Button
              variant="contained"
              color="info"
              onClick={() => setPeriodDialog(true)}
              startIcon={<DateRangeIcon />}
            >
              Facture par période
            </Button>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
              <DialogTitle>Nouvelle Facture</DialogTitle>
              <form onSubmit={handleAddFacture}>
                <DialogContent>
                  <Stack spacing={2}>
                    <TextField
                      label="Numéro de facture"
                      value={newFacture.numero}
                      onChange={(e) => setNewFacture({ ...newFacture, numero: e.target.value })}
                      required
                      fullWidth
                    />
                    <TextField
                      select
                      label="Type"
                      value={newFacture.type}
                      onChange={(e) => setNewFacture({ ...newFacture, type: e.target.value })}
                      required
                      fullWidth
                      SelectProps={{ native: true }}
                    >
                      <option value="service">Service</option>
                      <option value="produit">Produit</option>
                      <option value="consultation">Consultation</option>
                    </TextField>
                    <TextField
                      label="Date"
                      type="date"
                      value={newFacture.date}
                      onChange={(e) => setNewFacture({ ...newFacture, date: e.target.value })}
                      required
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Montant (€)"
                      type="number"
                      value={newFacture.montant}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Permettre la saisie de nombres décimaux
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setNewFacture({ ...newFacture, montant: value });
                        }
                      }}
                      inputProps={{
                        min: 0,
                        step: "0.01",
                        pattern: "^[0-9]*[.,]?[0-9]+$"
                      }}
                      required
                      fullWidth
                      error={newFacture.montant !== '' && Number(newFacture.montant) <= 0}
                      helperText={newFacture.montant !== '' && Number(newFacture.montant) <= 0 ? 
                        "Le montant doit être supérieur à 0" : ""}
                    />
                    <TextField
                      label="Description"
                      value={newFacture.description}
                      onChange={(e) => setNewFacture({ ...newFacture, description: e.target.value })}
                      multiline
                      rows={3}
                      fullWidth
                    />
                  </Stack>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
                  <Button type="submit" variant="contained">Enregistrer</Button>
                </DialogActions>
              </form>
            </Dialog>

            {/* Dialog pour la sélection de période */}
            <Dialog open={periodDialog} onClose={() => setPeriodDialog(false)}>
              <DialogTitle>Sélectionner une période</DialogTitle>
              <DialogContent>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                  <Stack spacing={3} sx={{ mt: 2 }}>
                    <DatePicker
                      label="Date de début"
                      value={dateRange.startDate}
                      onChange={(newValue) => setDateRange({ ...dateRange, startDate: newValue })}
                    />
                    <DatePicker
                      label="Date de fin"
                      value={dateRange.endDate}
                      onChange={(newValue) => setDateRange({ ...dateRange, endDate: newValue })}
                    />
                  </Stack>
                </LocalizationProvider>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setPeriodDialog(false)}>Annuler</Button>
                <Button 
                  onClick={handleGenerateInvoiceForPeriod}
                  disabled={!dateRange.startDate || !dateRange.endDate}
                  variant="contained"
                >
                  Générer
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ClientDetail; 