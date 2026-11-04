import { supabase } from './supabase.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Universal API fetcher that attaches the active Supabase JWT bearer token.
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  // Get active session token
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMessage);
    err.status = response.status;
    err.details = data?.details;
    throw err;
  }

  return data;
}

export const api = {
  get: (endpoint, options) => apiRequest(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
  patch: (endpoint, body, options) => apiRequest(endpoint, { method: 'PATCH', body: JSON.stringify(body), ...options }),
  put: (endpoint, body, options) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
  delete: (endpoint, body, options) => apiRequest(endpoint, {
    method: 'DELETE',
    ...(body ? { body: JSON.stringify(body) } : {}),
    ...options
  })
};
