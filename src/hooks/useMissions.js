import { useState, useEffect, useCallback } from 'react';
import { missionService } from '../services/missionService';

export const useMissions = () => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await missionService.getMissions();
      setMissions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createMission = async (missionData) => {
    try {
      setLoading(true);
      setError(null);
      const newMission = await missionService.createMission(missionData);
      setMissions(prev => [...prev, newMission]);
      return newMission;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateMission = async (id, missionData) => {
    try {
      setLoading(true);
      setError(null);
      const updatedMission = await missionService.updateMission(id, missionData);
      setMissions(prev => prev.map(mission => 
        mission.id === id ? updatedMission : mission
      ));
      return updatedMission;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteMission = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await missionService.deleteMission(id);
      setMissions(prev => prev.filter(mission => mission.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  return {
    missions,
    loading,
    error,
    createMission,
    updateMission,
    deleteMission,
    refreshMissions: fetchMissions
  };
}; 