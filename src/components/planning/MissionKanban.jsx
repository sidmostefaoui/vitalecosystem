import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Box, Paper, Typography } from '@mui/material';

const MissionKanban = ({ missions, onDragEnd }) => {
  const columns = {
    planifie: {
      title: 'Planifiées',
      items: missions.filter(m => m.statut === 'planifié')
    },
    enCours: {
      title: 'En cours',
      items: missions.filter(m => m.statut === 'en_cours')
    },
    termine: {
      title: 'Terminées',
      items: missions.filter(m => m.statut === 'terminé')
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', p: 2 }}>
        {Object.entries(columns).map(([columnId, column]) => (
          <Box key={columnId} sx={{ minWidth: 300 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">{column.title}</Typography>
              <Droppable droppableId={columnId}>
                {(provided) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {column.items.map((mission, index) => (
                      <Draggable
                        key={mission.id}
                        draggableId={mission.id.toString()}
                        index={index}
                      >
                        {(provided) => (
                          <Paper
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{ p: 2, mb: 1 }}
                          >
                            {/* Contenu de la carte mission */}
                          </Paper>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </Paper>
          </Box>
        ))}
      </Box>
    </DragDropContext>
  );
}; 