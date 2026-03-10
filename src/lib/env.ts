const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim();
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

const requiredSupabaseEnv = [
  { key: "VITE_SUPABASE_URL", value: SUPABASE_URL },
  { key: "VITE_SUPABASE_PUBLISHABLE_KEY", value: SUPABASE_PUBLISHABLE_KEY },
];

export const hasSupabaseEnv = requiredSupabaseEnv.every((item) => Boolean(item.value));

export const missingSupabaseEnvKeys = () =>
  requiredSupabaseEnv.filter((item) => !item.value).map((item) => item.key);
