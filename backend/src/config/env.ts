export interface AppConfig {
  databaseUrl: string;
  databaseSsl: boolean;
  corsOrigin: string;
  port: number;
}

/** Validates environment variables at startup so misconfiguration fails fast and loudly. */
export function loadConfig(env: Record<string, string | undefined>): AppConfig {
  const databaseUrl = env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const port = env.PORT ? Number(env.PORT) : 3000;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be an integer between 1 and 65535, got "${env.PORT}"`);
  }

  return {
    databaseUrl,
    databaseSsl: env.DATABASE_SSL === 'true',
    corsOrigin: env.CORS_ORIGIN?.trim() || 'http://localhost:5173',
    port,
  };
}
