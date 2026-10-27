const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : '');
const TOKEN_KEY = 'library_access_token';

export function setAccessToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getAccessToken();

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!API_URL) {
    throw new Error('The library API address is not configured. Set VITE_API_URL to your Render URL, including /api.');
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error(
      import.meta.env.DEV
        ? 'Cannot reach the library API. Start the Express server and MySQL, then try again.'
        : 'Cannot reach the library API. Check VITE_API_URL and that the Render service is running.'
    );
  }
  if (response.status === 204) return null;

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || `Request failed (${response.status})`);
  }
  return result;
}
