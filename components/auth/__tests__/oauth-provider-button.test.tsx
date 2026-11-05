import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OAuthProviderButton } from '@/components/auth/oauth-provider-button';

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { signInWithOAuth: vi.fn() } },
}));

vi.mock('@/lib/auth-helpers', () => ({
  getSiteUrl: vi.fn(() => 'http://localhost:3000'),
}));

import { supabase } from '@/lib/supabase';

const signInWithOAuthMock = vi.mocked(supabase.auth.signInWithOAuth);

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  Link: ({ children }: { children: any }) => <a>{children}</a>,
}));

beforeEach(() => {
  vi.resetAllMocks();
  signInWithOAuthMock.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('OAuthProviderButton', () => {
  it('renders provider label and icon', () => {
    render(<OAuthProviderButton id="google" label="Continue with Google" scopes="openid email profile" iconColor="#4285F4" />);
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });

  it('calls signInWithOAuth with provider and redirectTo on click', async () => {
    render(<OAuthProviderButton id="github" label="Continue with GitHub" scopes="user:email read:user" iconColor="#24292F" />);
    fireEvent.click(screen.getByRole('button', { name: /Continue with GitHub/ }));

    await waitFor(() => {
      expect(signInWithOAuthMock).toHaveBeenCalled();
      expect(signInWithOAuthMock.mock.calls[0][0]).toEqual({
        provider: 'github',
        options: expect.objectContaining({
          scopes: 'user:email read:user',
          redirectTo: 'http://localhost:3000/auth/callback',
        }),
      });
    });
  });

  it('does not resubmit while a sign-in is in flight', async () => {
    let resolvePromise: () => void = () => {};
    signInWithOAuthMock.mockImplementation(() => new Promise((r) => { resolvePromise = r; }));

    render(<OAuthProviderButton id="microsoft" label="Continue with Microsoft" scopes="openid email profile" iconColor="#00A4EF" />);
    fireEvent.click(screen.getByRole('button', { name: /Continue with Microsoft/ }));
    fireEvent.click(screen.getByRole('button', { name: /Continue with Microsoft/ }));

    expect(signInWithOAuthMock).toHaveBeenCalledTimes(1);
    resolvePromise();
  });

  it('shows an error alert when sign-in fails', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    signInWithOAuthMock.mockRejectedValue(new Error('OAuth not configured'));

    render(<OAuthProviderButton id="google" label="Continue with Google" scopes="openid email profile" iconColor="#4285F4" />);
    fireEvent.click(screen.getByRole('button', { name: /Continue with Google/ }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('OAuth not configured'));
    });
    alertSpy.mockRestore();
  });
});
