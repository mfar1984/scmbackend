'use client';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminLayout from '../../components/AdminLayout';
import PermissionGate from '../../components/PermissionGate';
import WebPageEditor from '../../components/web/WebPageEditor';
import { getSchema } from '../../lib/webContentSchema';
import { webModuleKey } from '../../lib/webPermMap';

export default function WebContentCatchAll() {
  const router = useRouter();
  const parts = (router.query.slug as string[] | undefined) || [];
  const slug = parts.join('/');

  // Special non-CMS pages live in their own files (e.g. /web/legal). If a known
  // CMS schema exists, render the editor; otherwise show a friendly placeholder.
  const schema = slug ? getSchema(slug) : null;
  const moduleKey = slug ? webModuleKey(slug) : undefined;

  const breadcrumb = ['Web Tools', ...parts.map(p => p.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))];

  return (
    <>
      <Head><title>{schema ? `${schema.title} — Web Content` : 'Web Content'} | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={breadcrumb}>
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            {schema ? (
              moduleKey ? (
                <PermissionGate moduleKey={moduleKey}>
                  <WebPageEditor slug={slug} moduleKey={moduleKey} />
                </PermissionGate>
              ) : (
                <WebPageEditor slug={slug} />
              )
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
                <i className="bi bi-hourglass-split" style={{ fontSize: 30, display: 'block', marginBottom: 10 }}></i>
                <div style={{ fontSize: 14 }}>This page editor is not available yet.</div>
                <div style={{ fontSize: 12.5, marginTop: 4 }}>Route: /web/{slug || '(home)'}</div>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
