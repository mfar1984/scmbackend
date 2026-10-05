import { useState, useEffect } from 'react';

export type Branding = {
  admin_logo?: string;
  sidebar_logo?: string;
  login_image?: string;
  favicon?: string;
  primary_color?: string;
  accent_color?: string;
  login_bg?: string;
  login_bg_color?: string;
  [k: string]: string | undefined;
};

// Module-level cache so we fetch only once per session, shared across components.
let cache: Branding | null = null;
let inflight: Promise<Branding> | null = null;
const listeners = new Set<(b: Branding) => void>();

async function load(): Promise<Branding> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = fetch('/api/config/branding')
    .then(r => r.json())
    .then(j => {
      cache = (j && j.success && j.data) ? j.data : {};
      listeners.forEach(fn => fn(cache!));
      return cache!;
    })
    .catch(() => { cache = {}; return cache; })
    .finally(() => { inflight = null; });
  return inflight;
}

/** Force a refresh (e.g. after saving branding settings). */
export function refreshBranding() {
  cache = null;
  load();
}

export function useBranding(): Branding {
  const [branding, setBranding] = useState<Branding>(cache || {});
  useEffect(() => {
    let mounted = true;
    const fn = (b: Branding) => { if (mounted) setBranding(b); };
    listeners.add(fn);
    load().then(fn);
    return () => { mounted = false; listeners.delete(fn); };
  }, []);
  return branding;
}
