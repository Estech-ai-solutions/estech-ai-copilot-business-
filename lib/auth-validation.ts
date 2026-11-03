export function validateEmail(email: string): string | null {
  if (!email) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return null;
}

export function classifyAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('captcha')) {
    return 'Please complete the CAPTCHA verification and try again.';
  }
  if (
    normalized.includes('not confirmed') ||
    normalized.includes('email not confirmed') ||
    normalized.includes('email_not_confirmed')
  ) {
    return 'Please verify your email before signing in. Check your inbox for the verification link.';
  }
  if (
    normalized.includes('too many requests') ||
    normalized.includes('too_many_requests') ||
    normalized.includes('rate limit')
  ) {
    return 'Too many sign-in attempts. Please wait a few minutes and try again.';
  }
  if (
    normalized.includes('invalid login credentials') ||
    normalized.includes('invalid_credentials')
  ) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (normalized.includes('user not found') || normalized.includes('user_not_found')) {
    return 'No account found with this email. Please sign up first.';
  }
  if (
    normalized.includes('password should be at least') ||
    normalized.includes('weak_password')
  ) {
    return 'Password does not meet requirements. Please use a stronger password.';
  }
  return message;
}
