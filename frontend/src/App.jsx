import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  CssBaseline,
  Box,
  IconButton,
  Drawer,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import Dashboard from './pages/Dashboard';
import ClientList from './pages/ClientList';
import FactureList from './pages/FactureList';
import Planning from './pages/Planning';
import NotificationBell from './components/NotificationBell';
import DynamicMenu from './components/navigation/DynamicMenu';
import { theme } from './theme';

function App() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
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
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Gestion d'Entreprise
              </Typography>
              <NotificationBell />
            </Toolbar>
          </AppBar>

          <Drawer
            anchor="left"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
          >
            <DynamicMenu onClose={() => setDrawerOpen(false)} />
          </Drawer>

          <Container maxWidth="xl" sx={{ py: 4, flex: 1 }}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clients" element={<ClientList />} />
              <Route path="/factures" element={<FactureList />} />
              <Route path="/planning" element={<Planning />} />
              <Route path="/" element={<Dashboard />} />
            </Routes>
          </Container>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App; 