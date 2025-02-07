import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Stack,
  Alert,
  Grid,
  Snackbar
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import jsPDF from 'jspdf';

const ContractGenerator = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom: '',
    prenom: ''
  });
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const handleGenerateContract = () => {
    try {
      if (!formData.nom || !formData.prenom) {
        setError('Veuillez remplir tous les champs');
        return;
      }

      const doc = new jsPDF();
      
      // Configuration du document
      doc.setFont("helvetica");
      doc.setFontSize(20);
      
      // En-tête
      doc.text("CONTRAT D'ACCORD", 105, 20, { align: "center" });
      
      doc.setFontSize(12);
      
      // Informations des parties
      doc.text("ENTRE LES SOUSSIGNÉS :", 20, 40);
      doc.text("D'une part,", 20, 50);
      doc.text("La société XYZ, représentée par [Nom du représentant]", 20, 60);
      doc.text("Siège social : [Adresse]", 20, 70);
      doc.text("N° SIRET : [Numéro SIRET]", 20, 80);
      
      doc.text("ET", 20, 100);
      doc.text("D'autre part,", 20, 110);
      doc.text(`M./Mme ${formData.prenom} ${formData.nom}`, 20, 120);
      
      // Corps du contrat
      doc.text("IL A ÉTÉ CONVENU CE QUI SUIT :", 20, 140);
      
      doc.text("Article 1 - Objet", 20, 160);
      doc.text("Le présent contrat a pour objet de définir les conditions de collaboration", 20, 170);
      doc.text("entre les parties.", 20, 180);
      
      doc.text("Article 2 - Durée", 20, 200);
      doc.text("Le présent contrat est conclu pour une durée indéterminée à compter", 20, 210);
      doc.text("de sa signature.", 20, 220);
      
      // Signatures
      doc.text("Fait à _____________, le " + new Date().toLocaleDateString(), 20, 250);
      
      doc.text("La société XYZ", 40, 270);
      doc.text(`M./Mme ${formData.prenom} ${formData.nom}`, 140, 270);
      
      // Sauvegarde du PDF avec try-catch
      try {
        doc.save(`contrat_${formData.nom}_${formData.prenom}.pdf`);
        setSnackbar({ open: true, message: 'Contrat généré avec succès!' });
        console.log('Contrat généré avec succès');
      } catch (saveError) {
        console.error('Erreur lors de la sauvegarde du PDF:', saveError);
        throw new Error('Erreur lors de la sauvegarde du contrat');
      }

    } catch (err) {
      console.error('Erreur lors de la génération du contrat:', err);
      setError('Erreur lors de la génération du contrat: ' + err.message);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            Générateur de Contrat
          </Typography>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/clients')}
          >
            Retour
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Nom"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              fullWidth
              required
              error={!formData.nom && error}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Prénom"
              value={formData.prenom}
              onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
              fullWidth
              required
              error={!formData.prenom && error}
            />
          </Grid>
        </Grid>

        <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerateContract}
            disabled={!formData.nom || !formData.prenom}
          >
            Générer le contrat
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/clients')}
          >
            Annuler
          </Button>
        </Stack>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
};

export default ContractGenerator; 