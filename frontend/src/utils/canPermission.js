export function can(permissions, code) {
  if (!permissions || !Array.isArray(permissions)) return false;
  if (permissions.includes('*')) return true;
  return permissions.includes(code);
}
