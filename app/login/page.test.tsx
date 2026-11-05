import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '@/app/login/page';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      resend: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth-helpers', () => ({
  getOAuthProviderConfigs: vi.fn(() => []),
  getSiteUrl: vi.fn(() => 'http://localhost:3000'),
  isCaptchaConfigured: vi.fn(() => false),
  isGuestDemoEnabled: vi.fn(() => true),
}));

import { supabase } from '@/lib/supabase';
import {
  getOAuthProviderConfigs,
  getSiteUrl,
  isCaptchaConfigured,
  isGuestDemoEnabled,
} from '@/lib/auth-helpers';

const signInWithPasswordMock = vi.mocked(supabase.auth.signInWithPassword);
const resendMock = vi.mocked(supabase.auth.resend);

const getOAuthProviderConfigsMock = vi.mocked(getOAuthProviderConfigs);
const getSiteUrlMock = vi.mocked(getSiteUrl);
const isCaptchaConfiguredMock = vi.mocked(isCaptchaConfigured);
const isGuestDemoEnabledMock = vi.mocked(isGuestDemoEnabled);

const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
  Link: ({ children }: { children: any }) => <a>{children}</a>,
}));

const fetchMock = vi.fn((_input: any) => Promise.resolve({ json: () => Promise.resolve({ completed: true }) }));
globalThis.fetch = fetchMock;
globalThis.fetch = fetchMock;

beforeEach(() => {
  vi.resetAllMocks();
  signInWithPasswordMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
  resendMock.mockResolvedValue({ error: null });
  getOAuthProviderConfigsMock.mockReturnValue([]);
  getSiteUrlMock.mockReturnValue('http://localhost:3000');
  isCaptchaConfiguredMock.mockReturnValue(false);
  isGuestDemoEnabledMock.mockReturnValue(true);
  fetchMock.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Login page', () => {
  it('renders email/password form for existing accounts and a demo entry', async () => {
    render(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('Your password')).toBeInTheDocument();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
    expect(screen.getByText(/Explore the demo/i)).toBeInTheDocument();
  });

  it('hides OAuth provider buttons when none are enabled', () => {
    getOAuthProviderConfigsMock.mockReturnValue([]);
    render(<LoginPage />);
    expect(screen.queryByText(/Continue with Google/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Continue with Microsoft/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Continue with GitHub/i)).not.toBeInTheDocument();
  });

  it('shows enabled provider buttons in order', () => {
    getOAuthProviderConfigsMock.mockReturnValue([
      { id: 'google', label: 'Continue with Google', scopes: 'openid email profile', iconColor: '#4285F4' },
      { id: 'microsoft', label: 'Continue with Microsoft', scopes: 'openid email profile', iconColor: '#00A4EF' },
      { id: 'github', label: 'Continue with GitHub', scopes: 'user:email read:user', iconColor: '#24292F' },
    ]);
    render(<LoginPage />);

    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByText('Continue with Microsoft')).toBeInTheDocument();
    expect(screen.getByText('Continue with GitHub')).toBeInTheDocument();
  });

  it('signs in with email and password for existing accounts', async () => {
    render(<LoginPage />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'jane@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Your password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign in/ }));

    await waitFor(() => {
      expect(signInWithPasswordMock).toHaveBeenCalledWith({
        email: 'jane@example.com',
        password: 'password123',
        options: expect.anything(),
      });
    });
    expect(pushMock).toHaveBeenCalledWith('/dashboard');
  });

  it('navigates to demo when Explore the demo is clicked', async () => {
    render(<LoginPage />);
    await waitFor(() => {
      expect(screen.getByText(/Explore the demo/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Explore the demo/i }));
    expect(pushMock).toHaveBeenCalledWith('/demo');
    expect(sessionStorage.getItem('estech_demo')).toBe('true');
  });
});
