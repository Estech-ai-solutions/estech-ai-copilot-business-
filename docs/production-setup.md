# Production Setup — Authentication & External Providers

Estech Business Copilot uses **Supabase Auth** as its identity provider.
External providers (Google, Microsoft Entra, GitHub OAuth, Resend SMTP,
Cloudflare Turnstile) are configured in the Supabase dashboard and provider
consoles — NOT in application source code. No provider credentials are committed
to this repository.

Provider OAuth buttons are controlled by **feature flags** (see `.env.example`).
Unconfigured providers are hidden by default. Enable a flag only after its
credentials have been added in Supabase Auth > Providers.

## A. Email confirmation (kept enabled)

Email confirmation remains enabled in Supabase. Unverified accounts cannot
access protected workspaces or customer data. Do not auto-confirm accounts to
bypass SMTP.

Public email/password **registration is currently disabled** because custom
SMTP is not configured (see section I). Existing accounts can still sign in
with email + password. New accounts must use a connected OAuth provider.
Password reset by email is **not** available until SMTP is configured.

## B. Resend — transactional email delivery (future requirement)

Resend is the recommended SMTP transport. Supabase Auth generates and sends
all authentication emails; Resend would deliver them once configured.

**Resend SMTP is not currently configured.** A verified sending domain is
unavailable, so email registration, email confirmation delivery, and password
reset by email are **not** production-ready. Do not present them as working
features until Resend SMTP has been configured in Supabase and tested
end-to-end.

When Resend is configured later:

### 1. Resend console
1. Create a Resend account and verify a sending domain (recommended: a
   dedicated subdomain such as `mail.your-domain.com`).
2. Add the DNS records Resend provides (SPF, DKIM).
3. Add a DMARC record for your domain.
4. Create an API key with "Send" permissions.
5. Add a sender address on the verified domain (e.g.
   `verify@mail.your-domain.com`).

### 2. Supabase SMTP configuration
**Authentication > Settings > SMTP:**

| Setting | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | your Resend sending API key |
| Sender Name | Estech |
| Sender Email | `verify@mail.your-domain.com` |

### 3. Templates
**Authentication > Email Templates:** use Estech-branded templates for
confirm signup, reset password, and change email. Disable email link tracking
for authentication emails.

## C. Google OAuth

### 1. Google Cloud Console
1. Create (or select) a Google Cloud project.
2. Enable the Google Identity Services / Google Sign-In API.
3. **Credentials > Create credentials > OAuth client ID**
   - Application type: Web application.
   - Name: Estech Business Copilot.
4. **Authorized JavaScript origins** (application origins only, no paths):
   - `http://localhost:3000` (local development)
   - `https://business.estech.dedyn.io` (production)
5. **Authorized redirect URIs** (must contain the Supabase Auth callback):
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
6. Record the **Client ID** and **Client Secret**.

### 2. Supabase OAuth configuration
**Authentication > Providers > Google:**
- Enable Google.
- Enter the Client ID and Client Secret.

### 3. Supabase URL configuration
**Authentication > URL Configuration > Redirect URLs:** add the Estech
application callback:
- `https://business.estech.dedyn.io/auth/callback`
- `http://localhost:3000/auth/callback` (local development)

### 4. Enable in the app
Set `NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH="true"` in `.env`.

The application's `signInWithOAuth()` call passes
`redirectTo: <site-url>/auth/callback`, which is the Estech application
callback (not the Supabase callback).

Scopes: `openid email profile`.

## D. Microsoft Entra (Azure AD) OAuth

Supabase provider identifier: `azure`.

### 1. Microsoft Entra admin center
1. Create (or select) an Entra ID app registration.
2. **Authentication:**
   - Add a platform: **Web**.
   - Redirect URIs (must contain the Supabase Auth callback):
     - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - Supported account types:
     - **`common`** — organizational and personal Microsoft accounts.
     - **`consumers`** — personal Microsoft accounts only.
     - **Specific tenant ID** — restricted to a single organizational tenant.
     Use `common` or `consumers` unless you intend to restrict sign-in to one
     specific organization. Do not enter a specific tenant ID for general
     Microsoft account support.
