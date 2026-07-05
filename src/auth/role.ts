import type { Role } from '../types/api';

// Front-end role convenience. Backend is the real authority.
const ROLE_HIERARCHY: Record<Role, number> = {
  VIEWER: 0,
  OPERATOR: 1,
  MANAGER: 2,
  ADMIN: 3,
};

export function hasRole(userRole: Role, minRole: Role): boolean {
  return (ROLE_HIERARCHY[userRole] ?? -1) >= (ROLE_HIERARCHY[minRole] ?? 99);
}

export function canWrite(userRole: Role): boolean {
  return hasRole(userRole, 'OPERATOR');
}

export function canManageWarehouse(userRole: Role): boolean {
  return hasRole(userRole, 'MANAGER');
}

export function canManageUsers(userRole: Role): boolean {
  return userRole === 'ADMIN';
}

export function canViewLogs(userRole: Role): boolean {
  return hasRole(userRole, 'MANAGER');
}
