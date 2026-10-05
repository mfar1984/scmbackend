'use client';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '../../../../components/AdminLayout';
import PermissionGate from '../../../../components/PermissionGate';
import { usePermissions } from '../../../../lib/usePermissions';
import WebPageEditor from '../../../../components/web/WebPageEditor';
import GalleryManager from '../../../../components/web/GalleryManager';

export default function WebGalleryPage() {
  const [tab, setTab] = useState<'content' | 'albums'>('content');

  return (
    <>
      <Head><title>Gallery — Web Content | ATLINE Admin</title></Head>
      <AdminLayout breadcrumb={['Web Tools', 'Resources', 'Gallery']}>
        <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
          <div className="card-body" style={{ padding: 24 }}>
            <div className="mb-4">
              <h1 className="page-title">Gallery</h1>
              <p className="page-subtitle">Manage the public Gallery page content, photo albums and the images shown inside each album.</p>
            </div>

            <div className="int-tabs mb-4">
              <button className={`int-tab-btn${tab === 'content' ? ' active' : ''}`} onClick={() => setTab('content')}><i className="bi bi-file-text me-1"></i>Page Content</button>
              <button className={`int-tab-btn${tab === 'albums' ? ' active' : ''}`} onClick={() => setTab('albums')}><i className="bi bi-images me-1"></i>Gallery</button>
            </div>

            {tab === 'content'
              ? <PermissionGate moduleKey="web.resources.gallery.content"><WebPageEditor slug="resources/gallery" moduleKey="web.resources.gallery.content" /></PermissionGate>
              : <PermissionGate moduleKey="web.resources.gallery.albums"><GalleryManager /></PermissionGate>}
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
