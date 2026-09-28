/**
 * Authentication Service
 * Communicates with /auth endpoints (signUp, signIn, signOut, refresh-token)
 * Uses centralized tokenStorage for persisting tokens.
 */
import apiClient from './apiClient';
import tokenStorage from './tokenStorage';

export const authService = {
  /**
   * Đăng nhập người dùng
   * Backend: POST /auth/signIn
   * Response: { success: true, data: { token, refreshToken, user } }
   * @param {Object} credentials
   * @param {string} credentials.email
   * @param {string} credentials.password
   */
  async login({ email, password }) {
    const response = await apiClient.post('/auth/signIn', { email, password });
    const { token, refreshToken, user } = response.data || {};

    if (token) {
      tokenStorage.setTokens({ token, refreshToken });
    }

    return { token, refreshToken, user };
  },

  /**
   * Đăng ký người dùng mới
   * Backend: POST /auth/signUp
   * Body: { name, email, password }
   * Response: { success: true, data: user }
   * @param {Object} data
   * @param {string} data.name
   * @param {string} data.email
   * @param {string} data.password
   */
  async register({ name, email, password }) {
    const response = await apiClient.post('/auth/signUp', { name, email, password });
    return response.data;
  },

  /**
   * Đăng xuất người dùng
   * Backend: POST /auth/signOut
   * Requires auth header (handled by apiClient) and body: { refreshToken }
   * Always clears local tokens regardless of server response.
   */
  async logout() {
    const refreshToken = tokenStorage.getRefreshToken();
    let serverRevoked = false;
    let errorOccurred = null;

    if (refreshToken) {
      try {
        await apiClient.post('/auth/signOut', { refreshToken });
        serverRevoked = true;
      } catch (err) {
        // Catch network / server errors to prevent unhandled rejections
        errorOccurred = err;
      }
    }

    // Always clear tokens locally
    tokenStorage.clearTokens();

    return {
      success: true,
      serverRevoked,
      error: errorOccurred,
    };
  },

  /**
   * Làm mới access token thủ công
   * Backend: POST /auth/refresh-token
   * Body: { refreshToken }
   * Response: { success: true, data: { accessToken } }
   */
  async refreshToken() {
    const currentRefreshToken = tokenStorage.getRefreshToken();
    if (!currentRefreshToken) {
      tokenStorage.clearTokens();
      throw new Error('Không có refresh token');
    }

    const response = await apiClient.post('/auth/refresh-token', {
      refreshToken: currentRefreshToken,
    });

    const newAccessToken = response.data?.accessToken;
    if (newAccessToken) {
      tokenStorage.setAccessToken(newAccessToken);
    }
    return newAccessToken;
  },
};

export default authService;
