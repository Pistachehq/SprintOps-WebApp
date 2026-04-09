import { db } from '../db/dbClient';

export const projectsRepository = {
  getAll: () => db.getCollection('projects'),
  getById: (id) => db.getById('projects', id),
  getByUserId: (userId) => {
    // Find memberships explicitly
    const memberships = db.getCollection('projectMembers').filter(pm => pm.userId === userId);
    const projectIds = memberships.map(pm => pm.projectId);
    
    // As product owner, maybe you see all projects where you are owner
    const allProjects = db.getCollection('projects');
    return allProjects.filter(p => projectIds.includes(p.id) || p.ownerId === userId);
  },
  create: (data) => db.insert('projects', data),
  update: (id, data) => db.update('projects', id, data),
  
  getMembers: (projectId) => {
    return db.getCollection('projectMembers').filter(pm => pm.projectId === projectId);
  },
  
  addMember: (projectId, userId, role) => {
    return db.insert('projectMembers', { projectId, userId, role });
  }
};
