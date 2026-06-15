'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SiteNav from '@/components/site-nav';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
        return;
      }
      if (json.token) {
        window.localStorage.setItem('authToken', json.token);
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError('Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <SiteNav />
      <section className="section-container py-16">
        <div className="max-w-2xl rounded-3xl border border-slate-800/80 bg-slate-900/80 p-10 shadow-xl shadow-slate-950/20">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Welcome back</p>
          <h1 className="mt-4 text-4xl font-bold text-white">Sign in to your business workspace.</h1>
          <p className="mt-4 text-slate-300">Use your email and password to continue managing business knowledge, tasks, and AI workflows.</p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-200">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none"
              />
            </div>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-400">
            New to Estech? <a href="/register" className="text-sky-300 underline hover:text-sky-200">Create an account</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