3. **Certificates & secrets > Client secrets:** create a secret and record its
   value (shown only once).
4. **Overview:** record the **Application (client) ID** and **Directory (tenant)
   ID**.
5. **API permissions > Add a permission > Microsoft Graph > Delegated:**
   - `email`
   - `openid`
   - `profile`
   - Grant admin consent for your tenant.

### 2. Supabase OAuth configuration
**Authentication > Providers > Azure (Microsoft):**
- Enable Azure.
- Client ID: the Entra app Application ID.
- Secret: the client secret value.
- URL:
  - `https://login.microsoftonline.com/common/v2.0` for org + personal accounts, or
  - `https://login.microsoftonline.com/consumers/v2.0` for personal accounts only, or
  - `https://login.microsoftonline.com/{tenant-id}/v2.0` for a single tenant.

### 3. Supabase URL configuration
**Authentication > URL Configuration > Redirect URLs:** add the Estech
application callback:
- `https://business.estech.dedyn.io/auth/callback`
- `http://localhost:3000/auth/callback` (local development)

### 4. Enable in the app
Set `NEXT_PUBLIC_ENABLE_MICROSOFT_OAUTH="true"` in `.env`.

Scopes: `openid email profile`.

## E. GitHub OAuth

### 1. GitHub OAuth App
1. **Settings > Developer settings > OAuth Apps > New OAuth App.**
   - Application name: Estech Business Copilot.
   - Homepage URL: `https://business.estech.dedyn.io` (or
     `http://localhost:3000` locally).
   - Authorization callback URL (must contain the Supabase Auth callback):
     `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
2. Record the **Client ID** and generate a **Client secret**.

### 2. Supabase OAuth configuration
**Authentication > Providers > GitHub:**
- Enable GitHub.
- Enter the Client ID and Client Secret.

### 3. Supabase URL configuration
**Authentication > URL Configuration > Redirect URLs:** add the Estech
application callback:
- `https://business.estech.dedyn.io/auth/callback`
- `http://localhost:3000/auth/callback` (local development)

### 4. Enable in the app
Set `NEXT_PUBLIC_ENABLE_GITHUB_OAUTH="true"` in `.env`.

Scopes: `user:email read:user`.

## F. OAuth callback flow — two URIs

Every OAuth sign-in involves **two different callback URIs**:

| URI | Purpose | Where configured | Example |
|---|---|---|---|
| Provider console callback URI | The OAuth provider redirects here after the user approves. This is the **Supabase Auth** endpoint, which exchanges the code and forwards the user to the app callback. | Provider console (Google Cloud, Microsoft Entra, GitHub) | `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` |
| Application redirect URI | After Supabase establishes the session, the browser is redirected here so the app can complete onboarding/dashboard routing. | Supabase Auth > URL Configuration > Redirect URLs **and** the app's `signInWithOAuth()` `redirectTo` option | `https://business.estech.dedyn.io/auth/callback` |

The application's `signInWithOAuth()` `redirectTo` must point to the Estech
application callback (`/auth/callback`), not the Supabase callback.

## G. Implementation verification

- **`redirectTo`** (`components/auth/oauth-provider-button.tsx`): set to
  `<site-url>/auth/callback`, i.e. the Estech application callback.
- **Code exchange** (`app/auth/callback/page.tsx`): the page reads `?code=`
  from the current window location and calls
  `supabase.auth.exchangeCodeForSession(code)` to establish the session.
- **Redirect destination**: `redirectTo` is derived from
  `getSiteUrl()` (the `NEXT_PUBLIC_SITE_URL` env var or `window.location.origin`),
  not from user-supplied input, so it is not an open-redirect vector through the
  button. The callback page does not accept a user-controlled `redirectTo`
  parameter.
