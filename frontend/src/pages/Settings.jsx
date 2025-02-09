import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Switch,
  FormControlLabel,
  TextField,
  Button,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useUserSettings } from '../contexts/UserSettingsContext';

const Settings = () => {
  const { user } = useAuth();
  const { settings, updateSettings } = useUserSettings();

  const handleSettingChange = (section, key) => (event) => {
    const newSettings = {
      ...settings,
      [section]: {
        ...settings[section],
        [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value
      }
    };
    updateSettings(newSettings);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Paramètres
      </Typography>
      
      <Grid container spacing={3}>
        {/* Paramètres du profil */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Profil
            </Typography>
            <TextField
              fullWidth
              label="Email"
              value={user?.email || ''}
              margin="normal"
              disabled
            />
            <TextField
              fullWidth
              label="Rôle"
              value={user?.role || ''}
              margin="normal"
              disabled
            />
          </Paper>
        </Grid>

        {/* Paramètres de notification */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notifications
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.email}
                  onChange={handleSettingChange('notifications', 'email')}
                />
              }
              label="Notifications par email"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.push}
                  onChange={handleSettingChange('notifications', 'push')}
                />
              }
              label="Notifications push"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.sound}
                  onChange={handleSettingChange('notifications', 'sound')}
                />
              }
              label="Sons de notification"
            />
          </Paper>
        </Grid>

        {/* Paramètres d'affichage */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Affichage
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.display.darkMode}
                  onChange={handleSettingChange('display', 'darkMode')}
                />
              }
              label="Mode sombre"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.display.animations}
                  onChange={handleSettingChange('display', 'animations')}
                />
              }
              label="Animations"
            />
          </Paper>
        </Grid>

        {/* Paramètres de sécurité */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Sécurité
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              sx={{ mb: 2 }}
            >
              Changer le mot de passe
            </Button>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.security.twoFactorEnabled}
                  onChange={handleSettingChange('security', 'twoFactorEnabled')}
                />
              }
              label="Authentification à deux facteurs"
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings; 