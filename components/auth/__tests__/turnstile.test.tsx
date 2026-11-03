import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Turnstile } from '@/components/auth/turnstile';

const turnstileMock = {
  render: vi.fn(() => 1),
  remove: vi.fn(),
  reset: vi.fn(),
};

beforeEach(() => {
  vi.resetAllMocks();
  (window as any).turnstile = turnstileMock;
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (window as any).turnstile;
});

describe('Turnstile', () => {
  it('renders widget and invokes onVerify with token', () => {
    const onVerify = vi.fn();
    render(<Turnstile siteKey="1x000000000000000000000000000000000AA" onVerify={onVerify} />);

    expect(turnstileMock.render).toHaveBeenCalled();
    expect(screen.getByLabelText('CAPTCHA verification')).toBeInTheDocument();

    // Simulate the widget calling back with a token.
    const callback = turnstileMock.render.mock.calls[0][1].callback;
    callback('dummy-token');
    expect(onVerify).toHaveBeenCalledWith('dummy-token');
  });

  it('reports errors via onError', () => {
    const onError = vi.fn();
    render(<Turnstile siteKey="1x000000000000000000000000000000000AA" onError={onError} />);
    const errorCallback = turnstileMock.render.mock.calls[0][1]['error-callback'];
    errorCallback();
    expect(onError).toHaveBeenCalledWith('Verification failed. Please try again.');
  });
});
