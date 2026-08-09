function slugifyRole(value: unknown) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizeRoleValues(value: unknown) {
  if (!value) return [];

  if (Array.isArray(value)) return value.map(slugifyRole).filter(Boolean);

  if (typeof value === 'string') {
    return value
      .split(/[,\s]+/)
      .map(slugifyRole)
      .filter(Boolean);
  }

  return [];
}

const portalEntryRoles = new Set(['admin', 'operator', 'developer', 'consultant', 'partner', 'client']);

export type PortalAccessUser = {
  email?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

export function getPortalAccess(user: PortalAccessUser | null | undefined) {
  const email = (user?.email || '').toLowerCase();
  const appMetadata = user?.app_metadata || {};
  const userMetadata = user?.user_metadata || {};

  const roles = Array.from(
    new Set([
      ...normalizeRoleValues(appMetadata.roles),
      ...normalizeRoleValues(appMetadata.role),
      ...normalizeRoleValues(userMetadata.roles),
      ...normalizeRoleValues(userMetadata.role),
    ]),
  );

  if (email.endsWith('@advancedanalytica.co.uk')) roles.push('operator');
  if (roles.includes('admin')) roles.push('operator', 'developer', 'client');

  const uniqueRoles = Array.from(new Set(roles));
  const isPageViewer = uniqueRoles.includes('page_viewer');
  const hasPortalEntryRole = uniqueRoles.length === 0 || uniqueRoles.some((role) => portalEntryRoles.has(role));
  const isPageViewerOnly = isPageViewer && !hasPortalEntryRole;

  return {
    roles: uniqueRoles,
    isPageViewer,
    isPageViewerOnly,
    canAccessPortal: !isPageViewerOnly,
  };
}
