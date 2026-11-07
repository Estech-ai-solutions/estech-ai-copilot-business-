import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string; error_description?: string }>;
}) {
  const { code, error: errorParam, error_description: errorDescription } =
    await searchParams;

  if (errorParam) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <h1 className="text-2xl font-semibold text-text-heading">
            Sign-in failed
          </h1>
          <p className="text-sm text-danger">{errorDescription || errorParam}</p>
          <a
            href="/login"
            className="rounded-xl border border-border/40 bg-background-secondary/40 px-4 py-2 text-sm text-primary hover:bg-surface/60 transition"
          >
            Go to sign in
          </a>
        </div>
      </div>
    );
  }

  if (!code) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <h1 className="text-2xl font-semibold text-text-heading">
            Sign-in failed
          </h1>
          <p className="text-sm text-danger">Missing authorization code.</p>
          <a
            href="/login"
            className="rounded-xl border border-border/40 bg-background-secondary/40 px-4 py-2 text-sm text-primary hover:bg-surface/60 transition"
          >
            Go to sign in
          </a>
        </div>
      </div>
    );
  }

  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
    code
  );

  if (exchangeError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <h1 className="text-2xl font-semibold text-text-heading">
            Sign-in failed
          </h1>
          <p className="text-sm text-danger">
            {exchangeError.message || 'Failed to exchange authorization code.'}
          </p>
          <a
            href="/login"
            className="rounded-xl border border-border/40 bg-background-secondary/40 px-4 py-2 text-sm text-primary hover:bg-surface/60 transition"
          >
            Go to sign in
          </a>
        </div>
      </div>
    );
  }

  // On first sign-in the user may not have a profile/workspace yet.
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, onboarding_completed')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .maybeSingle();

  if (!profile || !profile.onboarding_completed) {
    redirect('/onboarding');
  }

  redirect('/dashboard');
}
