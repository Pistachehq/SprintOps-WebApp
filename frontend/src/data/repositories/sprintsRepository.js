import { db } from '../db/dbClient';

export const sprintsRepository = {
  getAll: () => db.getCollection('sprints'),
  getById: (id) => db.getById('sprints', id),
  getByProjectId: (projectId) => {
    return db.getCollection('sprints').filter(s => s.projectId === projectId);
  },
  create: (data) => db.insert('sprints', data),
  update: (id, data) => db.update('sprints', id, data),
  delete: (id) => db.delete('sprints', id)
};
