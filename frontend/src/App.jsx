import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  CssBaseline,
  Box,
  Button,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import Dashboard from './pages/Dashboard';
import ClientList from './pages/ClientList';
import FactureList from './pages/FactureList';
import Planning from './pages/Planning';
import { theme } from './theme';
import ErrorBoundary from './components/ErrorBoundary';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const showReturnButton = location.pathname !== '/dashboard';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Gestion d'Entreprise
          </Typography>
          {showReturnButton && (
            <Button
              color="inherit"
              size="large"
              startIcon={<ArrowBackIcon sx={{ fontSize: 30 }} />}
              onClick={() => navigate('/dashboard')}
              sx={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                padding: '8px 24px',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              RETOUR
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4, flex: 1 }}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<ClientList />} />
          <Route path="/factures" element={<FactureList />} />
          <Route path="/planning" element={<Planning />} />
          <Route path="/" element={<Navigate replace to="/dashboard" />} />
        </Routes>
      </Container>
    </Box>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App; 