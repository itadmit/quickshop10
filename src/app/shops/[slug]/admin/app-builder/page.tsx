/**
 * App Builder Page — Server Component wrapper
 *
 * The AppBuilderClient is a 'use client' component that gets its own
 * client JS bundle, automatically code-split per route by Next.js.
 * Zero impact on storefront or other admin pages.
 */
import { Suspense } from 'react';
import { getStoreBySlug } from '@/lib/db/queries';
import { notFound } from 'next/navigation';
import { AppBuilderClient } from '@/components/app-builder/AppBuilderClient';

interface AppBuilderPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AppBuilderPage({ params }: AppBuilderPageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);

  if (!store) {
    notFound();
  }

  return (
    <Suspense fallback={<BuilderSkeleton />}>
      <AppBuilderClient storeSlug={slug} storeId={store.id} />
    </Suspense>
  );
}

function BuilderSkeleton() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top bar skeleton */}
      <div
        style={{
          height: 52,
          backgroundColor: '#fff',
          borderBottom: '1px solid #e5e5e5',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 12,
        }}
      >
        <div style={{ width: 100, height: 12, backgroundColor: '#eee', borderRadius: 4 }} />
        <div style={{ width: 120, height: 12, backgroundColor: '#eee', borderRadius: 4 }} />
      </div>

      {/* Main area skeleton */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left panel */}
        <div style={{ width: 280, backgroundColor: '#fff', borderRight: '1px solid #e5e5e5', padding: 16 }}>
          <div style={{ width: '60%', height: 10, backgroundColor: '#eee', borderRadius: 4, marginBottom: 16 }} />
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} style={{ width: '100%', height: 32, backgroundColor: '#f5f5f5', borderRadius: 4, marginBottom: 8 }} />
          ))}
        </div>

        {/* Center preview */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
          <div
            style={{
              width: 260,
              height: 520,
              border: '8px solid #e0e0e0',
              borderRadius: 32,
              backgroundColor: '#fff',
            }}
          />
        </div>

        {/* Right panel */}
        <div style={{ width: 320, backgroundColor: '#fff', borderLeft: '1px solid #e5e5e5', padding: 16 }}>
          <div style={{ width: '50%', height: 10, backgroundColor: '#eee', borderRadius: 4, marginBottom: 16 }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ width: '100%', height: 40, backgroundColor: '#f5f5f5', borderRadius: 4, marginBottom: 6 }} />
          ))}
        </div>
      </div>
    </div>
  );
}
