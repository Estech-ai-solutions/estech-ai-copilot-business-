'use client';

import { useEffect, useState, type FormEvent } from 'react';
import SiteNav from '@/components/site-nav';

type Profile = {
  id: number;
  name: string;
  description?: string;
  business_type?: string;
  products?: string;
  services?: string;
  pricing_info?: string;
};

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = window.localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [authenticated, setAuthenticated] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setAuthenticated(false);
      setLoading(false);
      return;
    }
    
    if (!window.localStorage.getItem('authToken')) {
      setAuthenticated(false);
      setLoading(false);
      return;
    }

    fetch('/api/profile', { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) setProfile(data.profile);
      })
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(profile)
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        alert('Profile saved!');
      }
    } catch {
      setError('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <SiteNav />
        <section className="section-container py-16">
          <p className="text-slate-400">Please sign in to manage your business profile.</p>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <SiteNav />
        <section className="section-container py-16">
          <p className="text-slate-400">Loading profile...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <SiteNav />
      <section className="section-container py-16">
        <div className="max-w-4xl">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Business Profile</p>
          <h1 className="mt-4 text-4xl font-bold text-white">Set up your business for AI-powered responses.</h1>
          <p className="mt-4 text-slate-300 leading-8">
            Add your business information so the AI can generate accurate responses aligned with your brand.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 rounded-3xl border border-slate-800/80 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-200">Business name</label>
              <input
                value={profile?.name || ''}
                onChange={(e) => setProfile({ ...profile, name: e.target.value } as Profile)}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200">Business type</label>
              <select
                value={profile?.business_type || ''}
                onChange={(e) => setProfile({ ...profile, business_type: e.target.value } as Profile)}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none"
              >
                <option value="">Select type</option>
                <option value="agency">Agency / Consulting</option>
                <option value="ecommerce">E-commerce / Online Store</option>
                <option value="freelancer">Freelancer / Creator</option>
                <option value="service">Service Business</option>
                <option value="retail">Retail / Shop</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200">Description</label>
              <textarea
                value={profile?.description || ''}
                onChange={(e) => setProfile({ ...profile, description: e.target.value } as Profile)}
                rows={3}
                placeholder="Tell us about your business..."
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200">Products / Services</label>
              <textarea
                value={profile?.products || ''}
                onChange={(e) => setProfile({ ...profile, products: e.target.value } as Profile)}
                rows={4}
                placeholder="List your main offerings..."
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200">Pricing information</label>
              <textarea
                value={profile?.pricing_info || ''}
                onChange={(e) => setProfile({ ...profile, pricing_info: e.target.value } as Profile)}
                rows={3}
                placeholder="General pricing, packages..."
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none"
              />
            </div>

            {error && <p className="text-sm text-rose-400">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}