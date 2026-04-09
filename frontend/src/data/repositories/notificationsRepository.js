import { db } from '../db/dbClient';

export const notificationsRepository = {
  getAll: () => db.getCollection('notifications'),
  getById: (id) => db.getById('notifications', id),
  getByUserId: (userId) => {
    return db.getCollection('notifications').filter(n => n.userId === userId);
  },
  create: (data) => db.insert('notifications', data),
  update: (id, data) => db.update('notifications', id, data),
  markAsRead: (id) => db.update('notifications', id, { read: true })
};
