const BASE_URL = 'http://localhost:8000/api';

export const missionService = {
  getMissions: async () => {
    try {
      const response = await fetch(`${BASE_URL}/missions`);
      if (!response.ok) throw new Error('Erreur lors du chargement des missions');
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  createMission: async (data) => {
    try {
      const response = await fetch(`${BASE_URL}/missions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erreur lors de la création de la mission');
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  updateMission: async (id, data) => {
    try {
      const response = await fetch(`${BASE_URL}/missions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour de la mission');
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  deleteMission: async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/missions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression de la mission');
      return true;
    } catch (error) {
      throw error;
    }
  },

  createRecurringMission: async (data) => {
    try {
      const response = await fetch(`${BASE_URL}/missions/recurrence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erreur lors de la création des missions récurrentes');
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  optimizeRoute: async (missions) => {
    // Logique d'optimisation
  }
}; 