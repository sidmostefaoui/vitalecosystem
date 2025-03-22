import { createTheme } from '@mui/material';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1e3a5f',
      light: '#2c5282',
      dark: '#152951',
    },
    secondary: {
      main: '#475569',
      light: '#64748b',
      dark: '#334155',
    },
    success: {
      main: '#0f766e',
      light: '#14b8a6',
      dark: '#0d5a54',
    },
    warning: {
      main: '#b45309',
      light: '#d97706',
      dark: '#92400e',
    },
    error: {
      main: '#9f1239',
      light: '#be123c',
      dark: '#881337',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
    },
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
    },
    h6: {
      fontWeight: 500,
      letterSpacing: '-0.25px',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
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
        },
      },
    },
    MuiPaper: {
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
        },
      },
    },
  },
}); 