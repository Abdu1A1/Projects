function optional(name: string) {
  return process.env[name] || "";
}

export function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  appUrl: optional("NEXT_PUBLIC_APP_URL"),
  supabaseUrl: optional("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: optional("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  cloudinaryCloudName: optional("CLOUDINARY_CLOUD_NAME"),
  cloudinaryApiKey: optional("CLOUDINARY_API_KEY"),
  cloudinaryApiSecret: optional("CLOUDINARY_API_SECRET"),
  anthropicApiKey: optional("ANTHROPIC_API_KEY"),
};

export function hasRequiredSupabaseEnv() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function hasCloudinaryEnv() {
  return Boolean(env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret);
}

export function hasAnthropicEnv() {
  return Boolean(env.anthropicApiKey);
}
