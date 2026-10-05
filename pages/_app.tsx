import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useBranding } from "@/lib/useBranding";

// Routes we never track (auth + the tracker would be noise).
const SKIP = ['/login', '/_error', '/404', '/500'];

export default function App({ Component, pageProps }: AppProps) {
  const branding = useBranding();
  const router = useRouter();
  const lastPath = useRef<string>('');

  // ── Global activity tracker ──
  // Beacon every page view to the server, which records it under the logged-in
  // user (identity resolved server-side from the session cookie).
  useEffect(() => {
    const track = (url: string) => {
      const path = url.split('#')[0];
      if (!path || path === lastPath.current) return;
      if (SKIP.some(s => path === s || path.startsWith(s + '/'))) return;
      lastPath.current = path;
      const title = typeof document !== 'undefined' ? document.title : '';
      // Fire-and-forget; keepalive lets it complete across navigations.
      fetch('/api/logs/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, title, action: 'navigate' }),
        keepalive: true,
      }).catch(() => {});
    };

    // Initial load
    track(router.asPath);
    router.events.on('routeChangeComplete', track);
    return () => { router.events.off('routeChangeComplete', track); };
  }, [router]);

  return (
    <>
      {branding.favicon && (
        <Head>
          <link rel="icon" href={branding.favicon} />
        </Head>
      )}
      <Component {...pageProps} />
    </>
  );
}
