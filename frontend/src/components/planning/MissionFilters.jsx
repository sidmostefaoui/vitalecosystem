import React from 'react';
import {
  Box,
  Drawer,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Button,
  IconButton,
  Typography,
} from '@mui/material';
import { FilterList, Close } from '@mui/icons-material';

const MissionFilters = ({ onFilter }) => {
  const [open, setOpen] = React.useState(false);
  const [filters, setFilters] = React.useState({
    dateDebut: null,
    dateFin: null,
    chauffeur: '',
    client: '',
    statut: [],
    typeMission: [],
    ville: '',
  });

  return (
    <>
      <IconButton onClick={() => setOpen(true)}>
        <FilterList />
      </IconButton>
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
      >
        <Box sx={{ width: 320, p: 3 }}>
          <Typography variant="h6">Filtres avancés</Typography>
          {/* Filtres... */}
        </Box>
      </Drawer>
    </>
  );
};

export default MissionFilters; 