'use client';

import { useEffect, useState, type FormEvent } from 'react';
import SidebarNav from '@/components/sidebar-nav';
import { User } from 'lucide-react';

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
      <div className="min-h-screen bg-slate-950">
        <SidebarNav />
        <main className="lg:pl-64">
          <div className="px-6 py-8 lg:px-12">
            <p className="text-slate-400">Please sign in to manage your business profile.</p>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <SidebarNav />
        <main className="lg:pl-64">
          <div className="px-6 py-8 lg:px-12">
            <p className="text-slate-400">Loading profile...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <SidebarNav />
      
      <main className="lg:pl-64">
        <div className="px-6 py-8 lg:px-12">
          {/* Header */}
          <div className="max-w-4xl">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-sky-400" />
              <h1 className="text-2xl font-bold text-white">Business Profile</h1>
            </div>
            <p className="mt-2 text-slate-400">
              Add your business information so the AI can generate accurate responses aligned with your brand.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 rounded-lg border border-slate-800 bg-slate-900/50 p-6 max-w-2xl">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200">Business name</label>
                <input
                  value={profile?.name || ''}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value } as Profile)}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-100 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200">Business type</label>
                <select
                  value={profile?.business_type || ''}
                  onChange={(e) => setProfile({ ...profile, business_type: e.target.value } as Profile)}
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-100 outline-none focus:border-sky-500"
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
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-100 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200">Products / Services</label>
                <textarea
                  value={profile?.products || ''}
                  onChange={(e) => setProfile({ ...profile, products: e.target.value } as Profile)}
                  rows={4}
                  placeholder="List your main offerings..."
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-100 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200">Pricing information</label>
                <textarea
                  value={profile?.pricing_info || ''}
                  onChange={(e) => setProfile({ ...profile, pricing_info: e.target.value } as Profile)}
                  rows={3}
                  placeholder="General pricing, packages..."
                  className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-100 outline-none focus:border-sky-500"
                />
              </div>

              {error && <p className="text-sm text-rose-400">{error}</p>}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save profile'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}