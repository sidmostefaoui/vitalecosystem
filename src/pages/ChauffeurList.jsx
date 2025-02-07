import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';

const ChauffeurList = () => {
  const [chauffeurs, setChauffeurs] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedChauffeur, setSelectedChauffeur] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    numero_permis: '',
    date_embauche: '',
    statut: 'actif',
    adresse: {
      rue: '',
      code_postal: '',
      ville: '',
      pays: 'France',
      complement: ''
    },
    notes: ''
  });

  useEffect(() => {
    fetchChauffeurs();
  }, []);

  const fetchChauffeurs = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/chauffeurs');
      if (response.ok) {
        const data = await response.json();
        setChauffeurs(data);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = selectedChauffeur
        ? `http://localhost:8000/api/chauffeurs/${selectedChauffeur.id}`
        : 'http://localhost:8000/api/chauffeurs';
      
      const response = await fetch(url, {
        method: selectedChauffeur ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchChauffeurs();
        handleClose();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce chauffeur ?')) {
      try {
        const response = await fetch(`http://localhost:8000/api/chauffeurs/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          fetchChauffeurs();
        }
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  };

  const columns = [
    {
      field: 'nom_complet',
      headerName: 'Nom complet',
      width: 200,
      valueGetter: (params) => `${params.row.prenom} ${params.row.nom}`,
    },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'telephone', headerName: 'Téléphone', width: 130 },
    { field: 'numero_permis', headerName: 'N° Permis', width: 130 },
    {
      field: 'statut',
      headerName: 'Statut',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'actif' ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <IconButton
            size="small"
            onClick={() => {
              setSelectedChauffeur(params.row);
              setFormData(params.row);
              setOpenDialog(true);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDelete(params.row.id)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  const handleClose = () => {
    setOpenDialog(false);
    setSelectedChauffeur(null);
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      numero_permis: '',
      date_embauche: '',
      statut: 'actif',
      adresse: {
        rue: '',
        code_postal: '',
        ville: '',
        pays: 'France',
        complement: ''
      },
      notes: ''
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Chauffeurs
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Ajouter un chauffeur
          </Button>
        </Stack>

        <Paper sx={{ height: 600 }}>
          <DataGrid
            rows={chauffeurs}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
          />
        </Paper>

        <Dialog open={openDialog} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedChauffeur ? 'Modifier le chauffeur' : 'Ajouter un chauffeur'}
          </DialogTitle>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                {/* Informations personnelles */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                    Informations personnelles
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Prénom"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Téléphone"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>

                {/* Informations professionnelles */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2, mt: 2, color: 'primary.main' }}>
                    Informations professionnelles
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Numéro de permis"
                    value={formData.numero_permis}
                    onChange={(e) => setFormData({ ...formData, numero_permis: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Date d'embauche"
                    type="date"
                    value={formData.date_embauche}
                    onChange={(e) => setFormData({ ...formData, date_embauche: e.target.value })}
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Statut</InputLabel>
                    <Select
                      value={formData.statut}
                      onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                      label="Statut"
                    >
                      <MenuItem value="actif">Actif</MenuItem>
                      <MenuItem value="inactif">Inactif</MenuItem>
                    </Select>
                    <FormHelperText>Statut actuel du chauffeur</FormHelperText>
                  </FormControl>
                </Grid>

                {/* Adresse */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2, mt: 2, color: 'primary.main' }}>
                    Adresse
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Rue"
                    value={formData.adresse.rue}
                    onChange={(e) => setFormData({
                      ...formData,
                      adresse: { ...formData.adresse, rue: e.target.value }
                    })}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Code postal"
                    value={formData.adresse.code_postal}
                    onChange={(e) => setFormData({
                      ...formData,
                      adresse: { ...formData.adresse, code_postal: e.target.value }
                    })}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={8}>
                  <TextField
                    label="Ville"
                    value={formData.adresse.ville}
                    onChange={(e) => setFormData({
                      ...formData,
                      adresse: { ...formData.adresse, ville: e.target.value }
                    })}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Pays"
                    value={formData.adresse.pays}
                    onChange={(e) => setFormData({
                      ...formData,
                      adresse: { ...formData.adresse, pays: e.target.value }
                    })}
                    fullWidth
                    defaultValue="France"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Complément d'adresse"
                    value={formData.adresse.complement}
                    onChange={(e) => setFormData({
                      ...formData,
                      adresse: { ...formData.adresse, complement: e.target.value }
                    })}
                    fullWidth
                  />
                </Grid>

                {/* Notes */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2, mt: 2, color: 'primary.main' }}>
                    Notes additionnelles
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    fullWidth
                    multiline
                    rows={4}
                  />
                </Grid>
              </Grid>
            </form>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleClose} variant="outlined">
              Annuler
            </Button>
            <Button onClick={handleSubmit} variant="contained">
              {selectedChauffeur ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Box>
  );
};

export default ChauffeurList; 