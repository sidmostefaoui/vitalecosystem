// Gestion du refresh token
import { useAuth } from '../contexts/AuthContext';

export const useRefreshToken = () => {
  const { setToken } = useAuth();

  const refresh = async () => {
    try {
      const response = await fetch('http://localhost:8000/refresh-token', {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();
      setToken(data.access_token);
      return data.access_token;
    } catch (error) {
      console.error('Erreur refresh token:', error);
      throw error;
    }
  };

  return refresh;
}; 