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
  Snackbar
} from '@mui/material';
import { DataGrid, frFR, GridActionsCellItem } from '@mui/x-data-grid';
import { 
  Add as AddIcon,
  Edit as EditIcon, 
  Delete as DeleteIcon 
} from '@mui/icons-material';

/**
 * Fournisseurs component - Manages suppliers data with CRUD operations
 */
const Fournisseurs = () => {
  const [loading, setLoading] = useState(true);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [error, setError] = useState(null);
  const [isAddingFournisseur, setIsAddingFournisseur] = useState(false);
  const [isEditingFournisseur, setIsEditingFournisseur] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fournisseurToDelete, setFournisseurToDelete] = useState(null);
  const [newFournisseur, setNewFournisseur] = useState({
    nom: '',
    telephone: '',
    adresse: ''
  });
  const [editingFournisseur, setEditingFournisseur] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Define the columns for DataGrid with edit/delete actions
  const columns = [
    { 
      field: 'id', 
      headerName: 'ID', 
      width: 70
    },
    { 
      field: 'nom', 
      headerName: 'Nom', 
      width: 250,
      flex: 1
    },
    {
      field: 'telephone',
      headerName: 'Téléphone',
      width: 150
    },
    {
      field: 'adresse',
      headerName: 'Adresse',
      width: 300,
      flex: 1
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      pinned: 'right',
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Modifier"
          onClick={() => handleEditFournisseur(params.row)}
          sx={{ color: '#FF9800' }}
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

  // Fetch suppliers from the API
  const fetchFournisseurs = async () => {
    setLoading(true);
    try {
      // Fetch suppliers
      const response = await fetch('http://localhost:8000/api/fournisseurs');
      const data = await handleApiError(response);
      setFournisseurs(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setError(`Erreur lors du chargement des fournisseurs: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFournisseurs();
  }, []);

  // Handle adding a new supplier
  const handleAddFournisseur = async (e) => {
    e.preventDefault();
    try {
      // Send the new supplier to the API
      const response = await fetch('http://localhost:8000/api/fournisseurs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newFournisseur),
      });

      await handleApiError(response);
      
      // Refresh the suppliers list
      await fetchFournisseurs();
      
      // Reset form and close dialog
      setNewFournisseur({
        nom: '',
        telephone: '',
        adresse: ''
      });
      setIsAddingFournisseur(false);
      showSnackbar('Fournisseur ajouté avec succès', 'success');
    } catch (error) {
      showSnackbar(error.message || 'Erreur lors de l\'ajout du fournisseur', 'error');
    }
  };

  // Handle opening the edit dialog for a supplier
  const handleEditFournisseur = (fournisseur) => {
    setEditingFournisseur(fournisseur);
    setIsEditingFournisseur(true);
  };

  // Handle updating a supplier
  const handleUpdateFournisseur = async (e) => {
    e.preventDefault();
    try {
      // Send the updated supplier to the API
      const response = await fetch(`http://localhost:8000/api/fournisseurs/${editingFournisseur.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingFournisseur),
      });

      await handleApiError(response);
      
      // Refresh the suppliers list
      await fetchFournisseurs();
      
      // Close dialog
      setIsEditingFournisseur(false);
      showSnackbar('Fournisseur modifié avec succès', 'success');
    } catch (error) {
      showSnackbar(error.message || 'Erreur lors de la modification du fournisseur', 'error');
    }
  };

  // Handle opening the delete confirmation dialog
  const handleDeleteClick = (fournisseur) => {
    setFournisseurToDelete(fournisseur);
    setDeleteConfirmOpen(true);
  };

  // Handle confirming the deletion
  const handleDeleteConfirm = async () => {
    try {
      // Send the delete request to the API
      const response = await fetch(`http://localhost:8000/api/fournisseurs/${fournisseurToDelete.id}`, {
        method: 'DELETE',
      });

      await handleApiError(response);
      
      // Refresh the data
      await fetchFournisseurs();
      
      // Close dialog and show success message
      setDeleteConfirmOpen(false);
      showSnackbar('Fournisseur supprimé avec succès', 'success');
    } catch (error) {
      showSnackbar(error.message || 'Erreur lors de la suppression du fournisseur', 'error');
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
          Fournisseurs
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddingFournisseur(true)}
        >
          Nouveau Fournisseur
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={fournisseurs}
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

      {/* Add Supplier Dialog */}
      <Dialog open={isAddingFournisseur} onClose={() => setIsAddingFournisseur(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ajouter un nouveau fournisseur</DialogTitle>
        <form onSubmit={handleAddFournisseur}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                label="Nom"
                value={newFournisseur.nom}
                onChange={(e) => setNewFournisseur({ ...newFournisseur, nom: e.target.value })}
                fullWidth
                required
                margin="normal"
              />
              <TextField
                label="Téléphone"
                value={newFournisseur.telephone}
                onChange={(e) => setNewFournisseur({ ...newFournisseur, telephone: e.target.value })}
                fullWidth
                required
                margin="normal"
              />
              <TextField
                label="Adresse"
                value={newFournisseur.adresse}
                onChange={(e) => setNewFournisseur({ ...newFournisseur, adresse: e.target.value })}
                fullWidth
                required
                margin="normal"
                multiline
                rows={2}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsAddingFournisseur(false)}>Annuler</Button>
            <Button type="submit" variant="contained" color="primary">Ajouter</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Supplier Dialog */}
      <Dialog open={isEditingFournisseur} onClose={() => setIsEditingFournisseur(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier le fournisseur</DialogTitle>
        <form onSubmit={handleUpdateFournisseur}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                label="Nom"
                value={editingFournisseur?.nom || ''}
                onChange={(e) => setEditingFournisseur({ ...editingFournisseur, nom: e.target.value })}
                fullWidth
                required
                margin="normal"
              />
              <TextField
                label="Téléphone"
                value={editingFournisseur?.telephone || ''}
                onChange={(e) => setEditingFournisseur({ ...editingFournisseur, telephone: e.target.value })}
                fullWidth
                required
                margin="normal"
              />
              <TextField
                label="Adresse"
                value={editingFournisseur?.adresse || ''}
                onChange={(e) => setEditingFournisseur({ ...editingFournisseur, adresse: e.target.value })}
                fullWidth
                required
                margin="normal"
                multiline
                rows={2}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsEditingFournisseur(false)}>Annuler</Button>
            <Button type="submit" variant="contained" color="primary">Enregistrer</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le fournisseur <strong>{fournisseurToDelete?.nom}</strong> ?
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

export default Fournisseurs; 