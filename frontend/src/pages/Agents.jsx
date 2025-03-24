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
  CircularProgress,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Tooltip
} from '@mui/material';
import { DataGrid, frFR, GridActionsCellItem } from '@mui/x-data-grid';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
  Save as SaveIcon
} from '@mui/icons-material';

/**
 * Agents component - Displays a list of agents in a grid with CRUD operations
 */
const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [isEditingAgent, setIsEditingAgent] = useState(false);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [editableFields, setEditableFields] = useState({
    nom: false,
    telephone: false,
    whatsapp: false,
    gps: false,
    regime: false,
    notification: false
  });
  const [newAgent, setNewAgent] = useState({
    nom: '',
    telephone: '',
    whatsapp: '',
    gps: '',
    regime: 'Forfait',
    notification: 'Actif'
  });
  const [gpsError, setGpsError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Régime options
  const regimeOptions = ['Forfait', 'Réel', 'Forfait & Réel'];

  // Notifications options
  const notificationOptions = ['Actif', 'Pause'];

  // Define the columns for the DataGrid
  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'nom', headerName: 'Nom', width: 200 },
    { field: 'telephone', headerName: 'Téléphone', width: 150 },
    { field: 'whatsapp', headerName: 'Whatsapp', width: 150 },
    { field: 'gps', headerName: 'GPS', width: 250 },
    { 
      field: 'regime', 
      headerName: 'Régime', 
      width: 150,
      valueFormatter: (params) => params.value || 'Forfait'
    },
    { 
      field: 'notification', 
      headerName: 'Notifications', 
      width: 130,
      valueFormatter: (params) => params.value || 'Actif'
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
          onClick={() => handleEditClick(params.row)}
          sx={{ color: '#FF9800' }}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Supprimer"
          onClick={() => handleDeleteAgent(params.row.id)}
          sx={{ color: '#F44336' }}
        />,
        <GridActionsCellItem
          icon={<CalendarIcon />}
          label="Calendrier"
          onClick={() => {}}
          sx={{ color: '#1976D2' }}
        />
      ]
    }
  ];

  // Validate GPS coordinates (latitude,longitude) with 5 decimal points
  const validateGPS = (gps) => {
    if (!gps) return false;
    
    const regex = /^(-?\d+\.\d{5}),\s*(-?\d+\.\d{5})$/;
    return regex.test(gps);
  };

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

  // Check API connectivity
  const checkApiHealth = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/agents');
      if (response.status === 500) {
        const data = await response.json();
        throw new Error(data.detail || 'Erreur de serveur');
      }
      return true;
    } catch (error) {
      setError(`Impossible de se connecter à l'API: ${error.message}`);
      return false;
    }
  };

  // Fetch agents from the API
  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/agents');
      const data = await handleApiError(response);
      setAgents(data);
    } catch (error) {
      showSnackbar(error.message || 'Erreur lors du chargement des agents', 'error');
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  // Load agents on component mount
  useEffect(() => {
    const loadData = async () => {
      const isHealthy = await checkApiHealth();
      if (isHealthy) {
        await fetchAgents();
      } else {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleAddAgent = async (e) => {
    e.preventDefault();
    
    // Validate GPS coordinates
    if (!validateGPS(newAgent.gps)) {
      setGpsError('Format invalide. Utilisez: latitude,longitude (5 décimales). Ex: 36.75234, 3.04215');
      return;
    }

    try {
      // Send the new agent to the API
      const response = await fetch('http://localhost:8000/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAgent),
      });

      // Get the new agent with its ID from the response
      const createdAgent = await handleApiError(response);
      
      // Refresh the agents list
      await fetchAgents();
      
      // Reset form and close dialog
      setNewAgent({
        nom: '',
        telephone: '',
        whatsapp: '',
        gps: '',
        regime: 'Forfait',
        notification: 'Actif'
      });
      setGpsError('');
      setIsAddingAgent(false);
      showSnackbar('Agent ajouté avec succès', 'success');
    } catch (error) {
      showSnackbar(error.message || 'Erreur lors de l\'ajout de l\'agent', 'error');
    }
  };

  const handleEditClick = (agent) => {
    setCurrentAgent({...agent});
    setEditableFields({
      nom: false,
      telephone: false,
      whatsapp: false,
      gps: false,
      regime: false,
      notification: false
    });
    setIsEditingAgent(true);
    setGpsError('');
  };

  const handleSaveEdit = async () => {
    // Validate GPS if it's been edited
    if (editableFields.gps && !validateGPS(currentAgent.gps)) {
      setGpsError('Format invalide. Utilisez: latitude,longitude (5 décimales). Ex: 36.75234, 3.04215');
      return;
    }

    try {
      // Update the agent via the API
      const response = await fetch(`http://localhost:8000/api/agents/${currentAgent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentAgent),
      });

      await handleApiError(response);

      // Refresh the agents list
      await fetchAgents();
      
      setIsEditingAgent(false);
      setCurrentAgent(null);
      setGpsError('');
      showSnackbar('Agent mis à jour avec succès', 'success');
    } catch (error) {
      showSnackbar(error.message || 'Erreur lors de la mise à jour de l\'agent', 'error');
    }
  };

  const handleDeleteAgent = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet agent ?')) {
      try {
        const response = await fetch(`http://localhost:8000/api/agents/${id}`, {
          method: 'DELETE',
        });

        await handleApiError(response);

        // Refresh the agents list
        await fetchAgents();
        showSnackbar('Agent supprimé avec succès', 'success');
      } catch (error) {
        showSnackbar(error.message || 'Erreur lors de la suppression de l\'agent', 'error');
      }
    }
  };

  const toggleFieldEditability = (field) => {
    setEditableFields({
      ...editableFields,
      [field]: !editableFields[field]
    });
  };

  const handleFieldChange = (field, value) => {
    setCurrentAgent({
      ...currentAgent,
      [field]: value
    });

    // Validate GPS field if it's being edited
    if (field === 'gps') {
      if (value && !validateGPS(value)) {
        setGpsError('Format invalide. Utilisez: latitude,longitude (5 décimales). Ex: 36.75234, 3.04215');
      } else {
        setGpsError('');
      }
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleGpsChange = (e) => {
    const value = e.target.value;
    setNewAgent({ ...newAgent, gps: value });
    
    if (value && !validateGPS(value)) {
      setGpsError('Format invalide. Utilisez: latitude,longitude (5 décimales). Ex: 36.75234, 3.04215');
    } else {
      setGpsError('');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Agents
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddingAgent(true)}
        >
          Nouveau Agent
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <DataGrid
        rows={agents}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10, 25, 50]}
        autoHeight
        disableRowSelectionOnClick
        disableColumnSelector
        hideFooterSelectedRowCount
        localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
        sx={{
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 'bold',
          }
        }}
      />

      {/* Add Agent Dialog */}
      <Dialog open={isAddingAgent} onClose={() => setIsAddingAgent(false)} maxWidth="md" fullWidth>
        <DialogTitle>Ajouter un nouvel agent</DialogTitle>
        <form onSubmit={handleAddAgent}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                label="Nom"
                value={newAgent.nom}
                onChange={(e) => setNewAgent({ ...newAgent, nom: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Téléphone"
                value={newAgent.telephone}
                onChange={(e) => setNewAgent({ ...newAgent, telephone: e.target.value })}
                required
                fullWidth
                helperText="Format: 0XXXXXXXXX"
              />
              <TextField
                label="Whatsapp"
                value={newAgent.whatsapp}
                onChange={(e) => setNewAgent({ ...newAgent, whatsapp: e.target.value })}
                required
                fullWidth
                helperText="Format: 0XXXXXXXXX"
              />
              <TextField
                label="GPS"
                value={newAgent.gps}
                onChange={handleGpsChange}
                required
                fullWidth
                error={!!gpsError}
                helperText={gpsError || "Format: latitude,longitude (ex: 36.75234, 3.04215)"}
              />
              <FormControl fullWidth required>
                <InputLabel id="regime-label">Régime</InputLabel>
                <Select
                  labelId="regime-label"
                  value={newAgent.regime}
                  label="Régime"
                  onChange={(e) => setNewAgent({ ...newAgent, regime: e.target.value })}
                >
                  {regimeOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Sélectionnez le régime de l'agent</FormHelperText>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel id="notification-label">Notifications</InputLabel>
                <Select
                  labelId="notification-label"
                  value={newAgent.notification}
                  label="Notifications"
                  onChange={(e) => setNewAgent({ ...newAgent, notification: e.target.value })}
                >
                  {notificationOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>État des notifications</FormHelperText>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsAddingAgent(false)}>Annuler</Button>
            <Button type="submit" variant="contained">Ajouter</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Agent Dialog */}
      <Dialog open={isEditingAgent} onClose={() => setIsEditingAgent(false)} maxWidth="md" fullWidth>
        <DialogTitle>Modifier l'agent</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nom"
              value={currentAgent?.nom || ''}
              onChange={(e) => handleFieldChange('nom', e.target.value)}
              fullWidth
              disabled={!editableFields.nom}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => toggleFieldEditability('nom')}
                      edge="end"
                    >
                      {editableFields.nom ? <SaveIcon /> : <EditIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Téléphone"
              value={currentAgent?.telephone || ''}
              onChange={(e) => handleFieldChange('telephone', e.target.value)}
              fullWidth
              disabled={!editableFields.telephone}
              helperText="Format: 0XXXXXXXXX"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => toggleFieldEditability('telephone')}
                      edge="end"
                    >
                      {editableFields.telephone ? <SaveIcon /> : <EditIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Whatsapp"
              value={currentAgent?.whatsapp || ''}
              onChange={(e) => handleFieldChange('whatsapp', e.target.value)}
              fullWidth
              disabled={!editableFields.whatsapp}
              helperText="Format: 0XXXXXXXXX"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => toggleFieldEditability('whatsapp')}
                      edge="end"
                    >
                      {editableFields.whatsapp ? <SaveIcon /> : <EditIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="GPS"
              value={currentAgent?.gps || ''}
              onChange={(e) => handleFieldChange('gps', e.target.value)}
              fullWidth
              disabled={!editableFields.gps}
              error={!!gpsError}
              helperText={gpsError || "Format: latitude,longitude (ex: 36.75234, 3.04215)"}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => toggleFieldEditability('gps')}
                      edge="end"
                    >
                      {editableFields.gps ? <SaveIcon /> : <EditIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <FormControl fullWidth>
              <InputLabel id="edit-regime-label">Régime</InputLabel>
              <Select
                labelId="edit-regime-label"
                value={currentAgent?.regime || 'Forfait'}
                label="Régime"
                onChange={(e) => handleFieldChange('regime', e.target.value)}
                disabled={!editableFields.regime}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => toggleFieldEditability('regime')}
                      edge="end"
                    >
                      {editableFields.regime ? <SaveIcon /> : <EditIcon />}
                    </IconButton>
                  </InputAdornment>
                }
              >
                {regimeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Régime de l'agent</FormHelperText>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="edit-notification-label">Notifications</InputLabel>
              <Select
                labelId="edit-notification-label"
                value={currentAgent?.notification || 'Actif'}
                label="Notifications"
                onChange={(e) => handleFieldChange('notification', e.target.value)}
                disabled={!editableFields.notification}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => toggleFieldEditability('notification')}
                      edge="end"
                    >
                      {editableFields.notification ? <SaveIcon /> : <EditIcon />}
                    </IconButton>
                  </InputAdornment>
                }
              >
                {notificationOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>État des notifications</FormHelperText>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditingAgent(false)}>Annuler</Button>
          <Button onClick={handleSaveEdit} variant="contained" color="primary">
            Enregistrer
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

export default Agents; 