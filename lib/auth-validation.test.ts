import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword, classifyAuthError } from '@/lib/auth-validation';

describe('validateEmail', () => {
  it('rejects empty email', () => {
    expect(validateEmail('')).toBe('Email is required.');
  });
  it('rejects invalid email', () => {
    expect(validateEmail('not-an-email')).toBe('Please enter a valid email address.');
  });
  it('accepts valid email', () => {
    expect(validateEmail('jane@example.com')).toBeNull();
  });
});

describe('validatePassword', () => {
  it('rejects empty password', () => {
    expect(validatePassword('')).toBe('Password is required.');
  });
  it('rejects short password', () => {
    expect(validatePassword('abc')).toBe('Password must be at least 6 characters.');
  });
  it('accepts valid password', () => {
    expect(validatePassword('secure123')).toBeNull();
  });
});

describe('classifyAuthError', () => {
  it('maps unverified email error', () => {
    expect(classifyAuthError('Email not confirmed')).toContain('verify your email');
  });
  it('maps rate limit error', () => {
    expect(classifyAuthError('too many requests')).toContain('Too many sign-in attempts');
  });
  it('maps invalid credentials', () => {
    expect(classifyAuthError('invalid login credentials')).toContain('Invalid email or password');
  });
  it('maps user not found', () => {
    expect(classifyAuthError('user not found')).toContain('No account found');
  });
  it('returns the message unchanged when unknown', () => {
    expect(classifyAuthError('Something broke')).toBe('Something broke');
  });
  it('maps captcha errors', () => {
    expect(classifyAuthError('captcha verification failed')).toContain('CAPTCHA');
  });
});
