import { useState, useEffect } from 'react';
import { reflectionsRepository } from '../../../data/repositories/reflectionsRepository';
import { db } from '../../../data/db/dbClient';

export const useReflections = (sprintId) => {
  const [reflections, setReflections] = useState([]);

  useEffect(() => {
    const fetchData = () => {
      setReflections(sprintId ? reflectionsRepository.getBySprintId(sprintId) : []);
    };
    
    fetchData();
    const unsubscribe = db.subscribe(fetchData);
    return () => unsubscribe();
  }, [sprintId]);

  const addReflection = (data) => reflectionsRepository.create(data);

  return { reflections, addReflection };
};
