const envUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_SERVER_URL ||
  process.env.NEXT_PUBLIC_SERVER_URL;

// Fallback keeps existing production behavior if env isn't provided.
export const URL = envUrl || 'http://46.225.17.97:5000';