// Formulaire de création/édition de mission
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  FormHelperText,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object().shape({
  chauffeur_id: yup.number().required('Chauffeur requis'),
  client_id: yup.number().required('Client requis'),
  date_debut: yup.date().required('Date de début requise'),
  date_fin: yup.date().required('Date de fin requise')
    .min(yup.ref('date_debut'), 'La date de fin doit être après la date de début'),
  type_mission: yup.string().required('Type de mission requis'),
  description: yup.string(),
  statut: yup.string().required('Statut requis'),
  adresse_pickup: yup.object().shape({
    rue: yup.string().required('Rue requise'),
    code_postal: yup.string().required('Code postal requis'),
    ville: yup.string().required('Ville requise'),
  }),
  adresse_delivery: yup.object().shape({
    rue: yup.string().required('Rue requise'),
    code_postal: yup.string().required('Code postal requis'),
    ville: yup.string().required('Ville requise'),
  }),
});

const MissionForm = ({
  open,
  onClose,
  mission,
  onSubmit,
  chauffeurs,
  clients,
}) => {
  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: mission || {
      chauffeur_id: '',
      client_id: '',
      date_debut: null,
      date_fin: null,
      type_mission: '',
      description: '',
      statut: 'planifié',
      adresse_pickup: {
        rue: '',
        code_postal: '',
        ville: '',
        pays: 'France',
      },
      adresse_delivery: {
        rue: '',
        code_postal: '',
        ville: '',
        pays: 'France',
      },
    },
  });

  React.useEffect(() => {
    if (mission) {
      reset(mission);
    }
  }, [mission, reset]);

  const handleFormSubmit = async (data) => {
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mission ? 'Modifier la mission' : 'Nouvelle mission'}
      </DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Chauffeur */}
            <Grid item xs={12} md={6}>
              <Controller
                name="chauffeur_id"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.chauffeur_id}>
                    <InputLabel>Chauffeur</InputLabel>
                    <Select {...field} label="Chauffeur">
                      {chauffeurs.map(chauffeur => (
                        <MenuItem key={chauffeur.id} value={chauffeur.id}>
                          {`${chauffeur.prenom} ${chauffeur.nom}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Client */}
            <Grid item xs={12} md={6}>
              <Controller
                name="client_id"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.client_id}>
                    <InputLabel>Client</InputLabel>
                    <Select {...field} label="Client">
                      {clients.map(client => (
                        <MenuItem key={client.id} value={client.id}>
                          {client.entreprise}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Dates */}
            <Grid item xs={12} md={6}>
              <Controller
                name="date_debut"
                control={control}
                render={({ field }) => (
                  <DateTimePicker
                    {...field}
                    label="Date de début"
                    renderInput={(params) => (
                      <TextField {...params} fullWidth error={!!errors.date_debut} />
                    )}
                  />
                )}
              />
            </Grid>

            {/* Date de fin */}
            <Grid item xs={12} md={6}>
              <Controller
                name="date_fin"
                control={control}
                render={({ field }) => (
                  <DateTimePicker
                    {...field}
                    label="Date de fin"
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        fullWidth 
                        error={!!errors.date_fin}
                        helperText={errors.date_fin?.message}
                      />
                    )}
                  />
                )}
              />
            </Grid>

            {/* Type de mission */}
            <Grid item xs={12} md={6}>
              <Controller
                name="type_mission"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.type_mission}>
                    <InputLabel>Type de mission</InputLabel>
                    <Select {...field} label="Type de mission">
                      <MenuItem value="livraison">Livraison</MenuItem>
                      <MenuItem value="collecte">Collecte</MenuItem>
                      <MenuItem value="transport">Transport</MenuItem>
                    </Select>
                    {errors.type_mission && (
                      <FormHelperText>{errors.type_mission.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* Statut */}
            <Grid item xs={12} md={6}>
              <Controller
                name="statut"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.statut}>
                    <InputLabel>Statut</InputLabel>
                    <Select {...field} label="Statut">
                      <MenuItem value="planifié">Planifié</MenuItem>
                      <MenuItem value="en_cours">En cours</MenuItem>
                      <MenuItem value="terminé">Terminé</MenuItem>
                      <MenuItem value="annulé">Annulé</MenuItem>
                    </Select>
                    {errors.statut && (
                      <FormHelperText>{errors.statut.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* Adresse de départ */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Adresse de départ
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="adresse_pickup.rue"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Rue"
                        fullWidth
                        error={!!errors.adresse_pickup?.rue}
                        helperText={errors.adresse_pickup?.rue?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Controller
                    name="adresse_pickup.code_postal"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Code postal"
                        fullWidth
                        error={!!errors.adresse_pickup?.code_postal}
                        helperText={errors.adresse_pickup?.code_postal?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Controller
                    name="adresse_pickup.ville"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Ville"
                        fullWidth
                        error={!!errors.adresse_pickup?.ville}
                        helperText={errors.adresse_pickup?.ville?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Adresse de livraison */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Adresse de livraison
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="adresse_delivery.rue"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Rue"
                        fullWidth
                        error={!!errors.adresse_delivery?.rue}
                        helperText={errors.adresse_delivery?.rue?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Controller
                    name="adresse_delivery.code_postal"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Code postal"
                        fullWidth
                        error={!!errors.adresse_delivery?.code_postal}
                        helperText={errors.adresse_delivery?.code_postal?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Controller
                    name="adresse_delivery.ville"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Ville"
                        fullWidth
                        error={!!errors.adresse_delivery?.ville}
                        helperText={errors.adresse_delivery?.ville?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    multiline
                    rows={4}
                    fullWidth
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Annuler</Button>
          <Button type="submit" variant="contained" color="primary">
            {mission ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MissionForm; 