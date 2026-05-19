export const ROLES = {
  DEVELOPER: 'developer',
  SCRUM_MASTER: 'scrumMaster',
  PRODUCT_OWNER: 'productOwner'
};

const permissions = {
  [ROLES.DEVELOPER]: {
    canCreateSprint: false,
    canCreateIssue: true,
    canEditIssue: true,
    canManageMembers: false,
    canViewMetrics: false,
    canViewOnlyOwnIssues: true,
    canViewAllIssues: false,
    canUploadDailyPhoto: false,
  },
  [ROLES.SCRUM_MASTER]: {
    canCreateSprint: true,
    canCreateIssue: true,
    canEditIssue: true,
    canManageMembers: true,
    canViewMetrics: true,
    canViewOnlyOwnIssues: false,
    canViewAllIssues: true,
    canUploadDailyPhoto: true,
  },
  [ROLES.PRODUCT_OWNER]: {
    canCreateSprint: true,
    canCreateIssue: true,
    canEditIssue: true,
    canManageMembers: true,
    canViewMetrics: true,
    canViewOnlyOwnIssues: false,
    canViewAllIssues: true,
    canUploadDailyPhoto: true,
  }
};

// Cache for dynamically loaded role permissions
let dynamicPermissions = {};

export const setDynamicPermissions = (roleName, permisoNames) => {
  const normalizedRole = roleName.toLowerCase().replace(/\s+/g, '');
  dynamicPermissions[normalizedRole] = {};
  permisoNames.forEach(name => {
    dynamicPermissions[normalizedRole][name] = true;
  });
};

export const clearDynamicPermissions = () => {
  dynamicPermissions = {};
};

export const hasPermission = (role, action) => {
  // Check static permissions first
  if (permissions[role]) {
    return !!permissions[role][action];
  }
  // Check dynamic permissions for custom roles
  const normalizedRole = role?.toLowerCase().replace(/\s+/g, '');
  if (dynamicPermissions[normalizedRole]) {
    return !!dynamicPermissions[normalizedRole][action];
  }
  return false;
};
