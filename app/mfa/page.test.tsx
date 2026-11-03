import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { supabase } from '@/lib/supabase';
import MFAPage from '@/app/mfa/page';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      mfa: {
        listFactors: vi.fn(),
        getAuthenticatorAssuranceLevel: vi.fn(),
        enroll: vi.fn(),
        challenge: vi.fn(),
        verify: vi.fn(),
        unenroll: vi.fn(),
      },
      getUser: vi.fn(),
    },
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), refresh: vi.fn() })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock('next/link', () => {
  const Link = ({ children }: { children: any }) => <a>{children}</a>;
  return { Link, default: Link };
});

vi.mock('@/providers/supabase-provider', () => ({
  useSupabaseContext: vi.fn(() => ({ user: { id: 'user-1' } })),
}));

const mockedMFA = vi.mocked(supabase.auth.mfa);

function renderMFA() {
  return render(<MFAPage />);
}

beforeEach(() => {
  mockedMFA.listFactors.mockImplementation(() => Promise.resolve({ data: { factors: [] }, error: null }));
  mockedMFA.getAuthenticatorAssuranceLevel.mockImplementation(() => Promise.resolve({
    data: { currentAAL: 'aal1', nextLevel: 'aal1' },
    error: null,
  }));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('MFA page', () => {
  it('shows enroll button when no factors exist', async () => {
    renderMFA();
    await waitFor(() => {
      expect(screen.getByText('Enable authenticator MFA')).toBeInTheDocument();
    });
  });

  it('enrolls a TOTP factor and shows QR code', async () => {
    renderMFA();
    await waitFor(() => {
      expect(screen.getByText('Enable authenticator MFA')).toBeInTheDocument();
    });
    mockedMFA.enroll.mockResolvedValue({
      data: {
        id: 'factor-1',
        totp: {
          qr_code: 'data:image/svg+xml;base64,abc',
          secret: 'ABCDEFGHIJKLMNOP',
          uri: 'otpauth://totp/Estech:user-1?secret=ABCDEFGHIJKLMNOP&issuer=Estech',
        },
      },
      error: null,
    });

    fireEvent.click(screen.getByText('Enable authenticator MFA'));

    await waitFor(() => {
      expect(screen.getByAltText('MFA QR code')).toBeInTheDocument();
    });
    expect(screen.getByText('ABCDEFGHIJKLMNOP')).toBeInTheDocument();
    expect(mockedMFA.enroll).toHaveBeenCalledWith({
      factorType: 'totp',
      friendlyName: 'Estech Authenticator',
    });
  });

  it('challenges and verifies enrollment', async () => {
    renderMFA();
    await waitFor(() => {
      expect(screen.getByText('Enable authenticator MFA')).toBeInTheDocument();
    });
    mockedMFA.enroll.mockResolvedValue({
      data: {
        id: 'factor-1',
        totp: { qr_code: 'data:image/svg+xml;base64,abc', secret: 'ABCDEFGHIJKLMNOP', uri: 'uri' },
      },
      error: null,
    });
    mockedMFA.challenge.mockResolvedValue({ data: { challengeId: 'ch-1' }, error: null });
    mockedMFA.verify.mockResolvedValue({ error: null });
    mockedMFA.listFactors.mockResolvedValue({
      data: { factors: [{ id: 'factor-1', friendly_name: 'Estech Authenticator', factor_type: 'totp', status: 'verified', created_at: '', updated_at: '' }] },
      error: null,
    });

    fireEvent.click(screen.getByText('Enable authenticator MFA'));
    await waitFor(() => {
      expect(screen.getByText('Get new code')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Get new code'));
    await waitFor(() => {
      expect(screen.getByText('Verify & enable MFA')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByPlaceholderText('123456'), { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Verify & enable MFA'));

    await waitFor(() => {
      expect(screen.getByText('MFA enabled successfully')).toBeInTheDocument();
    });
    expect(mockedMFA.challenge).toHaveBeenCalledWith({ factorId: 'factor-1' });
    expect(mockedMFA.verify).toHaveBeenCalledWith({
      factorId: 'factor-1',
      challengeId: 'ch-1',
      code: '123456',
    });
  });
});
