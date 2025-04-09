import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Snackbar,
  IconButton
} from '@mui/material';
import { DataGrid, frFR, GridActionsCellItem } from '@mui/x-data-grid';
import { 
  Add as AddIcon,
  Edit as EditIcon, 
  Delete as DeleteIcon 
} from '@mui/icons-material';
import { API_URL } from '../App';

/**
 * Produits_Services component - Displays tabs for products and services
 */
const Produits_Services = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [error, setError] = useState(null);
  const [isAddingService, setIsAddingService] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isEditingService, setIsEditingService] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [newService, setNewService] = useState({
    designation: '',
    incineration: 'Non'
  });
  const [newProduct, setNewProduct] = useState({
    designation: ''
  });
  const [editingService, setEditingService] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Define the columns for Products DataGrid with edit/delete actions
  const productColumns = [
    { 
      field: 'id', 
      headerName: 'ID', 
      width: 70
    },
    { 
      field: 'designation', 
      headerName: 'Désignation', 
      width: 500, 
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
          onClick={() => handleEditProduct(params.row)}
          sx={{ color: '#FF9800' }}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Supprimer"
          onClick={() => handleDeleteClick(params.row, 'produit')}
          sx={{ color: '#F44336' }}
        />
      ]
    }
  ];

  // Define the columns for Services DataGrid with edit/delete actions
  const serviceColumns = [
    { 
      field: 'id', 
      headerName: 'ID', 
      width: 70
    },
    { 
      field: 'designation', 
      headerName: 'Désignation', 
      width: 500, 
      flex: 1
    },
    {
      field: 'incineration',
      headerName: 'Incinération',
      width: 130,
      align: 'center',
      headerAlign: 'center'
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
          onClick={() => handleEditService(params.row)}
          sx={{ color: '#FF9800' }}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Supprimer"
          onClick={() => handleDeleteClick(params.row, 'service')}
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

  // Fetch products and services from the API
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch products
      const productsResponse = await fetch(`${API_URL}/produits`);
      const productsData = await handleApiError(productsResponse);
      setProducts(productsData);

      // Fetch services
      const servicesResponse = await fetch(`${API_URL}/services`);
      const servicesData = await handleApiError(servicesResponse);
      setServices(servicesData);

      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(`Erreur lors du chargement des données: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle adding a new service
  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      // Send the new service to the API
      const response = await fetch(`${API_URL}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newService),
      });

      await handleApiError(response);
      
      // Refresh the services list
      await fetchData();
      
      // Reset form and close dialog
      setNewService({
        designation: '',
        incineration: 'Non'
      });
      setIsAddingService(false);
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Service ajouté avec succès',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error adding service:', error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: 'error'
      });
    }
  };

  // Handle adding a new product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      // Send the new product to the API
      const response = await fetch(`${API_URL}/produits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct),
      });

      await handleApiError(response);
      
      // Refresh the products list
      await fetchData();
      
      // Reset form and close dialog
      setNewProduct({
        designation: ''
      });
      setIsAddingProduct(false);
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Produit ajouté avec succès',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error adding product:', error);
      setSnackbar({
        open: true,
        message: `Erreur: ${error.message}`,
        severity: 'error'
      });
    }
  };

  // Handle opening the edit dialog for a product
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsEditingProduct(true);
  };

  // Handle opening the edit dialog for a service
  const handleEditService = (service) => {
    setEditingService(service);
    setIsEditingService(true);
  };

  // Handle updating a product
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      // Send the updated product to the API
      const response = await fetch(`${API_URL}/produits/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingProduct),
      });

      await handleApiError(response);
      
      // Refresh the products list
      await fetchData();
      
      // Close dialog
      setIsEditingProduct(false);
      showSnackbar('Produit modifié avec succès', 'success');
    } catch (error) {
      showSnackbar(error.message || 'Erreur lors de la modification du produit', 'error');
    }
  };

  // Handle updating a service
  const handleUpdateService = async (e) => {
    e.preventDefault();
    try {
      // Send the updated service to the API
      const response = await fetch(`${API_URL}/services/${editingService.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingService),
      });

      await handleApiError(response);
      
      // Refresh the services list
      await fetchData();
      
      // Close dialog
      setIsEditingService(false);
      showSnackbar('Service modifié avec succès', 'success');
    } catch (error) {
      showSnackbar(error.message || 'Erreur lors de la modification du service', 'error');
    }
  };

  // Handle opening the delete confirmation dialog
  const handleDeleteClick = (item, type) => {
    setItemToDelete({ ...item, type });
    setDeleteConfirmOpen(true);
  };

  // Handle confirming the deletion
  const handleDeleteConfirm = async () => {
    try {
      const { id, type } = itemToDelete;
      const endpoint = type === 'produit' ? 'produits' : 'services';
      
      // Send the delete request to the API
      const response = await fetch(`${API_URL}/${endpoint}/${id}`, {
        method: 'DELETE',
      });

      await handleApiError(response);
      
      // Refresh the data
      await fetchData();
      
      // Close dialog and show success message
      setDeleteConfirmOpen(false);
      showSnackbar(`${type === 'produit' ? 'Produit' : 'Service'} supprimé avec succès`, 'success');
    } catch (error) {
      showSnackbar(error.message || 'Erreur lors de la suppression', 'error');
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
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>
        Produits et Services
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: 1, 
        borderColor: 'divider', 
        mb: 3 
      }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="produits et services tabs"
          sx={{ flexGrow: 1 }}
        >
          <Tab label="Produits" id="tab-0" aria-controls="tabpanel-0" />
          <Tab label="Services" id="tab-1" aria-controls="tabpanel-1" />
        </Tabs>
        {tabValue === 0 && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsAddingProduct(true)}
            sx={{ ml: 2 }}
          >
            Nouveau Produit
          </Button>
        )}
        {tabValue === 1 && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsAddingService(true)}
            sx={{ ml: 2 }}
          >
            Nouveau Service
          </Button>
        )}
      </Box>

      <div
        role="tabpanel"
        hidden={tabValue !== 0}
        id="tabpanel-0"
        aria-labelledby="tab-0"
      >
        {tabValue === 0 && (
          <Box sx={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={products}
              columns={productColumns}
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
        )}
      </div>

      <div
        role="tabpanel"
        hidden={tabValue !== 1}
        id="tabpanel-1"
        aria-labelledby="tab-1"
      >
        {tabValue === 1 && (
          <Box>
            <DataGrid
              rows={services}
              columns={serviceColumns}
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
        )}
      </div>

      {/* Add Product Dialog */}
      <Dialog open={isAddingProduct} onClose={() => setIsAddingProduct(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ajouter un nouveau produit</DialogTitle>
        <form onSubmit={handleAddProduct}>
          <DialogContent>
            <TextField
              label="Désignation"
              value={newProduct.designation}
              onChange={(e) => setNewProduct({ ...newProduct, designation: e.target.value })}
              fullWidth
              required
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsAddingProduct(false)}>Annuler</Button>
            <Button type="submit" variant="contained" color="primary">Ajouter</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditingProduct} onClose={() => setIsEditingProduct(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier le produit</DialogTitle>
        <form onSubmit={handleUpdateProduct}>
          <DialogContent>
            <TextField
              label="Désignation"
              value={editingProduct?.designation || ''}
              onChange={(e) => setEditingProduct({ ...editingProduct, designation: e.target.value })}
              fullWidth
              required
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsEditingProduct(false)}>Annuler</Button>
            <Button type="submit" variant="contained" color="primary">Enregistrer</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add Service Dialog */}
      <Dialog open={isAddingService} onClose={() => setIsAddingService(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ajouter un nouveau service</DialogTitle>
        <form onSubmit={handleAddService}>
          <DialogContent>
            <Stack spacing={3}>
              <TextField
                label="Désignation"
                value={newService.designation}
                onChange={(e) => setNewService({ ...newService, designation: e.target.value })}
                fullWidth
                required
                margin="normal"
              />
              <FormControl fullWidth required margin="normal">
                <InputLabel id="incineration-label">Incinération</InputLabel>
                <Select
                  labelId="incineration-label"
                  value={newService.incineration}
                  label="Incinération"
                  onChange={(e) => setNewService({ ...newService, incineration: e.target.value })}
                >
                  <MenuItem value="Oui">Oui</MenuItem>
                  <MenuItem value="Non">Non</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsAddingService(false)}>Annuler</Button>
            <Button type="submit" variant="contained" color="primary">Ajouter</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={isEditingService} onClose={() => setIsEditingService(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier le service</DialogTitle>
        <form onSubmit={handleUpdateService}>
          <DialogContent>
            <Stack spacing={3}>
              <TextField
                label="Désignation"
                value={editingService?.designation || ''}
                onChange={(e) => setEditingService({ ...editingService, designation: e.target.value })}
                fullWidth
                required
                margin="normal"
              />
              <FormControl fullWidth required margin="normal">
                <InputLabel id="edit-incineration-label">Incinération</InputLabel>
                <Select
                  labelId="edit-incineration-label"
                  value={editingService?.incineration || 'Non'}
                  label="Incinération"
                  onChange={(e) => setEditingService({ ...editingService, incineration: e.target.value })}
                >
                  <MenuItem value="Oui">Oui</MenuItem>
                  <MenuItem value="Non">Non</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsEditingService(false)}>Annuler</Button>
            <Button type="submit" variant="contained" color="primary">Enregistrer</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer {itemToDelete?.type === 'produit' ? 'le produit' : 'le service'} <strong>{itemToDelete?.designation}</strong> ?
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

export default Produits_Services; 