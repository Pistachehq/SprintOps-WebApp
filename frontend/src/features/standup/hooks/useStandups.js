import { useState, useEffect } from 'react';
import { standupsRepository } from '../../../data/repositories/standupsRepository';
import { db } from '../../../data/db/dbClient';

export const useStandups = (sprintId) => {
  const [standups, setStandups] = useState([]);

  useEffect(() => {
    const fetchData = () => {
      setStandups(sprintId ? standupsRepository.getBySprintId(sprintId) : []);
    };
    
    fetchData();
    const unsubscribe = db.subscribe(fetchData);
    return () => unsubscribe();
  }, [sprintId]);

  const addStandup = (data) => standupsRepository.create(data);

  return { standups, addStandup };
};
