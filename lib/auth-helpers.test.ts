import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getSiteUrl, isCaptchaConfigured, getTurnstileSiteKey } from '@/lib/auth-helpers';

describe('auth-helpers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('getSiteUrl falls back to window.origin in browser', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(getSiteUrl()).toBe('http://localhost:3000');
  });

  it('getSiteUrl uses env when set', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com';
    expect(getSiteUrl()).toBe('https://example.com');
  });

  it('isCaptchaConfigured is false without site key', () => {
    expect(isCaptchaConfigured()).toBe(false);
  });

  it('isCaptchaConfigured is true with site key', () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = '1x000000000000000000000000000000000AA';
    expect(isCaptchaConfigured()).toBe(true);
    expect(getTurnstileSiteKey()).toBe('1x000000000000000000000000000000000AA');
  });

  it('Cloudflare dummy site key is recognized', () => {
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = '1x000000000000000000000000000000000AA';
    expect(getTurnstileSiteKey()).toBe('1x000000000000000000000000000000000AA');
  });
});
