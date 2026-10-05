import { useState, useEffect } from 'react';

export type PermState = {
  loaded: boolean;
  isSuperAdmin: boolean;
  role: string;
  matrix: Record<string, Record<string, boolean>>;
};

const EMPTY: PermState = { loaded: false, isSuperAdmin: false, role: '', matrix: {} };

// Module-level cache — fetch once per browser session, shared across components.
let cache: PermState | null = null;
let inflight: Promise<PermState> | null = null;
const listeners = new Set<(p: PermState) => void>();

async function load(): Promise<PermState> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = fetch('/api/auth/permissions')
    .then(r => r.json())
    .then(j => {
      cache = j && j.success
        ? { loaded: true, isSuperAdmin: !!j.isSuperAdmin, role: j.role || '', matrix: j.matrix || {} }
        : { ...EMPTY, loaded: true };
      listeners.forEach(fn => fn(cache!));
      return cache!;
    })
    .catch(() => { cache = { ...EMPTY, loaded: true }; return cache; })
    .finally(() => { inflight = null; });
  return inflight;
}

/** Force a refresh (e.g. after the current user's role changes). */
export function refreshPermissions() {
  cache = null;
  load();
}

export type Permissions = PermState & {
  /** True if the role has a specific permission on a module key. Super Admin always true. */
  can: (moduleKey: string, perm: string) => boolean;
  /** True if the role can see/open a module (has any permission, or explicit Read). */
  canRead: (moduleKey: string) => boolean;
  /** Like canRead but also returns true if any nested (tab) module is readable. */
  canAccess: (moduleKey: string) => boolean;
};

export function usePermissions(): Permissions {
  const [state, setState] = useState<PermState>(cache || EMPTY);

  useEffect(() => {
    let mounted = true;
    const fn = (p: PermState) => { if (mounted) setState(p); };
    listeners.add(fn);
    load().then(fn);
    return () => { mounted = false; listeners.delete(fn); };
  }, []);

  const can = (moduleKey: string, perm: string): boolean => {
    if (state.isSuperAdmin) return true;
    return !!state.matrix[moduleKey]?.[perm];
  };

  // A module is visible/accessible if it has Read, or any granted permission at all.
  const canRead = (moduleKey: string): boolean => {
    if (state.isSuperAdmin) return true;
    const row = state.matrix[moduleKey];
    if (!row) return false;
    if (row['Read']) return true;
    return Object.values(row).some(Boolean);
  };

  // Visible if the exact module is readable, OR any nested module (tab) under
  // this key prefix is readable. Used for sidebar items that open tabbed pages.
  const canAccess = (moduleKey: string): boolean => {
    if (state.isSuperAdmin) return true;
    if (canRead(moduleKey)) return true;
    const prefix = moduleKey + '.';
    for (const [k, row] of Object.entries(state.matrix)) {
      if (k.startsWith(prefix) && (row['Read'] || Object.values(row).some(Boolean))) return true;
    }
    return false;
  };

  return { ...state, can, canRead, canAccess };
}
