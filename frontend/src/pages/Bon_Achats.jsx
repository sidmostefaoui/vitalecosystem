import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Autocomplete,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment
} from '@mui/material';
import { DataGrid, frFR, GridActionsCellItem } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';

const Bon_Achats = () => {
  const [bonAchats, setBonAchats] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [produits, setProduits] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBon, setSelectedBon] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date(),
    fournisseur: '',
    produits: [{ produit: '', qte: '', prix: '', isEditing: true }]
  });
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [error, setError] = useState(null);
  const [editableFields, setEditableFields] = useState({
    date: false,
    fournisseur: false,
    produits: false
  });

  useEffect(() => {
    fetchBonAchats();
    fetchFournisseurs();
    fetchProduits();
  }, []);

  const fetchBonAchats = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/bon-achats');
      if (!response.ok) throw new Error('Erreur lors du chargement des bons d\'achats');
      const data = await response.json();
      setBonAchats(data);
    } catch (error) {
      console.error('Erreur:', error);
      showSnackbar('Erreur lors du chargement des bons d\'achats', 'error');
      setError('Erreur lors du chargement des bons d\'achats');
    } finally {
      setLoading(false);
    }
  };

  const fetchFournisseurs = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/fournisseurs');
      if (!response.ok) throw new Error('Erreur lors du chargement des fournisseurs');
      const data = await response.json();
      setFournisseurs(data);
    } catch (error) {
      console.error('Erreur:', error);
      showSnackbar('Erreur lors du chargement des fournisseurs', 'error');
    }
  };

  const fetchProduits = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/produits');
      if (!response.ok) throw new Error('Erreur lors du chargement des produits');
      const data = await response.json();
      setProduits(data);
    } catch (error) {
      console.error('Erreur:', error);
      showSnackbar('Erreur lors du chargement des produits', 'error');
    }
  };

  const handleOpenDialog = (bon = null) => {
    if (bon) {
      setSelectedBon(bon);
      fetchBonAchatProducts(bon.id);
      setFormData({
        date: new Date(bon.date.split('/').reverse().join('-')),
        fournisseur: bon.fournisseur,
        produits: []
      });
      setEditableFields({
        date: false,
        fournisseur: false,
        produits: false
      });
    } else {
      setSelectedBon(null);
      setFormData({
        date: new Date(),
        fournisseur: '',
        produits: [{ produit: '', qte: '', prix: '', isEditing: true }]
      });
      setEditableFields({
        date: true,
        fournisseur: true,
        produits: true
      });
    }
    setOpenDialog(true);
  };

  const fetchBonAchatProducts = async (bonId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/bon-achats/${bonId}/produits`);
      if (!response.ok) throw new Error('Erreur lors du chargement des produits du bon d\'achat');
      const data = await response.json();
      setFormData(prev => ({
        ...prev,
        produits: data.map(p => ({ 
          id: p.id,
          produit: p.produit, 
          qte: p.qte.toString(), 
          prix: p.prix?.toString() || '',
          isEditing: false
        }))
      }));
    } catch (error) {
      console.error('Erreur:', error);
      showSnackbar('Erreur lors du chargement des produits du bon d\'achat', 'error');
    }
  };

  const toggleFieldEditability = (field) => {
    setEditableFields({
      ...editableFields,
      [field]: !editableFields[field]
    });
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBon(null);
    setFormData({
      date: new Date(),
      fournisseur: '',
      produits: [{ produit: '', qte: '', prix: '', isEditing: true }]
    });
  };

  const handleProductChange = (index, field, value) => {
    const newProduits = [...formData.produits];
    newProduits[index][field] = value;
    setFormData({ ...formData, produits: newProduits });
  };

  const handleAddProduct = () => {
    setFormData({
      ...formData,
      produits: [...formData.produits, { produit: '', qte: '', prix: '', isEditing: true }]
    });
  };

  const handleDeleteProduct = (index) => {
    const newProduits = formData.produits.filter((_, i) => i !== index);
    setFormData({ ...formData, produits: newProduits });
  };

  const calculateTotal = () => {
    return formData.produits
      .filter(p => p.prix && p.qte)
      .reduce((sum, p) => sum + (parseFloat(p.prix) * parseFloat(p.qte)), 0)
      .toFixed(2);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.fournisseur) {
        showSnackbar('Veuillez sélectionner un fournisseur', 'error');
        return;
      }

      if (formData.produits.length === 0) {
        showSnackbar('Veuillez ajouter au moins un produit', 'error');
        return;
      }

      // Check if all products have required fields
      const invalidProducts = formData.produits.filter(p => !p.produit || !p.qte || !p.prix);
      if (invalidProducts.length > 0) {
        showSnackbar('Tous les produits doivent avoir un nom, une quantité et un prix', 'error');
        return;
      }

      const formattedDate = format(formData.date, 'dd/MM/yyyy');
      const totalAmount = parseFloat(calculateTotal());
      
      const bonData = {
        date: formattedDate,
        fournisseur: formData.fournisseur,
        montant_total: totalAmount,
        montant_verse: 0
      };

      let bonId;

      if (selectedBon) {
        // When editing, delete the old bon d'achat first
        bonId = selectedBon.id;

        // Delete the existing bon d'achat
        const deleteResponse = await fetch(`http://localhost:8000/api/bon-achats/${bonId}`, {
          method: 'DELETE',
        });

        if (!deleteResponse.ok) throw new Error('Erreur lors de la suppression du bon d\'achat');

        // Create a new bon d'achat with the same ID
        const createResponse = await fetch(`http://localhost:8000/api/bon-achats?id=${bonId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bonData),
        });

        if (!createResponse.ok) throw new Error('Erreur lors de la recréation du bon d\'achat');
        
        await createResponse.json();
      } else {
        // Adding a new bon d'achat
        const response = await fetch('http://localhost:8000/api/bon-achats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bonData),
        });

        if (!response.ok) throw new Error('Erreur lors de l\'enregistrement');
        
        const savedBon = await response.json();
        bonId = savedBon.id;
      }

      // Save products
      const validProducts = formData.produits.filter(p => p.produit && p.qte);
      for (const product of validProducts) {
        await fetch(`http://localhost:8000/api/bon-achats/${bonId}/produits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            produit: product.produit,
            qte: parseInt(product.qte),
            prix: product.prix ? parseFloat(product.prix) : null,
            bon_achat_id: bonId
          }),
        });
      }

      showSnackbar(
        selectedBon 
          ? 'Bon d\'achat modifié avec succès' 
          : 'Bon d\'achat ajouté avec succès', 
        'success'
      );

      handleCloseDialog();
      fetchBonAchats();
    } catch (error) {
      console.error('Erreur:', error);
      showSnackbar(error.message, 'error');
      setError(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce bon d\'achat ?')) return;

    try {
      const response = await fetch(`http://localhost:8000/api/bon-achats/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erreur lors de la suppression');

      showSnackbar('Bon d\'achat supprimé avec succès', 'success');
      fetchBonAchats();
    } catch (error) {
      console.error('Erreur:', error);
      showSnackbar(error.message, 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 90,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'super-app-theme--header',
    },
    {
      field: 'date',
      headerName: 'Date',
      width: 130,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'super-app-theme--header',
    },
    {
      field: 'fournisseur',
      headerName: 'Fournisseur',
      width: 200,
      flex: 1,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'super-app-theme--header',
    },
    {
      field: 'montant_total',
      headerName: 'Montant Total',
      width: 150,
      headerAlign: 'right',
      align: 'right',
      headerClassName: 'super-app-theme--header',
      valueFormatter: (params) => `${parseFloat(params.value).toFixed(2)} DA`,
    },
    {
      field: 'montant_verse',
      headerName: 'Montant Versé',
      width: 150,
      headerAlign: 'right',
      align: 'right',
      headerClassName: 'super-app-theme--header',
      valueFormatter: (params) => `${parseFloat(params.value).toFixed(2)} DA`,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 120,
      headerAlign: 'center',
      headerClassName: 'super-app-theme--header',
      pinned: 'right',
      getActions: (params) => [
        <GridActionsCellItem
          icon={<VisibilityIcon />}
          label="Voir"
          onClick={() => handleOpenDialog(params.row)}
          sx={{ color: '#2196F3', ml: 0.5 }}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Supprimer"
          onClick={() => handleDelete(params.row.id)}
          sx={{ color: 'red', ml: 0.5 }}
        />
      ],
    },
  ];

  return (
    <Box sx={{ height: 600, width: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Bons d'achats
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nouveau Bon d'achat
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={bonAchats}
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

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {selectedBon ? 'Modifier le bon d\'achat' : 'Nouveau bon d\'achat'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker
                label="Date"
                value={formData.date}
                onChange={(newValue) => setFormData({ ...formData, date: newValue })}
                slotProps={{ 
                  textField: { 
                    fullWidth: true, 
                    margin: 'normal',
                    disabled: selectedBon && !editableFields.date,
                    InputProps: selectedBon ? {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => toggleFieldEditability('date')} edge="end">
                            {editableFields.date ? <SaveIcon /> : <EditIcon sx={{ color: '#FF9800' }} />}
                          </IconButton>
                        </InputAdornment>
                      )
                    } : undefined
                  } 
                }}
              />
            </LocalizationProvider>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Autocomplete
              id="fournisseur-autocomplete"
              options={fournisseurs.map(f => f.nom)}
              value={formData.fournisseur}
              onChange={(event, newValue) => 
                setFormData({ ...formData, fournisseur: newValue || '' })
              }
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Fournisseur" 
                  fullWidth 
                  margin="normal"
                  required
                  disabled={selectedBon && !editableFields.fournisseur}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: selectedBon ? (
                      <>
                        {params.InputProps.endAdornment}
                        <InputAdornment position="end">
                          <IconButton onClick={() => toggleFieldEditability('fournisseur')} edge="end">
                            {editableFields.fournisseur ? <SaveIcon /> : <EditIcon sx={{ color: '#FF9800' }} />}
                          </IconButton>
                        </InputAdornment>
                      </>
                    ) : params.InputProps.endAdornment
                  }}
                />
              )}
              freeSolo
              autoSelect
              disabled={selectedBon && !editableFields.fournisseur}
              filterOptions={(options, params) => {
                const { inputValue } = params;
                const filtered = options.filter(option => 
                  option.toLowerCase().startsWith(inputValue.toLowerCase())
                );
                return filtered;
              }}
            />
          </Box>
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">Produits</Typography>
              {selectedBon && (
                <IconButton 
                  onClick={() => toggleFieldEditability('produits')} 
                  sx={{ ml: 1 }}
                  color={editableFields.produits ? "primary" : "default"}
                >
                  {editableFields.produits ? <SaveIcon /> : <EditIcon sx={{ color: '#FF9800' }} />}
                </IconButton>
              )}
            </Box>
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Produit</TableCell>
                    <TableCell align="center" sx={{ px: 1, width: '50px' }}>Qte</TableCell>
                    <TableCell align="center" sx={{ px: 1, width: '100px' }}>Prix</TableCell>
                    {(!selectedBon || editableFields.produits) && (
                      <TableCell align="center" sx={{ width: '50px', p: 0 }}>Actions</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.produits.map((produit, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {(!selectedBon || editableFields.produits) ? (
                          <Autocomplete
                            freeSolo
                            autoSelect
                            options={produits.map(p => p.designation)}
                            value={produit.produit}
                            onChange={(event, newValue) => handleProductChange(index, 'produit', newValue || '')}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder="Nom du produit"
                                variant="standard"
                                fullWidth
                              />
                            )}
                            filterOptions={(options, params) => {
                              const { inputValue } = params;
                              const filtered = options.filter(option => 
                                option.toLowerCase().includes(inputValue.toLowerCase())
                              );
                              return filtered;
                            }}
                          />
                        ) : (
                          <Typography>{produit.produit}</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center" sx={{ px: 1 }}>
                        {(!selectedBon || editableFields.produits) ? (
                          <TextField
                            type="number"
                            value={produit.qte}
                            onChange={(e) => handleProductChange(index, 'qte', e.target.value)}
                            placeholder="Qte"
                            variant="standard"
                            inputProps={{ min: "1" }}
                            sx={{ width: '50px' }}
                          />
                        ) : (
                          <Typography>{produit.qte}</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center" sx={{ px: 1 }}>
                        {(!selectedBon || editableFields.produits) ? (
                          <TextField
                            type="number"
                            value={produit.prix}
                            onChange={(e) => handleProductChange(index, 'prix', e.target.value)}
                            placeholder="Prix"
                            variant="standard"
                            required
                            error={!produit.prix}
                            inputProps={{ 
                              min: "0",
                              style: { textAlign: 'right' }
                            }}
                            sx={{ 
                              width: '100px',
                              '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                                '-webkit-appearance': 'none',
                                margin: 0
                              },
                              '& input[type=number]': {
                                '-moz-appearance': 'textfield'
                              }
                            }}
                          />
                        ) : (
                          <Typography>{produit.prix} DA</Typography>
                        )}
                      </TableCell>
                      {(!selectedBon || editableFields.produits) && (
                        <TableCell align="center" sx={{ width: '50px', p: 0 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteProduct(index)}
                            sx={{ color: 'red' }}
                          >
                            <CloseIcon />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                TOTAL: {calculateTotal()} DA
              </Typography>
              {(!selectedBon || editableFields.produits) && (
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddProduct}
                  variant="outlined"
                  size="small"
                >
                  Ajouter un produit
                </Button>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedBon ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Bon_Achats; 