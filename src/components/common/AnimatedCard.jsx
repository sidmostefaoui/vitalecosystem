import React from 'react';
import { motion } from 'framer-motion';
import { Paper } from '@mui/material';

const AnimatedCard = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    <Paper sx={{ p: 2 }}>
      {children}
    </Paper>
  </motion.div>
);

export default AnimatedCard; 