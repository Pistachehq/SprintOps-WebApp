import { db } from '../db/dbClient';

const COLLECTION = 'issueHistory';

export const issueHistoryRepository = {
  getAll: () => db.getCollection(COLLECTION),
  
  getByIssueId: (issueId) => {
    const all = db.getCollection(COLLECTION);
    return all.filter(h => h.issueId === issueId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  addHistory: (issueId, userId, action, changes) => {
    return db.insert(COLLECTION, {
      issueId,
      userId,
      action, // e.g. "Status changed", "Title updated"
      changes // e.g. "Moved from To Do to In Progress"
    });
  }
};
