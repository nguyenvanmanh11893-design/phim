/**
 * Core API Client for CineBooking
 * Directly communicates with the Express backend using import.meta.env.VITE_API_BASE_URL
 * Includes automatic token injection, error handling, and single-flight token refresh mutex.
 */
import tokenStorage from './tokenStorage';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export class ApiError extends Error {
  constructor(message, status = 500, data = null, isNetworkError = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.isNetworkError = isNetworkError;
  }
}

// Single-flight refresh token mutex
let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(newToken, error = null) {
  refreshSubscribers.forEach((cb) => cb(newToken, error));
  refreshSubscribers = [];
}

/**
 * Perform token refresh request directly using native fetch to avoid circular imports.
 */
async function performRefreshToken() {
  const currentRefreshToken = tokenStorage.getRefreshToken();
  if (!currentRefreshToken) {
    tokenStorage.clearTokens();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cine_auth_expired'));
    }
    throw new ApiError('Không có refresh token hợp lệ', 401);
  }

  try {
    const response = await fetch(`${BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: currentRefreshToken }),
    });

    let resData = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      resData = await response.json();
    }

    if (!response.ok) {
      // 401 / 403 / 400 => Token invalid or expired in DB
      if (response.status === 401 || response.status === 403 || response.status === 400) {
        tokenStorage.clearTokens();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cine_auth_expired'));
        }
        throw new ApiError(
          resData?.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          response.status,
          resData
        );
      }

      // Server error 5xx: DO NOT clear token!
      throw new ApiError(
        resData?.message || `Lỗi máy chủ khi làm mới phiên (${response.status})`,
        response.status,
        resData
      );
    }

    // Backend endpoint POST /auth/refresh-token returns: { success: true, data: { accessToken: "..." } }
    const newAccessToken = resData?.data?.accessToken;
    if (!newAccessToken) {
      tokenStorage.clearTokens();
      throw new ApiError('Định dạng token mới không hợp lệ từ máy chủ', 500);
    }

    tokenStorage.setAccessToken(newAccessToken);
    return newAccessToken;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network / offline error: DO NOT delete tokens!
    throw new ApiError(
      'Không thể kết nối đến máy chủ để làm mới phiên đăng nhập.',
      0,
      null,
      true
    );
  }
}

/**
 * Handle 401 retry with single-flight mutex
 */
async function handle401Refresh(endpoint, options) {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      subscribeTokenRefresh((newToken, error) => {
        if (error) {
          reject(error);
        } else {
          // Retry original request with new token
          const retryOptions = {
            ...options,
            _retry: true,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${newToken}`,
            },
          };
          resolve(request(endpoint, retryOptions));
        }
      });
    });
  }

  isRefreshing = true;

  try {
    const newToken = await performRefreshToken();
    onRefreshed(newToken, null);

    // Retry original request
    const retryOptions = {
      ...options,
      _retry: true,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${newToken}`,
      },
    };
    return await request(endpoint, retryOptions);
  } catch (refreshErr) {
    onRefreshed(null, refreshErr);
    throw refreshErr;
  } finally {
    isRefreshing = false;
  }
}

/**
 * Main request executor
 * @param {string} endpoint
 * @param {RequestInit & { _retry?: boolean }} options
 */
export async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const token = tokenStorage.getAccessToken();

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // Nếu là FormData, đảm bảo không có Content-Type để browser tự sinh multipart boundary
  if (isFormData && headers['Content-Type']) {
    delete headers['Content-Type'];
  }

  const config = {
    ...options,
    headers,
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (networkError) {
    if (networkError.name === 'AbortError') {
      throw networkError;
    }
    // Connection refused, DNS failed, offline, etc.
    throw new ApiError(
      'Không thể kết nối đến máy chủ backend. Vui lòng kiểm tra lại kết nối mạng.',
      0,
      null,
      true
    );
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  try {
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text ? { message: text } : null;
    }
  } catch {
    // Parsing error ignored, data remains null
  }

  // Handle 401 Unauthorized for token expiration
  if (response.status === 401) {
    const isAuthEndpoint =
      endpoint.includes('/auth/signIn') ||
      endpoint.includes('/auth/signUp') ||
      endpoint.includes('/auth/refresh-token');

    // If request has not retried yet and is not an auth endpoint, attempt token refresh
    if (!options._retry && !isAuthEndpoint && tokenStorage.getRefreshToken()) {
      try {
        return await handle401Refresh(endpoint, options);
      } catch (refreshErr) {
        tokenStorage.clearTokens();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cine_auth_expired'));
        }
        throw refreshErr;
      }
    }

    // If 401 on an authenticated endpoint and cannot refresh (no refresh token or retry failed)
    if (!isAuthEndpoint) {
      tokenStorage.clearTokens();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cine_auth_expired'));
      }
    }
  }

  if (!response.ok) {
    const errorMessage =
      (data && (data.message || data.error)) ||
      `Lỗi yêu cầu: ${response.status} ${response.statusText}`;
    throw new ApiError(errorMessage, response.status, data);
  }

  return data;
}

function prepareBody(body) {
  if (body === undefined) return undefined;
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    return body;
  }
  return JSON.stringify(body);
}

export const apiClient = {
  get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) =>
    request(endpoint, {
      method: 'POST',
      body: prepareBody(body),
      ...options,
    }),
  patch: (endpoint, body, options) =>
    request(endpoint, {
      method: 'PATCH',
      body: prepareBody(body),
      ...options,
    }),
  put: (endpoint, body, options) =>
    request(endpoint, {
      method: 'PUT',
      body: prepareBody(body),
      ...options,
    }),
  delete: (endpoint, options) =>
    request(endpoint, { method: 'DELETE', ...options }),
};

export default apiClient;
