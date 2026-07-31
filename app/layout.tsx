import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '../styles/globals.css';
import { InstallPrompt } from '@/components/install-prompt';
import { SupabaseProvider } from '@/providers/supabase-provider';
import { ToastProvider } from '@/components/toast';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0A0F19',
} as Viewport;

export const metadata: Metadata = {
  title: 'Estech AI Business Copilot',
  description: 'AI-powered business operating system for small teams, creators, and entrepreneurs.',
  applicationName: 'Estech AI',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Estech AI',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  manifest: '/manifest.json',
} as Metadata;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-background min-h-screen">
        <SupabaseProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SupabaseProvider>
        <InstallPrompt />
      </body>
    </html>
  );
}