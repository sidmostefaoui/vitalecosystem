import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert,
  Box
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { API_URL } from '../App';

/**
 * Dialog component for creating or updating a versement forfait
 */
const VersementForfaitDialog = ({ 
  open, 
  onClose, 
  clientId, 
  versement = null, 
  onSave, 
  contracts = [] 
}) => {
  // Find active contract
  const activeContract = contracts.find(c => c.etat === 'Actif');
  
  // State for the versement data
  const [formData, setFormData] = useState({
    date: new Date(),
    montant: '',
    client_id: clientId,
    contrat_id: activeContract?.id || ''
  });
  
  // State for loading status
  const [loading, setLoading] = useState(false);
  
  // State for form errors
  const [errors, setErrors] = useState({});
  
  // Check if we're in edit mode
  const isEditMode = versement !== null;
  
  // Initialize form data when the component mounts or when versement changes
  useEffect(() => {
    if (isEditMode && versement) {
      // Parse the date from string format to Date object
      let parsedDate;
      try {
        const [day, month, year] = versement.date.split('/');
        parsedDate = new Date(year, month - 1, day);
      } catch (e) {
        parsedDate = new Date();
      }
      
      setFormData({
        date: parsedDate,
        montant: versement.montant,
        client_id: versement.client_id,
        contrat_id: versement.contrat_id
      });
    } else {
      // Default values for new versement
      setFormData({
        date: new Date(),
        montant: '',
        client_id: clientId,
        contrat_id: activeContract?.id || ''
      });
    }
  }, [versement, clientId, isEditMode, contracts, activeContract]);
  
  // Handle changes to form fields
  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
    
    // Clear error for this field if there was one
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: null
      });
    }
  };
  
  // Validate the form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.date) {
      newErrors.date = 'La date est requise';
    }
    
    if (!formData.montant || formData.montant <= 0) {
      newErrors.montant = 'Le montant doit être supérieur à 0';
    }
    
    if (!formData.contrat_id) {
      newErrors.submit = 'Aucun contrat actif trouvé. Veuillez activer un contrat avant de créer un versement.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Format the date for submission
      const formattedDate = format(formData.date, 'yyyy-MM-dd');
      
      let response;
      if (versement) {
        // Update existing versement
        response = await fetch(`${API_URL}/versements-forfait/${versement.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            date: formattedDate,
          }),
        });
      } else {
        // Create new versement
        response = await fetch(`${API_URL}/versements-forfait`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            date: formattedDate,
          }),
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors de la sauvegarde');
      }
      
      // Show success message and close dialog
      showSnackbar('Versement sauvegardé avec succès', 'success');
      onSave(await response.json(), isEditMode);
      onClose();
    } catch (error) {
      console.error('Error saving versement:', error);
      showSnackbar(`Erreur: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  // Function to show snackbar
  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditMode ? 'Modifier le versement' : 'Nouveau versement'}
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker
                label="Date"
                value={formData.date}
                onChange={(newValue) => handleChange('date', newValue)}
                slotProps={{ 
                  textField: { 
                    fullWidth: true, 
                    margin: 'normal',
                    error: Boolean(errors.date),
                    helperText: errors.date
                  } 
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Montant (DA)"
              value={formData.montant}
              onChange={(e) => handleChange('montant', e.target.value)}
              type="number"
              fullWidth
              margin="normal"
              error={Boolean(errors.montant)}
              helperText={errors.montant}
              InputProps={{
                endAdornment: <InputAdornment position="end">DA</InputAdornment>,
              }}
            />
          </Grid>
          
          {activeContract && (
            <Grid item xs={12}>
              <TextField
                label="Contrat"
                value={`Du ${activeContract.date_debut} au ${activeContract.date_fin} - ${activeContract.montant} DA`}
                fullWidth
                margin="normal"
                disabled
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
          )}
          
          {errors.submit && (
            <Grid item xs={12}>
              <p style={{ color: '#d32f2f', fontSize: '0.875rem' }}>
                {errors.submit}
              </p>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Annuler
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading || !activeContract}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {isEditMode ? 'Modifier' : 'Enregistrer'}
        </Button>
      </DialogActions>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default VersementForfaitDialog; 