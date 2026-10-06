const envUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_SERVER_URL;

// Fallback for local/legacy until env is set at build time.
export const URL = envUrl || 'http://46.225.17.97:5000';