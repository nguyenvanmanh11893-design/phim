import apiClient from './apiClient';

export const movieService = {
  /**
   * Lấy danh sách phim theo phân trang, thể loại, hoặc trạng thái
   * @param {Object} params
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   * @param {string} [params.genre]
   * @param {string} [params.status] - 'now_showing' | 'coming_soon' | 'ended'
   */
  async getMovies({ page = 1, limit = 20, genre, status, search } = {}) {
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page);
    if (limit) queryParams.append('limit', limit);
    if (genre) queryParams.append('genre', genre);
    if (status) queryParams.append('status', status);
    if (search) queryParams.append('search', search);

    const queryStr = queryParams.toString();
    const endpoint = `/movies${queryStr ? `?${queryStr}` : ''}`;
    const response = await apiClient.get(endpoint);

    const list = response.data || [];

    return {
      movies: list,
      data: list,
      total: response.total ?? response.meta?.total ?? list.length,
      page: response.page ?? response.meta?.page ?? page,
      limit: response.limit ?? response.meta?.limit ?? limit,
      totalPages: response.totalPages ?? response.meta?.totalPages ?? 1,
    };
  },

  /**
   * Lấy danh sách phim hot / nổi bật
   */
  async getHotMovies() {
    const response = await apiClient.get('/movies/hot');
    return response.data || [];
  },

  /**
   * Lấy chi tiết một bộ phim theo ID
   * @param {number|string} id
   */
  async getMovieById(id) {
    const response = await apiClient.get(`/movies/${id}`);
    return response.data;
  },

  /**
   * Thêm phim mới (Admin)
   * Endpoint: POST /movies
   * @param {Object} data
   */
  async createMovie(data) {
    const response = await apiClient.post('/movies', data);
    return response.data;
  },

  /**
   * Cập nhật phim (Admin)
   * Endpoint: PATCH /movies/:id
   * @param {number|string} id
   * @param {Object} data
   */
  async updateMovie(id, data) {
    const response = await apiClient.patch(`/movies/${id}`, data);
    return response.data;
  },

  /**
   * Xóa phim (Admin)
   * Endpoint: DELETE /movies/:id
   * @param {number|string} id
   */
  async deleteMovie(id) {
    const response = await apiClient.delete(`/movies/${id}`);
    return response;
  },

  /**
   * Lấy danh sách đánh giá của phim
   * Endpoint: GET /movies/:movieId/ratings
   * @param {number|string} movieId
   * @param {Object} [params]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=10]
   * @param {AbortSignal} [params.signal]
   */
  async getMovieRatings(movieId, { page = 1, limit = 10, signal } = {}) {
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page);
    if (limit) queryParams.append('limit', limit);

    const queryStr = queryParams.toString();
    const endpoint = `/movies/${movieId}/ratings${queryStr ? `?${queryStr}` : ''}`;
    const response = await apiClient.get(endpoint, { signal });

    return {
      ratings: response.data || [],
      total: response.meta?.total ?? 0,
      page: response.meta?.page ?? page,
      totalPages: response.meta?.totalPages ?? 1,
      averageScore: response.meta?.averageScore ?? 0,
      totalRatings: response.meta?.totalRatings ?? 0,
    };
  },

  /**
   * Gửi đánh giá cho phim (User đã xem phim)
   * Endpoint: POST /movies/:movieId/ratings
   * @param {number|string} movieId
   * @param {Object} data
   * @param {number} data.score - Số nguyên 1 đến 5
   * @param {string} [data.review] - Tối đa 1000 ký tự
   */
  async createMovieRating(movieId, { score, review }) {
    const response = await apiClient.post(`/movies/${movieId}/ratings`, {
      score: Number(score),
      review: review ? review.trim() : null,
    });
    return response.data;
  },
};

export default movieService;
