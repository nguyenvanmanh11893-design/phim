/**
 * User Service
 * Handles user profile and password operations against backend /users endpoints
 */
import apiClient from './apiClient';

export const userService = {
  /**
   * Lấy profile người dùng hiện tại
   * Backend: GET /users/me
   * @returns {Promise<Object>} User data
   */
  async getProfile() {
    const response = await apiClient.get('/users/me');
    return response.data;
  },

  /**
   * Cập nhật thông tin profile
   * Backend: PATCH /users/me
   * @param {Object} data
   * @param {string} [data.name]
   * @param {string|null} [data.phone]
   * @param {string|null} [data.dateOfBirth] - Format YYYY-MM-DD
   * @param {string|null} [data.avatarUrl]
   * @returns {Promise<Object>} Updated user data
   */
  async updateProfile(data) {
    const response = await apiClient.patch('/users/me', data);
    return response.data;
  },

  /**
   * Đổi mật khẩu
   * Backend: PATCH /users/me/password
   * Backend Command fields: { oldPassword, newPassword }
   * @param {Object} data
   * @param {string} data.oldPassword
   * @param {string} data.newPassword
   * @returns {Promise<Object>}
   */
  async changePassword({ oldPassword, newPassword }) {
    const response = await apiClient.patch('/users/me/password', {
      oldPassword,
      newPassword,
    });
    return response.data;
  },

  /**
   * Lấy danh sách người dùng (Admin)
   * Endpoint: GET /users
   * @param {Object} [params]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   * @param {string} [params.role] - 'user' | 'admin'
   * @param {AbortSignal} [params.signal]
   */
  async getUsers({ page = 1, limit = 20, role, signal } = {}) {
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page.toString());
    if (limit) queryParams.append('limit', limit.toString());
    if (role) queryParams.append('role', role);

    const endpoint = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get(endpoint, { signal });

    return {
      users: response.data || [],
      total: response.meta?.total ?? 0,
      page: response.meta?.page ?? page,
      totalPages: response.meta?.totalPages ?? 1,
    };
  },

  /**
   * Cập nhật role của người dùng (Admin)
   * Endpoint: PATCH /users/:id/role
   * @param {number|string} id
   * @param {string} role - 'user' | 'admin'
   */
  async updateUserRole(id, role) {
    const response = await apiClient.patch(`/users/${id}/role`, { role });
    return response.data;
  },
};

export default userService;
