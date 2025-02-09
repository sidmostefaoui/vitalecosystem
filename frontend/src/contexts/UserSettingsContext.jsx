import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const UserSettingsContext = createContext(null);

export const UserSettingsProvider = ({ children }) => {
  const { token } = useAuth();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sound: false
    },
    display: {
      darkMode: false,
      animations: true
    },
    security: {
      twoFactorEnabled: false
    }
  });

  useEffect(() => {
    if (token) {
      fetchSettings();
    }
  }, [token]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/users/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const response = await fetch('http://localhost:8000/api/users/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSettings)
      });
      if (response.ok) {
        setSettings(newSettings);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
      return false;
    }
  };

  return (
    <UserSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </UserSettingsContext.Provider>
  );
};

export const useUserSettings = () => useContext(UserSettingsContext); 