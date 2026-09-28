/**
 * Centralized Token Storage Module
 * Manages access token and refresh token in localStorage
 */

const ACCESS_TOKEN_KEY = 'cine_access_token';
const REFRESH_TOKEN_KEY = 'cine_refresh_token';

export const tokenStorage = {
  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || null;
  },

  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY) || null;
  },

  setAccessToken(token) {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  },

  setRefreshToken(refreshToken) {
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  },

  setTokens({ token, refreshToken }) {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    }
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  hasTokens() {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY) || !!localStorage.getItem(REFRESH_TOKEN_KEY);
  },
};

export default tokenStorage;
