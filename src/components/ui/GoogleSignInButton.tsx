import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

// Google Identity Services button: sign-in happens in a popup that Google
// labels with this site's name, not the Supabase project URL.
const GIS_SRC = 'https://accounts.google.com/gsi/client';

declare global {
  interface Window {
    google?: { accounts: { id: any } };
  }
}

let gisPromise: Promise<void> | null = null;
const loadGis = () =>
  (gisPromise ??= new Promise<void>((resolve, reject) => {
    if (window.google?.accounts) return resolve();
    const s = document.createElement('script');
    s.src = GIS_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { gisPromise = null; reject(new Error('Could not load Google sign-in')); };
    document.head.appendChild(s);
  }));

const sha256Hex = async (text: string) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
};

interface Props {
  clientId: string;
  onError: (message: string) => void;
}

export function GoogleSignInButton({ clientId, onError }: Props) {
  const { signInWithGoogleToken } = useAuth();
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadGis();
        if (cancelled || !ref.current) return;
        // Supabase checks the raw nonce against the hash embedded in the ID token.
        const nonce = crypto.randomUUID();
        window.google!.accounts.id.initialize({
          client_id: clientId,
          nonce: await sha256Hex(nonce),
          callback: (r: { credential: string }) =>
            signInWithGoogleToken(r.credential, nonce).catch((e: unknown) =>
              onError(e instanceof Error ? e.message : 'Google sign-in failed')),
        });
        window.google!.accounts.id.renderButton(ref.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          // GIS max is 400px
          width: Math.min(400, Math.max(200, ref.current.clientWidth)),
        });
        setReady(true);
      } catch (e) {
        onError(e instanceof Error ? e.message : 'Google sign-in failed');
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  return (
    <div
      ref={ref}
      style={{ display: 'flex', justifyContent: 'center', width: '100%', minHeight: 44, opacity: ready ? 1 : 0 }}
    />
  );
}
