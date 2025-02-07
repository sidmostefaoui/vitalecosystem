import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
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
  Grid,
  Chip,
  IconButton,
  Stack,
  ButtonGroup,
  FormControlLabel,
  Switch,
  FormGroup,
  FormLabel,
  Checkbox,
  RadioGroup,
  Radio,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker, DatePicker } from '@mui/x-date-pickers';
import { fr } from 'date-fns/locale';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import MissionMap from '../components/MissionMap';
import { useAuth } from '../contexts/AuthContext';

const Planning = () => {
  const [missions, setMissions] = useState([]);
  const [chauffeurs, setChauffeurs] = useState([]);
  const [clients, setClients] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMission, setSelectedMission] = useState(null);
  const { token } = useAuth();
  const [formData, setFormData] = useState({
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
      complement: '',
      latitude: null,
      longitude: null
    },
  });
  const [viewMode, setViewMode] = useState('list');
  const [showRecurrence, setShowRecurrence] = useState(false);
  const [recurrenceData, setRecurrenceData] = useState({
    type: 'daily',
    interval: 1,
    jours_semaine: [],
    fin_recurrence: null,
    nombre_occurrences: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const columns = [
    {
      field: 'date_debut',
      headerName: 'Date de début',
      width: 180,
      valueFormatter: (params) => new Date(params.value).toLocaleString('fr-FR'),
    },
    {
      field: 'date_fin',
      headerName: 'Date de fin',
      width: 180,
      valueFormatter: (params) => new Date(params.value).toLocaleString('fr-FR'),
    },
    {
      field: 'chauffeur_nom',
      headerName: 'Chauffeur',
      width: 200,
    },
    {
      field: 'client_entreprise',
      headerName: 'Client',
      width: 200,
    },
    {
      field: 'type_mission',
      headerName: 'Type',
      width: 130,
    },
    {
      field: 'statut',
      headerName: 'Statut',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={
            params.value === 'planifié' ? 'primary' :
            params.value === 'en_cours' ? 'warning' :
            params.value === 'terminé' ? 'success' :
            'error'
          }
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 130,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <IconButton
            size="small"
            onClick={() => {
              setSelectedMission(params.row);
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

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);
      const [missionsRes, chauffeursRes, clientsRes] = await Promise.all([
        fetch('http://localhost:8000/api/missions', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:8000/api/chauffeurs', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:8000/api/clients', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [missionsData, chauffeursData, clientsData] = await Promise.all([
        missionsRes.json(),
        chauffeursRes.json(),
        clientsRes.json()
      ]);

      setMissions(missionsData);
      setChauffeurs(chauffeursData);
      setClients(clientsData);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = showRecurrence 
        ? 'http://localhost:8000/api/missions/recurrence'
        : selectedMission
          ? `http://localhost:8000/api/missions/${selectedMission.id}`
          : 'http://localhost:8000/api/missions';

      const dataToSend = {
        ...formData,
        recurrence: showRecurrence ? recurrenceData : null
      };

      const response = await fetch(url, {
        method: selectedMission && !showRecurrence ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        fetchData();
        handleClose();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette mission ?')) {
      try {
        const response = await fetch(`http://localhost:8000/api/missions/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          fetchData();
        }
      } catch (error) {
        console.error('Erreur:', error);
      }
    }
  };

  const handleClose = () => {
    setOpenDialog(false);
    setSelectedMission(null);
    setFormData({
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
        complement: '',
        latitude: null,
        longitude: null
      },
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'planifié': return '#1e3a5f';
      case 'en_cours': return '#b45309';
      case 'terminé': return '#0f766e';
      case 'annulé': return '#9f1239';
      default: return '#475569';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Box sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                Planning des missions
              </Typography>
              <Stack direction="row" spacing={2}>
                <ButtonGroup>
                  <Button 
                    variant={viewMode === 'list' ? 'contained' : 'outlined'}
                    onClick={() => setViewMode('list')}
                  >
                    Vue Liste
                  </Button>
                  <Button 
                    variant={viewMode === 'calendar' ? 'contained' : 'outlined'}
                    onClick={() => setViewMode('calendar')}
                  >
                    Vue Calendrier
                  </Button>
                </ButtonGroup>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenDialog(true)}
                >
                  Nouvelle mission
                </Button>
              </Stack>
            </Stack>

            <Paper sx={{ height: 600, p: 2 }}>
              {viewMode === 'list' ? (
                <DataGrid
                  rows={missions}
                  columns={columns}
                  pageSize={10}
                  rowsPerPageOptions={[10, 25, 50]}
                  disableSelectionOnClick
                />
              ) : (
                <Box sx={{ 
                  '& .fc': { // FullCalendar root element
                    height: '100%',
                    '& .fc-header-toolbar': {
                      marginBottom: 2,
                    },
                    '& .fc-day-today': {
                      backgroundColor: 'rgba(30, 58, 95, 0.1)',
                    },
                    '& .fc-event': {
                      cursor: 'pointer',
                      '&:hover': {
                        opacity: 0.9,
                      },
                    },
                  },
                }}>
                  <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    locale={fr}
                    events={missions.map(mission => ({
                      id: mission.id,
                      title: `${mission.client_entreprise} - ${mission.chauffeur_nom}`,
                      start: mission.date_debut,
                      end: mission.date_fin,
                      backgroundColor: getStatusColor(mission.statut),
                      extendedProps: {
                        type_mission: mission.type_mission,
                        description: mission.description
                      }
                    }))}
                    eventClick={(info) => {
                      const mission = missions.find(m => m.id === parseInt(info.event.id));
                      setSelectedMission(mission);
                      setFormData(mission);
                      setOpenDialog(true);
                    }}
                    selectable={true}
                    select={(info) => {
                      setFormData({
                        ...formData,
                        date_debut: info.start.toISOString(),
                        date_fin: info.end.toISOString()
                      });
                      setOpenDialog(true);
                    }}
                    height="auto"
                    slotMinTime="06:00:00"
                    slotMaxTime="22:00:00"
                    allDaySlot={false}
                    nowIndicator={true}
                    editable={false}
                    dayMaxEvents={true}
                    weekends={true}
                    businessHours={{
                      daysOfWeek: [1, 2, 3, 4, 5],
                      startTime: '08:00',
                      endTime: '18:00',
                    }}
                  />
                </Box>
              )}
            </Paper>

            <Dialog open={openDialog} onClose={handleClose} maxWidth="md" fullWidth>
              <DialogTitle>
                {selectedMission ? 'Modifier la mission' : 'Nouvelle mission'}
              </DialogTitle>
              <DialogContent>
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Chauffeur</InputLabel>
                      <Select
                        value={formData.chauffeur_id}
                        onChange={(e) =>
                          setFormData({ ...formData, chauffeur_id: e.target.value })
                        }
                        label="Chauffeur"
                      >
                        {chauffeurs.map((chauffeur) => (
                          <MenuItem key={chauffeur.id} value={chauffeur.id}>
                            {chauffeur.prenom} {chauffeur.nom}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Client</InputLabel>
                      <Select
                        value={formData.client_id}
                        onChange={(e) =>
                          setFormData({ ...formData, client_id: e.target.value })
                        }
                        label="Client"
                      >
                        {clients.map((client) => (
                          <MenuItem key={client.id} value={client.id}>
                            {client.entreprise}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <DateTimePicker
                      label="Date de début"
                      value={formData.date_debut}
                      onChange={(newValue) => setFormData({
                        ...formData,
                        date_debut: newValue?.toISOString()
                      })}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <DateTimePicker
                      label="Date de fin"
                      value={formData.date_fin}
                      onChange={(newValue) => setFormData({
                        ...formData,
                        date_fin: newValue?.toISOString()
                      })}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Type de mission</InputLabel>
                      <Select
                        value={formData.type_mission}
                        onChange={(e) =>
                          setFormData({ ...formData, type_mission: e.target.value })
                        }
                        label="Type de mission"
                      >
                        <MenuItem value="livraison">Livraison</MenuItem>
                        <MenuItem value="collecte">Collecte</MenuItem>
                        <MenuItem value="transport">Transport</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Statut</InputLabel>
                      <Select
                        value={formData.statut}
                        onChange={(e) =>
                          setFormData({ ...formData, statut: e.target.value })
                        }
                        label="Statut"
                      >
                        <MenuItem value="planifié">Planifié</MenuItem>
                        <MenuItem value="en_cours">En cours</MenuItem>
                        <MenuItem value="terminé">Terminé</MenuItem>
                        <MenuItem value="annulé">Annulé</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      fullWidth
                      multiline
                      rows={4}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Itinéraire
                    </Typography>
                    <MissionMap mission={selectedMission} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      Adresse de départ
                    </Typography>
                    <TextField
                      label="Rue"
                      value={formData.adresse_pickup?.rue || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        adresse_pickup: {
                          ...formData.adresse_pickup,
                          rue: e.target.value
                        }
                      })}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showRecurrence}
                          onChange={(e) => setShowRecurrence(e.target.checked)}
                        />
                      }
                      label="Mission récurrente"
                    />
                  </Grid>
                  {showRecurrence && (
                    <>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Type de récurrence</InputLabel>
                          <Select
                            value={recurrenceData.type}
                            onChange={(e) => setRecurrenceData({
                              ...recurrenceData,
                              type: e.target.value
                            })}
                            label="Type de récurrence"
                          >
                            <MenuItem value="daily">Quotidienne</MenuItem>
                            <MenuItem value="weekly">Hebdomadaire</MenuItem>
                            <MenuItem value="monthly">Mensuelle</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          type="number"
                          label="Intervalle"
                          value={recurrenceData.interval}
                          onChange={(e) => setRecurrenceData({
                            ...recurrenceData,
                            interval: parseInt(e.target.value)
                          })}
                          fullWidth
                          InputProps={{ inputProps: { min: 1 } }}
                          helperText={
                            recurrenceData.type === 'daily' ? "Tous les X jours" :
                            recurrenceData.type === 'weekly' ? "Toutes les X semaines" :
                            "Tous les X mois"
                          }
                        />
                      </Grid>

                      {recurrenceData.type === 'weekly' && (
                        <Grid item xs={12}>
                          <FormControl component="fieldset">
                            <FormLabel component="legend">Jours de la semaine</FormLabel>
                            <FormGroup row>
                              {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((jour, index) => (
                                <FormControlLabel
                                  key={jour}
                                  control={
                                    <Checkbox
                                      checked={recurrenceData.jours_semaine.includes(index)}
                                      onChange={(e) => {
                                        const newJours = e.target.checked
                                          ? [...recurrenceData.jours_semaine, index]
                                          : recurrenceData.jours_semaine.filter(j => j !== index);
                                        setRecurrenceData({
                                          ...recurrenceData,
                                          jours_semaine: newJours
                                        });
                                      }}
                                    />
                                  }
                                  label={jour}
                                />
                              ))}
                            </FormGroup>
                          </FormControl>
                        </Grid>
                      )}

                      <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom>
                          Fin de la récurrence
                        </Typography>
                        <RadioGroup
                          value={recurrenceData.fin_recurrence ? "date" : recurrenceData.nombre_occurrences ? "occurrences" : "never"}
                          onChange={(e) => {
                            if (e.target.value === "never") {
                              setRecurrenceData({
                                ...recurrenceData,
                                fin_recurrence: null,
                                nombre_occurrences: null
                              });
                            }
                          }}
                        >
                          <FormControlLabel value="never" control={<Radio />} label="Jamais" />
                          <FormControlLabel
                            value="date"
                            control={<Radio />}
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: 8 }}>Jusqu'au</span>
                                <DatePicker
                                  value={recurrenceData.fin_recurrence}
                                  onChange={(date) => setRecurrenceData({
                                    ...recurrenceData,
                                    fin_recurrence: date,
                                    nombre_occurrences: null
                                  })}
                                  renderInput={(params) => <TextField {...params} size="small" />}
                                  disabled={!recurrenceData.fin_recurrence}
                                />
                              </Box>
                            }
                          />
                          <FormControlLabel
                            value="occurrences"
                            control={<Radio />}
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: 8 }}>Après</span>
                                <TextField
                                  type="number"
                                  size="small"
                                  value={recurrenceData.nombre_occurrences || ''}
                                  onChange={(e) => setRecurrenceData({
                                    ...recurrenceData,
                                    nombre_occurrences: parseInt(e.target.value),
                                    fin_recurrence: null
                                  })}
                                  disabled={!recurrenceData.nombre_occurrences}
                                  InputProps={{
                                    endAdornment: <InputAdornment position="end">occurrences</InputAdornment>
                                  }}
                                  sx={{ width: 150 }}
                                />
                              </Box>
                            }
                          />
                        </RadioGroup>
                      </Grid>
                    </>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions sx={{ p: 3 }}>
                <Button onClick={handleClose}>Annuler</Button>
                <Button onClick={handleSubmit} variant="contained">
                  {selectedMission ? 'Modifier' : 'Créer'}
                </Button>
              </DialogActions>
            </Dialog>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
          </Stack>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default Planning; 