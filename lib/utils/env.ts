const sanitizeBase = (value: string) => value.replace(/\/$/, '');

let cachedBaseUrl: string | null = null;

export const getBackendBaseUrl = () => {
  if (cachedBaseUrl) {
    return cachedBaseUrl;
  }

  const fromEnv =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_BE_URL;

  cachedBaseUrl = fromEnv ? sanitizeBase(fromEnv) : 'http://localhost:4000';
  return cachedBaseUrl;
};

export const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getBackendBaseUrl()}${normalizedPath}`;
};
