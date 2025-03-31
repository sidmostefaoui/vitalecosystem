import React, { useState } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, parse } from 'date-fns';
import fr from 'date-fns/locale/fr';

/**
 * ClientProfileCard component displays client details with editable fields
 * and tabs for related information
 */
const ClientProfileCard = ({ open, handleClose, client, agents, onUpdate }) => {
  const [tabValue, setTabValue] = useState(0);
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
  const [formData, setFormData] = useState({
    ...client,
    debut_contrat: client.debut_contrat ? parse(client.debut_contrat, 'dd/MM/yyyy', new Date()) : new Date(),
    fin_contrat: client.fin_contrat ? parse(client.fin_contrat, 'dd/MM/yyyy', new Date()) : new Date()
  });

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const toggleFieldEdit = (field) => {
    // If we're toggling from edit mode to view mode, save the changes
    if (editableFields[field]) {
      // Here we would save the individual field
      if (onUpdate) {
        const dataToUpdate = { ...formData };
        
        // Format dates if needed
        if (field === 'debut_contrat' || field === 'fin_contrat') {
          dataToUpdate[field] = format(formData[field], 'dd/MM/yyyy');
        }
        
        onUpdate(dataToUpdate);
      }
    }
    
    setEditableFields({
      ...editableFields,
      [field]: !editableFields[field]
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSaveChanges = () => {
    if (onUpdate) {
      const dataToUpdate = {
        ...formData,
        debut_contrat: format(formData.debut_contrat, 'dd/MM/yyyy'),
        fin_contrat: format(formData.fin_contrat, 'dd/MM/yyyy')
      };
      onUpdate(dataToUpdate);
    }
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          width: '70%',
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
          Profil Client
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Client Information - Top Third */}
          <Box sx={{ mb: 3, pt: 1 }}>
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
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Tabs - Bottom Two Thirds */}
          <Box sx={{ flexGrow: 1, mt: 2 }}>
            <Paper elevation={0}>
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
                sx={{ p: 3, height: '40vh', overflow: 'auto' }}
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
                sx={{ p: 3, height: '40vh', overflow: 'auto' }}
              >
                <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Contenu des versements à venir...
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Fermer</Button>
        <Button variant="contained" onClick={handleSaveChanges}>Enregistrer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClientProfileCard; 