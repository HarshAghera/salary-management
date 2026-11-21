import { loadConfig } from './env';

const validEnv = { DATABASE_URL: 'postgresql://u:p@localhost:5432/db' };

describe('loadConfig', () => {
  it('applies defaults for optional settings', () => {
    expect(loadConfig(validEnv)).toEqual({
      databaseUrl: validEnv.DATABASE_URL,
      databaseSsl: false,
      corsOrigin: 'http://localhost:5173',
      port: 3000,
    });
  });

  it('reads explicit values', () => {
    const config = loadConfig({
      ...validEnv,
      DATABASE_SSL: 'true',
      CORS_ORIGIN: 'https://hr.example.com',
      PORT: '8080',
    });
    expect(config).toMatchObject({ databaseSsl: true, corsOrigin: 'https://hr.example.com', port: 8080 });
  });

  it('requires DATABASE_URL', () => {
    expect(() => loadConfig({})).toThrow('DATABASE_URL is required');
  });

  it('rejects a non-numeric PORT', () => {
    expect(() => loadConfig({ ...validEnv, PORT: 'abc' })).toThrow('PORT must be an integer');
  });

  it('rejects an out-of-range PORT', () => {
    expect(() => loadConfig({ ...validEnv, PORT: '70000' })).toThrow('PORT must be an integer');
  });
});
