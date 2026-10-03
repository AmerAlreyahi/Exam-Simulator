/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  /** 'gis' (default) = Google popup button; 'redirect' = Supabase OAuth redirect */
  readonly VITE_GOOGLE_SIGNIN_MODE?: 'gis' | 'redirect';
  readonly VITE_APP_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
