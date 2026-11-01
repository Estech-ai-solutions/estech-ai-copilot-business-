import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '../styles/globals.css';
import { InstallPrompt } from '@/components/install-prompt';
import { SupabaseProvider } from '@/providers/supabase-provider';
import { ToastProvider } from '@/components/toast';
import AskEstech from '@/components/ask-estech';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0A0F19',
} as Viewport;

export const metadata: Metadata = {
  title: 'Estech Business Copilot | Your business knowledge, turned into client-ready work',
  description: 'Teach Estech how your business works. Create informed customer replies, professional proposals and follow-ups using the knowledge it already has about your company.',
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
  openGraph: {
    title: 'Estech AI Business Copilot',
    description: 'Teach Estech how your business works. Create informed customer replies, professional proposals and follow-ups using the knowledge it already has about your company.',
    url: 'https://estech-ai.com',
    siteName: 'Estech AI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Estech AI Business Copilot',
    description: 'Teach Estech how your business works. Create informed customer replies, professional proposals and follow-ups using the knowledge it already has about your company.',
  },
} as Metadata;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-background min-h-screen">
        <SupabaseProvider>
          <ToastProvider>
            {children}
            <AskEstech />
          </ToastProvider>
        </SupabaseProvider>
        <InstallPrompt />
      </body>
    </html>
  );
}