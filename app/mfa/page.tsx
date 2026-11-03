'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useSupabaseContext } from '@/providers/supabase-provider';
import {
  Loader2, AlertCircle, CheckCircle, Phone, ShieldAlert,
  LogOut, RefreshCw, Copy, Eye, EyeOff, ArrowLeft,
} from 'lucide-react';
import { Button, Input, Alert } from '@/components/ui';

type Factor = {
  id: string;
  friendly_name?: string | null;
  factor_type: 'totp' | 'phone' | 'webauthn';
  status: 'unverified' | 'verified';
  created_at: string;
  updated_at: string;
  totp?: {
    qr_code: string;
    secret: string;
    uri: string;
  };
};

type AAL = {
  currentAAL: 'aal1' | 'aal2';
  nextLevel: 'aal1' | 'aal2';
};

export default function MFAPage() {
  const { user } = useSupabaseContext();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [aal, setAAL] = useState<AAL>({ currentAAL: 'aal1', nextLevel: 'aal1' });
  const [enrolling, setEnrolling] = useState(false);
  const [enrollData, setEnrollData] = useState<{ id: string; qr_code: string; secret: string; uri: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    load();
  }, [user, router]);

  async function load() {
    setLoading(true);
    try {
      const [factorsRes, aalRes] = await Promise.all([
        supabase.auth.mfa.listFactors(),
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      ]);
      if (factorsRes.error) throw factorsRes.error;
      setFactors((factorsRes.data?.all || []) as Factor[]);
      setAAL({
        currentAAL: (aalRes.data?.currentLevel as AAL['currentAAL']) || 'aal1',
        nextLevel: (aalRes.data?.nextLevel as AAL['nextLevel']) || 'aal1',
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to load MFA settings.');
    } finally {
      setLoading(false);
    }
  }

  const verifiedFactors = factors.filter((f) => f.status === 'verified');
  const unverifiedFactors = factors.filter((f) => f.status === 'unverified');

  const handleEnroll = useCallback(async () => {
    setEnrolling(true);
    setError(null);
    try {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Estech Authenticator',
      });
      if (enrollError) throw enrollError;
      if (!data?.id || !data?.totp) throw new Error('Enrollment failed.');
      setEnrollData({
        id: data.id,
        qr_code: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      });
      setVerifying(false);
      setChallengeId(null);
      setVerifyCode('');
    } catch (err: any) {
      setError(err?.message || 'Failed to start MFA enrollment.');
    } finally {
      setEnrolling(false);
    }
  }, []);

  const handleCreateChallenge = useCallback(async () => {
    if (!enrollData) return;
    setVerifying(true);
    setError(null);
    try {
      const { data, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollData.id,
      });
      if (challengeError) throw challengeError;
      setChallengeId(data?.id || null);
      setVerifyCode('');
    } catch (err: any) {
      setError(err?.message || 'Failed to create verification challenge.');
    } finally {
      setVerifying(false);
    }
  }, [enrollData]);

  const handleVerifyEnrollment = useCallback(async () => {
    if (!challengeId || !verifyCode.trim() || !enrollData) return;
    setVerifying(true);
    setError(null);
    try {
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollData.id,
        challengeId,
        code: verifyCode.trim(),
      });
      if (verifyError) throw verifyError;
      setMessage('MFA enabled successfully. Your authenticator app is now linked.');
      setEnrollData(null);
      setVerifyCode('');
      setChallengeId(null);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Invalid code. Please try again.');
    } finally {
      setVerifying(false);
    }
  }, [challengeId, verifyCode, enrollData]);

  const handleRemoveFactor = async (factorId: string) => {
    if (!window.confirm('Remove this authenticator factor? You will no longer need a code for this factor.')) {
      return;
    }
    setSaving(factorId);
    setError(null);
    try {
      const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId });
      if (removeError) throw removeError;
      setMessage('Authenticator factor removed.');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to remove factor.');
    } finally {
      setSaving(null);
    }
  };

  const handleCopySecret = () => {
    if (!enrollData) return;
    navigator.clipboard.writeText(enrollData.secret);
    setMessage('Secret copied to clipboard.');
  };

  if (!user) return null;
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 lg:py-12">
        <div className="mb-8 flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold text-text-heading">Multi-factor authentication</h1>
        </div>
        <p className="text-sm text-text-muted mb-8">
          Add an authenticator app (such as Google Authenticator, 1Password, or Bitwarden) as a second
          factor for signing in. MFA is optional and recommended for workspace administrators.
        </p>

        {error && <Alert variant="error" title="Error" description={error} />}
        {message && <Alert variant="success" title="Success" description={message} />}

        {/* Current AAL */}
        <div className="rounded-xl border border-border/40 bg-background-secondary/40 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-heading">Current assurance level</span>
            <span className={`text-xs font-medium ${aal.currentAAL === 'aal2' ? 'text-success' : 'text-text-muted'}`}>
              {aal.currentAAL === 'aal2' ? 'AAL2 (MFA verified)' : 'AAL1 (password only)'}
            </span>
          </div>
          <p className="text-xs text-text-muted">
            Complete the MFA challenge below to promote your session to AAL2 for sensitive operations.
          </p>
        </div>

        {/* Enrollment in progress */}
        {enrollData && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 mb-6">
            <h3 className="text-base font-medium text-text-heading mb-3">Set up your authenticator app</h3>
            <div className="flex flex-col items-center gap-4 mb-4">
              <div className="w-32 h-32 rounded-xl border border-border/40 bg-white/50 overflow-hidden">
                <img src={enrollData.qr_code} alt="MFA QR code" className="w-full h-full object-contain" />
              </div>
              <p className="text-xs text-text-muted">Scan with your authenticator app</p>
            </div>
            <div className="flex items-center gap-2 w-full max-w-xs mb-3">
              <span className="flex-1 text-xs font-mono text-text-heading select-all">
                {enrollData.secret}
              </span>
              <button
                onClick={handleCopySecret}
                className="rounded-xl p-2 text-text-muted hover:bg-surface/60 transition"
                title="Copy secret"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <div className="w-full max-w-xs space-y-3">
              <label className="text-xs font-medium text-text-heading">Enter the 6-digit code from your app</label>
              <input
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                className="w-full rounded-xl border border-border/60 bg-background-secondary/60 px-4 py-3 text-sm text-text-heading text-center outline-none transition focus:border-primary/40"
              />
              <div className="flex items-center justify-between">
                <button
                  onClick={handleCreateChallenge}
                  disabled={verifying}
                  className="text-xs text-primary hover:underline disabled:opacity-50"
                >
                  {verifying ? 'Creating challenge…' : 'Get new code'}
                </button>
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-xs text-primary hover:underline"
                >
                  {showSecret ? 'Hide secret' : 'Show secret'}
                </button>
              </div>
              <button
                onClick={handleVerifyEnrollment}
                disabled={verifying || !challengeId || !verifyCode.trim()}
                className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary/90 transition disabled:opacity-50"
              >
                {verifying ? 'Verifying…' : 'Verify & enable MFA'}
              </button>
            </div>
          </div>
        )}

        {/* Enroll / status */}
        {!enrollData && (
          <div className="mb-6">
            {verifiedFactors.length > 0 ? (
              <div className="rounded-xl border border-success/20 bg-success/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <h3 className="text-base font-medium text-text-heading">MFA is enabled</h3>
                </div>
                <p className="text-sm text-text-muted">
                  You have {verifiedFactors.length} verified authenticator factor{verifiedFactors.length > 1 ? 's' : ''}.
                </p>
              </div>
            ) : (
              <Button
                onClick={handleEnroll}
                disabled={enrolling || verifying}
                className="w-full"
              >
                {enrolling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Phone className="h-4 w-4 mr-2" />}
                Enable authenticator MFA
              </Button>
            )}
          </div>
        )}

        {/* Enrolled factors */}
        {factors.length > 0 && (
          <div className="rounded-xl border border-border/40 bg-surface/60 p-4">
            <h3 className="text-xs font-medium text-text-heading mb-4 uppercase tracking-wider text-text-muted">
              Enrolled factors
            </h3>
            <div className="space-y-3">
              {factors.map((factor) => (
                <div
                  key={factor.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-background-secondary/40 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Phone className={`h-4 w-4 ${factor.status === 'verified' ? 'text-success' : 'text-text-muted'}`} />
                    <div>
                      <span className="text-sm font-medium text-text-heading">{factor.friendly_name || 'Authenticator'}</span>
                      <span className={`text-xs font-medium ml-2 px-2 py-0.5 rounded ${
                        factor.status === 'verified' ? 'bg-success/10 text-success border border-success/20' : 'bg-text-muted/10 text-text-muted border border-text-muted/20'
                      }`}>{factor.status}</span>
                    </div>
                  </div>
                  {factor.status === 'verified' && (
                    <button
                      onClick={() => handleRemoveFactor(factor.id)}
                      disabled={saving === factor.id}
                      className="text-xs text-danger hover:bg-danger/10 transition"
                    >
                      {saving === factor.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <Link href="/settings" className="text-sm text-primary hover:underline flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to settings
          </Link>
        </div>
      </div>
    </div>
  );
}
