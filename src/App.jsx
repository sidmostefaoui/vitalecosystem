import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  CssBaseline,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
} from '@mui/icons-material';
import Dashboard from './pages/Dashboard';
import ClientList from './pages/ClientList';
import ClientDetail from './pages/ClientDetail';
import FactureList from './pages/FactureList';
import ContractGenerator from './pages/ContractGenerator';
import NotificationBell from './components/NotificationBell';
import FactureDetail from './pages/FactureDetail';
import ChauffeurList from './pages/ChauffeurList';
import Planning from './pages/Planning';
import TestMissionForm from './pages/TestMissionForm';
import TestMissionTimeline from './pages/TestMissionTimeline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import MesMissions from './pages/MesMissions';
import DynamicMenu from './components/navigation/DynamicMenu';
import MonPlanning from './pages/MonPlanning';
import Settings from './pages/Settings';
import { UserSettingsProvider } from './contexts/UserSettingsContext';

// Création d'un thème professionnel et sobre
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1e3a5f', // Bleu marine professionnel
      light: '#2c5282',
      dark: '#152951',
    },
    secondary: {
      main: '#475569', // Gris bleuté
      light: '#64748b',
      dark: '#334155',
    },
    success: {
      main: '#0f766e', // Vert-bleu sobre
      light: '#14b8a6',
      dark: '#0d5a54',
    },
    warning: {
      main: '#b45309', // Orange foncé
      light: '#d97706',
      dark: '#92400e',
    },
    error: {
      main: '#9f1239', // Rouge bordeaux
      light: '#be123c',
      dark: '#881337',
    },
    background: {
      default: '#f8fafc', // Gris très clair
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a', // Presque noir
      secondary: '#475569', // Gris bleuté
    },
    divider: '#e2e8f0', // Gris très clair pour les séparateurs
  },
  typography: {
    fontFamily: [
      'Plus Jakarta Sans',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    h4: {
      fontWeight: 600,
      letterSpacing: '-0.5px',
      color: '#0f172a',
    },
    h6: {
      fontWeight: 500,
      letterSpacing: '-0.25px',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '0.25px',
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#0f172a',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          borderBottom: '1px solid #e2e8f0',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          },
          padding: '8px 20px',
        },
        contained: {
          '&:hover': {
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        },
        elevation2: {
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: 'none',
          '& .MuiDataGrid-cell': {
            borderColor: '#e2e8f0',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f8fafc',
            borderColor: '#e2e8f0',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: '#f1f5f9',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});

function NavigationDrawer({ open, onClose }) {
  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: 280, backgroundColor: 'background.paper' },
      }}
    >
      <DynamicMenu onClose={onClose} />
    </Drawer>
  );
}

function AppContent() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user && location.pathname === '/') {
      // Redirection selon le rôle
      switch (user.role) {
        case 'dispatcher':
          navigate('/planning');
          break;
        case 'chauffeur':
          navigate('/mes-missions');
          break;
        case 'admin':
          navigate('/dashboard');
          break;
      }
    }
  }, [user, location.pathname, navigate]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ flexGrow: 1 }}
          >
            {user?.role === 'admin' ? 'Gestion d\'Entreprise' : 
             user?.role === 'dispatcher' ? 'Gestion des Missions' : 
             'Espace Chauffeur'}
          </Typography>
          <NotificationBell />
        </Toolbar>
      </AppBar>

      <NavigationDrawer 
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <Container maxWidth="xl" sx={{ py: 4, flex: 1 }}>
        <Routes>
          {/* Routes Admin */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/clients" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ClientList />
            </ProtectedRoute>
          } />
          <Route path="/factures" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <FactureList />
            </ProtectedRoute>
          } />

          {/* Routes Dispatcher */}
          <Route path="/planning" element={
            <ProtectedRoute allowedRoles={['admin', 'dispatcher']}>
              <Planning />
            </ProtectedRoute>
          } />
          <Route path="/chauffeurs" element={
            <ProtectedRoute allowedRoles={['admin', 'dispatcher']}>
              <ChauffeurList />
            </ProtectedRoute>
          } />

          {/* Routes Chauffeur */}
          <Route path="/mes-missions" element={
            <ProtectedRoute allowedRoles={['chauffeur']}>
              <MesMissions />
            </ProtectedRoute>
          } />
          <Route path="/mon-planning" element={
            <ProtectedRoute allowedRoles={['chauffeur']}>
              <MonPlanning />
            </ProtectedRoute>
          } />

          {/* Route commune */}
          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={['admin', 'dispatcher', 'chauffeur']}>
              <Settings />
            </ProtectedRoute>
          } />
        </Routes>
      </Container>
    </Box>
  );
}

function App() {
  return (
    <AuthProvider>
      <UserSettingsProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* Route principale avec AppContent */}
              <Route path="/*" element={
                <ProtectedRoute allowedRoles={['admin', 'dispatcher', 'chauffeur']}>
                  <AppContent />
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </ThemeProvider>
      </UserSettingsProvider>
    </AuthProvider>
  );
}

export default App; 