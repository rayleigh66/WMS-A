const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

let tokenGetter: (() => string | null) | null = null;
let onUnauthorized: (() => void) | null = null;

export function setTokenGetter(fn: () => string | null) {
  tokenGetter = fn;
}

export function setOnUnauthorized(fn: () => void) {
  onUnauthorized = fn;
}

export class ApiError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, string | undefined>,
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') url.searchParams.set(k, v);
    });
  }

  const headers: Record<string, string> = {};
  const token = tokenGetter?.();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    onUnauthorized?.();
    throw new ApiError('登录已失效，请重新登录', 401);
  }

  const data = await res.json();

  if (!res.ok) {
    const msg = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
    throw new ApiError(msg || '请求失败', res.status);
  }

  return data as T;
}

// Convenience methods
export const api = {
  get: <T>(path: string, params?: Record<string, string | undefined>) =>
    request<T>('GET', path, undefined, params),
  post: <T>(path: string, body?: unknown) =>
    request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) =>
    request<T>('PATCH', path, body),
  delete: <T>(path: string) =>
    request<T>('DELETE', path),
};
