export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard', '/assistant', '/leads', '/tasks', '/documents', '/settings', '/profile', '/knowledge', '/onboarding', '/responses', '/content', '/analytics'],
      },
    ],
    sitemap: 'https://estech-ai.com/sitemap.xml',
  };
}
