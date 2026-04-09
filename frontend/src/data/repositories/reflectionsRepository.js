import { db } from '../db/dbClient';

export const reflectionsRepository = {
  getAll: () => db.getCollection('reflections'),
  getById: (id) => db.getById('reflections', id),
  getBySprintId: (sprintId) => {
    return db.getCollection('reflections').filter(r => r.sprintId === sprintId);
  },
  getByUserAndSprint: (userId, sprintId) => {
    return db.getCollection('reflections').find(r => r.userId === userId && r.sprintId === sprintId);
  },
  create: (data) => db.insert('reflections', data),
  update: (id, data) => db.update('reflections', id, data),
};
