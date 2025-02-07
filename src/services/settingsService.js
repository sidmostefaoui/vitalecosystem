const BASE_URL = 'http://localhost:8000/api';

export const settingsService = {
  getSettings: async () => {
    const response = await fetch(`${BASE_URL}/users/settings`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    if (!response.ok) throw new Error('Erreur lors du chargement des paramètres');
    return response.json();
  },

  updateSettings: async (settings) => {
    const response = await fetch(`${BASE_URL}/users/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(settings)
    });
    if (!response.ok) throw new Error('Erreur lors de la mise à jour des paramètres');
    return response.json();
  },

  changePassword: async (oldPassword, newPassword) => {
    const response = await fetch(`${BASE_URL}/users/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
    });
    if (!response.ok) throw new Error('Erreur lors du changement de mot de passe');
    return response.json();
  }
}; 