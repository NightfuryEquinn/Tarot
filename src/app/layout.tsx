import type { Metadata, Viewport } from 'next';
import { Header, Footer } from '@/components/Shell';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Midnight Arcana — A moment with the cards', template: '%s · Midnight Arcana' },
  description: 'Find a different perspective in a five-card tarot reading. Discover all 78 cards, upright and reversed meanings, and the threads connecting them. Available offline.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Midnight Arcana', statusBarStyle: 'black-translucent' },
  icons: { icon: '/icon.svg', apple: '/icons/icon-192.png' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0c101b' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a><Header />{children}<Footer /></body></html>;
}
