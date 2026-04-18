import { ROLE_DEFAULT_PERMISSIONS } from 'src/constants/role-default-permissions';

export function getEffectivePermissions(
  role: string,
  profilePermissions?: string[] | null,
): string[] {
  if (role === 'admin') {
    return ['*'];
  }
  if (Array.isArray(profilePermissions) && profilePermissions.length > 0) {
    return profilePermissions;
  }
  return ROLE_DEFAULT_PERMISSIONS[role] ? [...ROLE_DEFAULT_PERMISSIONS[role]] : [];
}

export function hasAllPermissions(
  effective: string[],
  required: string[],
): boolean {
  if (effective.includes('*')) {
    return true;
  }
  return required.every((p) => effective.includes(p));
}
