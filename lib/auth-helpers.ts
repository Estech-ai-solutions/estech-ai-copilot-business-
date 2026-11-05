export function getSiteUrl(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
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

const PROVIDER_FLAG_MAP: Record<OAuthProvider, string> = {
  google: 'NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH',
  microsoft: 'NEXT_PUBLIC_ENABLE_MICROSOFT_OAUTH',
  github: 'NEXT_PUBLIC_ENABLE_GITHUB_OAUTH',
};

export function isOAuthProviderEnabled(provider: OAuthProvider): boolean {
  if (typeof process === 'undefined' || !process.env) {
    return false;
  }
  const flag = PROVIDER_FLAG_MAP[provider];
  const value = process.env[flag];
  return value === 'true' || value === '1';
}

export function isGuestDemoEnabled(): boolean {
  if (typeof process === 'undefined' || !process.env) {
    return false;
  }
  const value = process.env.NEXT_PUBLIC_ENABLE_GUEST_DEMO;
  return value === 'true' || value === '1';
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
