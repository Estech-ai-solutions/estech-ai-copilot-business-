import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Estech AI Business Copilot',
  description: 'AI-powered business operating system for small teams, creators, and entrepreneurs.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
