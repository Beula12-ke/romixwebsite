const required = (key: string, value: string | undefined): string => {
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
};

export const env = {
  supabaseUrl: required('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: required('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY),
  appName: import.meta.env.VITE_APP_NAME ?? 'Romix Website',
  appEnv: import.meta.env.VITE_APP_ENV ?? 'production',
};
