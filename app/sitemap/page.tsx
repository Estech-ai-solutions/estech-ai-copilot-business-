import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sitemap | Estech AI Business Copilot',
};

export default function SitemapPage() {
  const urls = [
    { loc: 'https://estech-ai.com/', lastmod: '2026-08-31' },
    { loc: 'https://estech-ai.com/about', lastmod: '2026-08-31' },
    { loc: 'https://estech-ai.com/contact', lastmod: '2026-08-31' },
    { loc: 'https://estech-ai.com/privacy', lastmod: '2026-08-31' },
    { loc: 'https://estech-ai.com/terms', lastmod: '2026-08-31' },
    { loc: 'https://estech-ai.com/features', lastmod: '2026-08-31' },
    { loc: 'https://estech-ai.com/pricing', lastmod: '2026-08-31' },
    { loc: 'https://estech-ai.com/faq', lastmod: '2026-08-31' },
  ];

  return (
    <div className="min-h-screen bg-background text-text-body">
      <div className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <h1 className="text-2xl font-semibold text-text-heading mb-6">Sitemap</h1>
        <ul className="space-y-2 text-sm text-text-muted">
          {urls.map((url) => (
            <li key={url.loc}>
              <a href={url.loc} className="text-primary hover:underline">{url.loc}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
