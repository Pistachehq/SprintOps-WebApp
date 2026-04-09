import { db } from '../db/dbClient';

export const issuesRepository = {
  getAll: () => db.getCollection('issues'),
  getById: (id) => db.getById('issues', id),
  getBySprintId: (sprintId) => {
    return db.getCollection('issues').filter(i => i.sprintId === sprintId);
  },
  getByProjectId: (projectId) => {
    return db.getCollection('issues').filter(i => i.projectId === projectId);
  },
  create: (data) => db.insert('issues', data),
  update: (id, data) => db.update('issues', id, data),
  delete: (id) => db.delete('issues', id)
};
