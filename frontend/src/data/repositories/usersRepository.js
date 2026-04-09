import { db } from '../db/dbClient';

export const usersRepository = {
  getAll: () => db.getCollection('users'),
  getById: (id) => db.getById('users', id),
  getByUsername: (username) => {
    return db.getCollection('users').find(u => u.username === username);
  },
  create: (data) => db.insert('users', data),
  update: (id, data) => db.update('users', id, data),
};
