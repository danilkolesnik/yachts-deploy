import { ROLE_DEFAULT_PERMISSIONS } from 'src/constants/role-default-permissions';

function normalizeProfilePermissions(
  profilePermissions?: string[] | null,
): string[] {
  if (!Array.isArray(profilePermissions)) return [];
  return profilePermissions.filter(
    (p) => typeof p === 'string' && p.trim().length > 0,
  );
}

export function getEffectivePermissions(
  role: string,
  profilePermissions?: string[] | null,
): string[] {
  if (role === 'admin') {
    return ['*'];
  }
  const cleaned = normalizeProfilePermissions(profilePermissions);
  if (cleaned.length > 0) {
    return cleaned;
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
