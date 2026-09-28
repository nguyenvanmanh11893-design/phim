import apiClient from './apiClient';
import { ApiError } from './apiClient';

export const uploadService = {
  /**
   * Upload ảnh đại diện cá nhân
   * Endpoint: POST /upload/avatar
   * Yêu cầu đăng nhập (user hoặc admin)
   * Field multipart/form-data: "image"
   * @param {File} file
   * @returns {Promise<{ url: string, publicId: string }>}
   */
  async uploadAvatar(file) {
    if (!file) {
      throw new ApiError('Vui lòng chọn một file ảnh', 400);
    }

    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post('/upload/avatar', formData);
    const data = response?.data || response;
    return {
      ...data,
      data,
      url: data?.url,
      publicId: data?.publicId,
    };
  },

  /**
   * Upload ảnh quản trị (poster, rạp...)
   * Endpoint: POST /upload/image
   * Yêu cầu quyền admin
   * Field multipart/form-data: "image"
   * @param {File} file
   * @returns {Promise<{ url: string, publicId: string, data: object }>}
   */
  async uploadImage(file) {
    if (!file) {
      throw new ApiError('Vui lòng chọn một file ảnh', 400);
    }

    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post('/upload/image', formData);
    const data = response?.data || response;
    return {
      ...data,
      data,
      url: data?.url,
      publicId: data?.publicId,
    };
  },
};

export default uploadService;
