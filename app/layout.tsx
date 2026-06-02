import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import { assertProductionEnvironment } from '@/lib/env';

assertProductionEnvironment();

export const metadata: Metadata = {
  title: 'TOEFL 120 Coach',
  description: 'Mobile-first adaptive TOEFL practice coach for Korea-first closed beta learners.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icon-192.png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TOEFL 120 Coach',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
