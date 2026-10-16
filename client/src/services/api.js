const BASE = '/api';

// ---- token storage (wrapped: localStorage can throw in private mode) ----
export const tokenStore = {
  get() { try { return localStorage.getItem('token'); } catch { return null; } },
  set(t) { try { localStorage.setItem('token', t); } catch { /* ignore */ } },
  clear() { try { localStorage.removeItem('token'); } catch { /* ignore */ } },
};

export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

// AuthContext registers a handler here: called when a protected request returns 401
let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

/**
 * Small fetch wrapper: attaches "Authorization: Bearer <token>", parses JSON,
 * turns server validation errors into readable messages, and handles 401
 * (expired / invalid token) by logging out and redirecting to login.
 */
export async function api(path, { method = 'GET', body, silent = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running on port 5000?', 0);
  }

  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }

  if (res.status === 401 && token && !silent && onUnauthorized) onUnauthorized();

  if (!res.ok) {
    const detail = Array.isArray(data.errors) && data.errors.length ? ` (${data.errors.join(', ')})` : '';
    throw new ApiError((data.message || 'Request failed') + detail, res.status);
  }
  return data;
}
