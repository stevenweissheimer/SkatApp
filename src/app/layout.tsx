import type { Metadata, Viewport } from 'next';
import Navigation from '@/components/Navigation';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#059669',
};

export const metadata: Metadata = {
  title: 'Skat Turnierbuch',
  description: 'Digitales Turnierbuch für Skat-Turniere',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Skat Turnierbuch',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-gray-50">
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
