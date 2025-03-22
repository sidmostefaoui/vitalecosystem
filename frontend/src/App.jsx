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
import SubMenu from './pages/SubMenu';
import { theme } from './theme';
import ErrorBoundary from './components/ErrorBoundary';

/**
 * Main content component for the VITALECOSYSTEM application.
 * Handles routing and navigation between different sections of the app.
 * Includes a top navigation bar with company name and return button.
 */
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // Only show the return button when not on the dashboard
  const showReturnButton = location.pathname !== '/dashboard';
  
  /**
   * Handle the return button navigation based on current location
   * For the clients page, return to Régime Forfait menu
   * For all other pages, return to the dashboard
   */
  const handleReturn = () => {
    if (location.pathname === '/clients') {
      // If on clients page, go back to Régime Forfait menu
      navigate('/régime-forfait');
    } else {
      // Otherwise go back to dashboard
      navigate('/dashboard');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Application header with company name and return button */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            VITALECOSYSTEM
          </Typography>
          {showReturnButton && (
            <Button
              color="inherit"
              size="large"
              startIcon={<ArrowBackIcon sx={{ fontSize: 30 }} />}
              onClick={handleReturn}
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

      {/* Main content container with routes to different application views */}
      <Container maxWidth="xl" sx={{ py: 4, flex: 1 }}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<ClientList />} />
          <Route path="/factures" element={<FactureList />} />
          <Route path="/régime-forfait" element={<SubMenu title="Régime Forfait" />} />
          <Route path="/régime-réel" element={<SubMenu title="Régime Réel" />} />
          <Route path="/inventaire" element={<SubMenu title="Inventaire" />} />
          <Route path="/fournisseurs" element={<SubMenu title="Fournisseurs" />} />
          <Route path="/" element={<Navigate replace to="/dashboard" />} />
        </Routes>
      </Container>
    </Box>
  );
}

/**
 * Root component of the application.
 * Sets up the theme provider, error boundary, and router.
 */
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