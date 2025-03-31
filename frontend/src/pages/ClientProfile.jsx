import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Grid,
  Tabs,
  Tab,
  Paper,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Container,
  Breadcrumbs,
  Link,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, parse } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * ClientProfile component displays a full page with client details, editable fields,
 * and tabs for related information
 */
const ClientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [client, setClient] = useState(null);
  const [agents, setAgents] = useState([]);
  const [editableFields, setEditableFields] = useState({
    nom: false,
    specialite: false,
    tel: false,
    mode: false,
    agent: false,
    etat_contrat: false,
    debut_contrat: false,
    fin_contrat: false
  });
  const [formData, setFormData] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch client data
  useEffect(() => {
    const fetchClientData = async () => {
      setLoading(true);
      try {
        // Fetch client
        const clientResponse = await fetch(`http://localhost:8000/api/clients/${id}`);
        if (!clientResponse.ok) {
          throw new Error(`Erreur HTTP: ${clientResponse.status}`);
        }
        const clientData = await clientResponse.json();
        setClient(clientData);
        
        // Initialize form data with client data
        setFormData({
          ...clientData,
          debut_contrat: clientData.debut_contrat ? parse(clientData.debut_contrat, 'dd/MM/yyyy', new Date()) : new Date(),
          fin_contrat: clientData.fin_contrat ? parse(clientData.fin_contrat, 'dd/MM/yyyy', new Date()) : new Date()
        });

        // Fetch agents for dropdown
        const agentsResponse = await fetch('http://localhost:8000/api/agents');
        if (!agentsResponse.ok) {
          throw new Error(`Erreur HTTP: ${agentsResponse.status}`);
        }
        const agentsData = await agentsResponse.json();
        setAgents(agentsData);

        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(`Erreur lors du chargement des données: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchClientData();
    }
  }, [id]);

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const toggleFieldEdit = (field) => {
    // If we're toggling from edit mode to view mode, save the changes
    if (editableFields[field]) {
      // Here we save the individual field
      saveClientData(field);
    }
    
    setEditableFields({
      ...editableFields,
      [field]: !editableFields[field]
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const saveClientData = async (field = null) => {
    try {
      const dataToUpdate = { ...formData };
      
      // Format dates
      if (!field || field === 'debut_contrat' || field === 'fin_contrat') {
        dataToUpdate.debut_contrat = format(formData.debut_contrat, 'dd/MM/yyyy');
        dataToUpdate.fin_contrat = format(formData.fin_contrat, 'dd/MM/yyyy');
      }
      
      // Send the updated client to the API
      const response = await fetch(`http://localhost:8000/api/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToUpdate),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      // Update client data
      const updatedClient = await response.json();
      setClient(updatedClient);
      
      showSnackbar('Client modifié avec succès', 'success');
    } catch (error) {
      showSnackbar(error.message || 'Erreur lors de la modification du client', 'error');
    }
  };

  const handleSaveChanges = () => {
    saveClientData();
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleBackToClients = () => {
    navigate('/clients');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !formData) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          {error || "Le client n'a pas été trouvé"}
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBackToClients}
          sx={{ mt: 2 }}
        >
          Retour à la liste des clients
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4, mt: 2 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBackToClients}
          sx={{ mb: 2 }}
        >
          Retour à la liste des clients
        </Button>
        
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link color="inherit" onClick={handleBackToClients} sx={{ cursor: 'pointer' }}>
            Clients
          </Link>
          <Typography color="text.primary">{formData.nom}</Typography>
        </Breadcrumbs>

        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
          Profil Client - {formData.nom}
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: 3, mb: 4, width: '100%' }}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Client Information - Top Third */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Informations du client
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Nom"
                  fullWidth
                  margin="normal"
                  value={formData.nom || ''}
                  onChange={(e) => handleChange('nom', e.target.value)}
                  disabled={!editableFields.nom}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => toggleFieldEdit('nom')} edge="end">
                          {editableFields.nom ? <SaveIcon color="primary" /> : <EditIcon sx={{ color: '#FF9800' }} />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Spécialité"
                  fullWidth
                  margin="normal"
                  value={formData.specialite || ''}
                  onChange={(e) => handleChange('specialite', e.target.value)}
                  disabled={!editableFields.specialite}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => toggleFieldEdit('specialite')} edge="end">
                          {editableFields.specialite ? <SaveIcon color="primary" /> : <EditIcon sx={{ color: '#FF9800' }} />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Téléphone"
                  fullWidth
                  margin="normal"
                  value={formData.tel || ''}
                  onChange={(e) => handleChange('tel', e.target.value)}
                  disabled={!editableFields.tel}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => toggleFieldEdit('tel')} edge="end">
                          {editableFields.tel ? <SaveIcon color="primary" /> : <EditIcon sx={{ color: '#FF9800' }} />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="mode-label">Mode (jours)</InputLabel>
                  <Select
                    labelId="mode-label"
                    label="Mode (jours)"
                    value={formData.mode || 30}
                    onChange={(e) => handleChange('mode', e.target.value)}
                    disabled={!editableFields.mode}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton onClick={() => toggleFieldEdit('mode')} edge="end" sx={{ mr: 2 }}>
                          {editableFields.mode ? <SaveIcon color="primary" /> : <EditIcon sx={{ color: '#FF9800' }} />}
                        </IconButton>
                      </InputAdornment>
                    }
                  >
                    <MenuItem value={30}>30 jours</MenuItem>
                    <MenuItem value={60}>60 jours</MenuItem>
                    <MenuItem value={90}>90 jours</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="agent-label">Agent</InputLabel>
                  <Select
                    labelId="agent-label"
                    label="Agent"
                    value={formData.agent || ''}
                    onChange={(e) => handleChange('agent', e.target.value)}
                    disabled={!editableFields.agent}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton onClick={() => toggleFieldEdit('agent')} edge="end" sx={{ mr: 2 }}>
                          {editableFields.agent ? <SaveIcon color="primary" /> : <EditIcon sx={{ color: '#FF9800' }} />}
                        </IconButton>
                      </InputAdornment>
                    }
                  >
                    {agents.map((agent) => (
                      <MenuItem key={agent.id} value={agent.nom}>
                        {agent.nom}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="etat-label">État Contrat</InputLabel>
                  <Select
                    labelId="etat-label"
                    label="État Contrat"
                    value={formData.etat_contrat || 'Actif'}
                    onChange={(e) => handleChange('etat_contrat', e.target.value)}
                    disabled={!editableFields.etat_contrat}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton onClick={() => toggleFieldEdit('etat_contrat')} edge="end" sx={{ mr: 2 }}>
                          {editableFields.etat_contrat ? <SaveIcon color="primary" /> : <EditIcon sx={{ color: '#FF9800' }} />}
                        </IconButton>
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="Actif">Actif</MenuItem>
                    <MenuItem value="En Pause">En Pause</MenuItem>
                    <MenuItem value="Terminé">Terminé</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                  <DatePicker
                    label="Début Contrat"
                    value={formData.debut_contrat}
                    onChange={(date) => handleChange('debut_contrat', date)}
                    disabled={!editableFields.debut_contrat}
                    format="dd/MM/yyyy"
                    slotProps={{ 
                      textField: { 
                        fullWidth: true, 
                        margin: 'normal',
                        InputProps: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => toggleFieldEdit('debut_contrat')} edge="end">
                                {editableFields.debut_contrat ? <SaveIcon color="primary" /> : <EditIcon sx={{ color: '#FF9800' }} />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }
                      } 
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                  <DatePicker
                    label="Fin Contrat"
                    value={formData.fin_contrat}
                    onChange={(date) => handleChange('fin_contrat', date)}
                    disabled={!editableFields.fin_contrat}
                    format="dd/MM/yyyy"
                    slotProps={{ 
                      textField: { 
                        fullWidth: true, 
                        margin: 'normal',
                        InputProps: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => toggleFieldEdit('fin_contrat')} edge="end">
                                {editableFields.fin_contrat ? <SaveIcon color="primary" /> : <EditIcon sx={{ color: '#FF9800' }} />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }
                      } 
                    }}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button 
                variant="contained" 
                onClick={handleSaveChanges}
                sx={{ minWidth: 150 }}
              >
                Enregistrer tout
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Tabs - Bottom Two Thirds */}
          <Box sx={{ flexGrow: 1, mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Transactions du client
            </Typography>
            <Paper elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                aria-label="client information tabs"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="Bons de livraison" id="tab-0" />
                <Tab label="Versements" id="tab-1" />
              </Tabs>
              
              {/* Bons de livraison Tab */}
              <Box
                role="tabpanel"
                hidden={tabValue !== 0}
                id="tabpanel-0"
                aria-labelledby="tab-0"
                sx={{ p: 3, minHeight: '40vh' }}
              >
                <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Contenu des bons de livraison à venir...
                </Typography>
              </Box>
              
              {/* Versements Tab */}
              <Box
                role="tabpanel"
                hidden={tabValue !== 1}
                id="tabpanel-1"
                aria-labelledby="tab-1"
                sx={{ p: 3, minHeight: '40vh' }}
              >
                <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Contenu des versements à venir...
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Paper>

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
    </Container>
  );
};

export default ClientProfile; 