- **Session persistence**: after `exchangeCodeForSession`, Supabase SSR cookies
  are set and the session persists across page refreshes and redirects. The
  callback page redirects to `/onboarding` (first-time users) or `/dashboard`
  (returning users).

## H. Cloudflare Turnstile CAPTCHA

Supabase Auth has native CAPTCHA support. Turnstile protects **only** the
password-based flows that Supabase exposes: sign-up, password login, and
password recovery.

**OAuth sign-in flows (Google, Microsoft, GitHub) are NOT protected by
Turnstile.** They are handled by the provider's own consent screen and
Supabase's OAuth exchange. Do not claim OAuth flows are CAPTCHA-protected.

### 1. Cloudflare dashboard
1. Add a site to Cloudflare Turnstile (Managed mode).
2. Record the **Site Key** (public) and **Secret Key** (private).

### 2. Supabase CAPTCHA configuration
**Authentication > Settings > CAPTCHA:**
- Provider: `cloudflare-turnstile`
- Site Key: your Turnstile Site Key
- Secret Key: your Turnstile Secret Key (never in browser code)

### 3. Enable in the app
Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in `.env`.

## I. Guest demo mode

The demo (`/demo`) is a **read-only, synthetic-data experience**. It does not
call Supabase for reads or writes, never exposes real tenant records, and
demonstration users cannot create, modify, or delete anything.

- Clearly labeled "DEMO".
- Sensitive settings, billing, integrations, and administrative actions are
  disabled (there is no backend write path in demo mode).
- Buttons route visitors to sign in or create a permanent account.
- Enable/disable with `NEXT_PUBLIC_ENABLE_GUEST_DEMO` (default `true`).

## J. TOTP Multi-Factor Authentication (MFA)

MFA uses Supabase's native MFA APIs — no external credentials required.

- Users can enroll an authenticator app (QR code + manual secret).
- Enrollment requires TOTP verification before the factor is active.
- Users can view enrolled factors and remove them.
- MFA is optional initially; recommended for workspace administrators.

## K. Environment variables

See `.env.example` for placeholder names. Secrets are entered in provider
consoles and Supabase dashboards — never stored in `.env`.

| Variable | Configured in | Notes |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Supabase dashboard | required |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase dashboard | required |
| NEXT_PUBLIC_SITE_URL | .env / provider redirect | Estech application origin, no path |
| NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH | .env | feature flag, default false |
| NEXT_PUBLIC_ENABLE_MICROSOFT_OAUTH | .env | feature flag, default false |
| NEXT_PUBLIC_ENABLE_GITHUB_OAUTH | .env | feature flag, default false |
| NEXT_PUBLIC_ENABLE_GUEST_DEMO | .env | feature flag, default true |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY | .env | public site key only |
| NEXT_PUBLIC_SENTRY_DSN | .env | optional monitoring |
| Resend SMTP password | Supabase dashboard SMTP | secret (not configured) |
| Google Client ID / Secret | Supabase Auth providers | secret |
| Microsoft Client ID / Secret | Supabase Auth providers | secret |
| GitHub Client ID / Secret | Supabase Auth providers | secret |
| Turnstile Secret Key | Supabase Auth CAPTCHA | secret |

## L. Classification of current state

- **Code implemented and tested:** OAuth provider buttons (Google/Microsoft/
  GitHub) with feature flags, email/password login for existing accounts,
  registration disabled, password-reset availability notice, guest demo mode,
  OAuth callback route, session persistence, RLS, security headers, health
  endpoint, MFA settings page, mocked provider and demo unit tests, lint.
- **Configuration prepared but awaiting credentials:** Google, Microsoft, GitHub
  OAuth clients; Turnstile keys; Sentry DSN.
- **Not configured / not production-ready:** Resend SMTP (no verified sending
  domain — email registration, confirmation delivery, and password reset are
  unavailable). OAuth flows require credentialed end-to-end tests against
  configured providers.
- **Features remaining incomplete:** distributed rate limiting (requires a
  shared store such as Redis/KV), automated browser-level integration tests
  against a dedicated test Supabase instance.
