'use client';

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: any) => number;
      remove: (id: number) => void;
      reset: (id: number) => void;
    };
  }
}

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from 'react';

type TurnstileRef = {
  reset: () => void;
};

type TurnstileProps = {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  action?: string;
};

export const Turnstile = forwardRef<TurnstileRef, TurnstileProps>(
  ({ siteKey, onVerify, onError, disabled = false, action = 'login' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<number | null>(null);
    const [ready, setReady] = useState(false);

    const reset = useCallback(() => {
      widgetIdRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    }, []);

    useImperativeHandle(ref, () => ({ reset }), [reset]);

    useEffect(() => {
      if (disabled || window.turnstile) {
        setReady(true);
        return undefined;
      }
      const script = document.createElement('script');
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => setReady(true);
      document.head.appendChild(script);
      return () => {
        try {
          document.head.removeChild(script);
        } catch {
          // ignore
        }
      };
    }, [disabled]);

    useEffect(() => {
      if (!ready || !containerRef.current || widgetIdRef.current !== null) {
        return undefined;
      }
      if (!window.turnstile) {
        return undefined;
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action,
        callback: (token: string) => {
          onVerify(token);
        },
        'error-callback': () => {
          widgetIdRef.current = null;
          onError?.('Verification failed. Please try again.');
        },
        'expired-callback': () => {
          widgetIdRef.current = null;
          onError?.('Verification expired. Please try again.');
        },
      });
      return () => {
        if (widgetIdRef.current !== null && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // ignore
          }
          widgetIdRef.current = null;
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, siteKey, action, onVerify, onError]);

    return (
      <div ref={containerRef} aria-label="CAPTCHA verification" style={{ display: 'inline-block' }} />
    );
  },
);

Turnstile.displayName = 'Turnstile';
