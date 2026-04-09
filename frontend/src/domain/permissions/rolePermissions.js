export const ROLES = {
  DEVELOPER: 'developer',
  SCRUM_MASTER: 'scrumMaster',
  PRODUCT_OWNER: 'productOwner'
};

const permissions = {
  [ROLES.DEVELOPER]: {
    canCreateProject: false,
    canCreateSprint: true, // Requested by user
    canManageMembers: false, // UI will provide "Join" directly, not full admin
    canMoveAnyIssue: true, // Requested by user (modify for all)
    canCreateIssue: true, // Requested by user
    canFillStandup: true,
    canFillReflection: true,
    canViewMetrics: false
  },
  [ROLES.SCRUM_MASTER]: {
    canCreateProject: false,
    canCreateSprint: true,
    canManageMembers: true,
    canMoveAnyIssue: true,
    canCreateIssue: true,
    canFillStandup: false,
    canFillReflection: true,
    canViewMetrics: true
  },
  [ROLES.PRODUCT_OWNER]: {
    canCreateProject: true,
    canCreateSprint: true, // Ensure PO can also create Sprints to match config
    canManageMembers: true,
    canMoveAnyIssue: true,
    canCreateIssue: true,
    canFillStandup: false,
    canFillReflection: true,
    canViewMetrics: true
  }
};

export const hasPermission = (role, action) => {
  if (!permissions[role]) return false;
  return !!permissions[role][action];
};
