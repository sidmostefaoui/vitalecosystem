import { createTheme } from '@mui/material';

/**
 * Application theme configuration for VITALECOSYSTEM
 * Defines color palette, typography, and component styling
 */
export const theme = createTheme({
  palette: {
    mode: 'light',
    // Primary color - dark blue, used for main UI elements
    primary: {
      main: '#1e3a5f',
      light: '#2c5282',
      dark: '#152951',
    },
    // Secondary color - gray, used for less prominent UI elements
    secondary: {
      main: '#475569',
    },
    // Success color - teal, used for success messages and indicators
    success: {
      main: '#0f766e',
    },
    // Warning color - amber, used for warning messages and indicators
    warning: {
      main: '#b45309',
    },
    // Error color - red, used for error messages and indicators
    error: {
      main: '#9f1239',
    },
    // Background colors for the application
    background: {
      default: '#f8fafc', // Light gray for the main background
      paper: '#ffffff',   // White for card backgrounds
    },
  },
  typography: {
    // Font family prioritizing system fonts for better performance
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    // Heading styles
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
    // Button text styling - no text transform for better readability in French
    button: {
      textTransform: 'none',
    },
  },
  components: {
    // AppBar custom styling - light background with subtle shadow
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
    // Button custom styling - no shadow for flat design
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
  },
}); 