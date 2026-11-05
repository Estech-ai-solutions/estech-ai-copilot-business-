import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isOAuthProviderEnabled,
  isGuestDemoEnabled,
  getOAuthProviderConfigs,
} from '@/lib/auth-helpers';

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

function setFlag(flag: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[flag];
  } else {
    process.env[flag] = value;
  }
}

describe('OAuth provider feature flags', () => {
  it('hides all providers when no flags are set', () => {
    setFlag('NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH', undefined);
    setFlag('NEXT_PUBLIC_ENABLE_MICROSOFT_OAUTH', undefined);
    setFlag('NEXT_PUBLIC_ENABLE_GITHUB_OAUTH', undefined);

    expect(isOAuthProviderEnabled('google')).toBe(false);
    expect(isOAuthProviderEnabled('microsoft')).toBe(false);
    expect(isOAuthProviderEnabled('github')).toBe(false);
    expect(getOAuthProviderConfigs()).toHaveLength(0);
  });

  it('shows only enabled providers', () => {
    setFlag('NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH', 'true');
    setFlag('NEXT_PUBLIC_ENABLE_MICROSOFT_OAUTH', 'false');
    setFlag('NEXT_PUBLIC_ENABLE_GITHUB_OAUTH', undefined);

    expect(isOAuthProviderEnabled('google')).toBe(true);
    expect(isOAuthProviderEnabled('microsoft')).toBe(false);
    expect(isOAuthProviderEnabled('github')).toBe(false);

    const configs = getOAuthProviderConfigs();
    expect(configs).toHaveLength(1);
    expect(configs[0].id).toBe('google');
    expect(configs[0].label).toBe('Continue with Google');
  });

  it('treats "1" as enabled and anything else as disabled', () => {
    setFlag('NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH', '1');
    expect(isOAuthProviderEnabled('google')).toBe(true);

    setFlag('NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH', 'yes');
    expect(isOAuthProviderEnabled('google')).toBe(false);
  });
});

describe('Guest demo flag', () => {
  it('is enabled by default when set to true', () => {
    setFlag('NEXT_PUBLIC_ENABLE_GUEST_DEMO', 'true');
    expect(isGuestDemoEnabled()).toBe(true);
  });

  it('is disabled when not set', () => {
    setFlag('NEXT_PUBLIC_ENABLE_GUEST_DEMO', undefined);
    expect(isGuestDemoEnabled()).toBe(false);
  });
});
