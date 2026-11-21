/** Where the API lives. Set VITE_API_URL at build time; the default suits local development. */
export const API_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';
