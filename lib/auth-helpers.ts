export function getSiteUrl(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return '';
}

export function getTurnstileSiteKey(): string | undefined {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  }
  return undefined;
}

export function isCaptchaConfigured(): boolean {
  return !!getTurnstileSiteKey();
}

type OAuthProvider = 'google' | 'microsoft' | 'github';

// Direct literal access so Next.js can statically replace
// process.env.NEXT_PUBLIC_* with the configured value at build time.
// Do NOT use bracket notation (process.env[flag]) here: it cannot be
// replaced at build time and would require runtime `process`.
export function isOAuthProviderEnabled(provider: OAuthProvider): boolean {
  if (provider === 'google') {
    return (
      process.env.NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH === 'true' ||
      process.env.NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH === '1'
    );
  }
  if (provider === 'microsoft') {
    return (
      process.env.NEXT_PUBLIC_ENABLE_MICROSOFT_OAUTH === 'true' ||
      process.env.NEXT_PUBLIC_ENABLE_MICROSOFT_OAUTH === '1'
    );
  }
  if (provider === 'github') {
    return (
      process.env.NEXT_PUBLIC_ENABLE_GITHUB_OAUTH === 'true' ||
      process.env.NEXT_PUBLIC_ENABLE_GITHUB_OAUTH === '1'
    );
  }
  return false;
}

export function isGuestDemoEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_ENABLE_GUEST_DEMO === 'true' ||
    process.env.NEXT_PUBLIC_ENABLE_GUEST_DEMO === '1'
  );
}

export interface OAuthProviderConfig {
  id: OAuthProvider;
  label: string;
  scopes: string;
  iconColor: string;
}

export function getOAuthProviderConfigs(): OAuthProviderConfig[] {
  const all: OAuthProviderConfig[] = [
    {
      id: 'google',
      label: 'Continue with Google',
      scopes: 'openid email profile',
      iconColor: '#4285F4',
    },
    {
      id: 'microsoft',
      label: 'Continue with Microsoft',
      scopes: 'openid email profile',
      iconColor: '#00A4EF',
    },
    {
      id: 'github',
      label: 'Continue with GitHub',
      scopes: 'user:email read:user',
      iconColor: '#24292F',
    },
  ];
  return all.filter((p) => isOAuthProviderEnabled(p.id));
}
