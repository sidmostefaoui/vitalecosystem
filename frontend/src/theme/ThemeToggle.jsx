import React from 'react';
import { IconButton, useTheme } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';

const ThemeToggle = ({ onToggle, isDark }) => (
  <IconButton onClick={onToggle} color="inherit">
    {isDark ? <Brightness7 /> : <Brightness4 />}
  </IconButton>
);

export default ThemeToggle; 