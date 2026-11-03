# Production Setup — External Authentication Integrations

Estech Business Copilot uses **Supabase Auth** as its identity provider.
External providers (Resend SMTP, Google OAuth, Cloudflare Turnstile) are
configured in the Supabase dashboard and provider consoles — NOT in application
source code. No provider credentials are committed to this repository.

## A. Resend — transactional email delivery

Supabase Auth generates and sends all authentication emails (confirmation,
password reset, email change). Resend is used as the SMTP transport so
emails are delivered reliably from a verified domain.

### 1. Resend console
1. Create a Resend account and verify a sending domain (recommended: a
   dedicated subdomain such as `mail.your-domain.com`).
2. Add the DNS records Resend provides (SPF, DKIM).
3. Add a DMARC record for your domain according to your email policy.
4. Create an API key with "Send" permissions.
5. Add a sender address on the verified domain (e.g.
   `verify@mail.your-domain.com`).

### 2. Supabase SMTP configuration
In the Supabase dashboard go to **Authentication > Settings > SMTP** and enter:

| Setting | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | your Resend sending API key |
| Sender Name | Estech |
| Sender Email | `verify@mail.your-domain.com` |

Enable **Email Confirmations** so unverified accounts cannot access protected
workspaces or customer data. Confirmation emails must remain enabled in
production — do not auto-confirm accounts to bypass SMTP.

### 3. Templates
In **Authentication > Email Templates**, use professional Estech-branded
templates for:

- **Confirm signup** — account verification link + resend instructions.
- **Reset password** — password recovery link + expiry warning.
- **Change email** — email change confirmation link.

Disable email link tracking for authentication emails if it can modify or
break verification URLs.

### 4. Production readiness
Email verification is **not** fully operational until real delivery has been
tested end-to-end (register → receive email → click link → sign in).

---

## B. Google OAuth

Google sign-in is handled entirely by Supabase's native OAuth flow. The app
only initiates the redirect and handles the callback.

### 1. Google Cloud Console
1. Create (or select) a Google Cloud project.
2. Enable the **Google Identity Services / Google Sign-In** API.
3. Go to **Credentials > Create credentials > OAuth client ID**.
   - Application type: Web application.
   - Name: Estech Business Copilot.
4. Add **Authorized JavaScript origins**:
   - `http://localhost:3000` (local development)
   - `https://your-app-domain.com` (production)
5. Add **Authorized redirect URIs**:
   - `http://localhost:3000/auth/callback`
   - `https://your-app-domain.com/auth/callback`
6. Record the **Client ID** and **Client Secret**.

### 2. Supabase OAuth configuration
In the Supabase dashboard go to **Authentication > Providers > Google**:

- Enable Google.
- Enter the Client ID and Client Secret from Google Cloud.
- Set the redirect URL to `https://your-app-domain.com/auth/callback`
  (use `http://localhost:3000/auth/callback` for local development).

### 3. Application behavior
The login and register pages render a **Continue with Google** button that
calls `supabase.auth.signInWithOAuth({ provider: 'google' })`.

- First-time Google users: a profile and workspace are created on first
  dashboard load via the existing onboarding flow.
- Existing users: the OAuth session is established and the user is redirected
  to the dashboard.
- Errors/cancellation: shown as a friendly message; no account-existence
  details are leaked.
- Do not silently merge separate accounts based on unverified email.
- Scopes: `openid`, `email`, `profile`.

OAuth is **not** active until real Client ID/Secret are configured and the
flow is tested end-to-end.

---

## C. Cloudflare Turnstile CAPTCHA

Supabase Auth has native CAPTCHA support. Turnstile protects sign-up,
password login, and password recovery. The Secret Key is configured only in
Supabase; the Site Key is public browser configuration.

### 1. Cloudflare dashboard
1. Add a site to Cloudflare Turnstile.
2. Choose **Managed** mode.
3. Record the **Site Key** (public) and **Secret Key** (private).

### 2. Supabase CAPTCHA configuration
In **Authentication > Settings > CAPTCHA**:
- Provider: `cloudflare-turnstile`
- Site Key: your Turnstile Site Key
- Secret Key: your Turnstile Secret Key (never in browser code)

### 3. Application behavior
- Turnstile widget renders on sign-up, login, and password-reset forms.
- The challenge token is passed into the corresponding Supabase Auth call.
- Submission is blocked without a valid required token.
- Expired/failed tokens show understandable errors and allow retry.
- Separate testing/production keys: use Cloudflare's documented dummy keys
  for automated tests (see `docs/production-setup.md` and the test suite).

---

## D. TOTP Multi-Factor Authentication (MFA)

MFA uses Supabase's native MFA APIs — no external credentials required.

- Users can enroll an authenticator app (QR code + manual secret).
- Enrollment requires TOTP verification before the factor is active.
- Users can view enrolled factors and remove them.
- MFA is optional initially; recommended for workspace administrators.
- Sensitive operations require AAL2 assurance where supported.

---

## E. Environment variables

See `.env.example` for placeholder names. Values marked **manual** must be
entered in the provider/Supabase dashboards and are never stored in `.env`.

| Variable | Configured in | Notes |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Supabase dashboard | required |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase dashboard | required |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY | .env | public site key only |
| NEXT_PUBLIC_SENTRY_DSN | .env | optional monitoring |
| Resend SMTP password | Supabase dashboard SMTP | secret, never in .env |
| Google Client ID / Secret | Supabase Auth providers | secret, never in .env |
| Turnstile Secret Key | Supabase Auth CAPTCHA | secret, never in .env |

## F. Classification of current state

- **Code implemented and tested:** RLS migrations, security headers, health
  endpoint, Google OAuth buttons, Turnstile widgets, MFA settings page,
  production build, lint.
- **Configuration prepared but awaiting credentials:** Resend SMTP, Google
  OAuth client, Turnstile keys, Sentry DSN.
- **Configuration completed but awaiting real-world verification:** email
  delivery, OAuth flow, CAPTCHA enforcement require credentialed end-to-end
  tests against the configured providers.
- **Features remaining incomplete:** distributed rate limiting (requires a
  shared store such as Redis/KV), automated browser-level integration tests
  against a dedicated test Supabase instance.
