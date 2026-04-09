import { db } from '../db/dbClient';

export const standupsRepository = {
  getAll: () => db.getCollection('standups'),
  getById: (id) => db.getById('standups', id),
  getBySprintId: (sprintId) => {
    return db.getCollection('standups').filter(s => s.sprintId === sprintId);
  },
  getByUserAndSprint: (userId, sprintId) => {
    return db.getCollection('standups').filter(s => s.userId === userId && s.sprintId === sprintId);
  },
  getByUserSprintAndDate: (userId, sprintId, date) => {
    return db.getCollection('standups').find(s => s.userId === userId && s.sprintId === sprintId && s.date === date);
  },
  create: (data) => db.insert('standups', data),
  update: (id, data) => db.update('standups', id, data),
};
