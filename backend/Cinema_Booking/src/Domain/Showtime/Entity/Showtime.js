// Domain/Showtime/Entity/Showtime.js

/**
 * Showtime — một suất chiếu cụ thể của 1 bộ phim tại 1 phòng chiếu.
 *
 * Quan hệ:
 *   - movieId  → Movie (phim đang chiếu)
 *   - roomId   → Room  (phòng chiếu, ngầm định biết rạp qua Room.cinemaId)
 *
 * Giá vé được lưu trực tiếp ở đây (không lấy từ Movie hay Room) vì:
 *   - Cùng 1 phim có thể chiếu giá khác nhau tuỳ phòng, tuỳ giờ, tuỳ ngày
 *   - Snapshot giá tại thời điểm tạo suất chiếu — tránh bị ảnh hưởng nếu admin
 *     đổi giá sau này (booking cũ vẫn tính đúng giá cũ)
 *
 * Status được tính động từ startTime/endTime — không lưu vào DB.
 * Admin có thể ghi đè bằng cách set cancelledAt.
 */
class Showtime {
  /**
   * @param {object} params
   * @param {number|null}  params.id
   * @param {number}       params.movieId
   * @param {number}       params.roomId
   * @param {Date}         params.startTime     — thời điểm bắt đầu chiếu
   * @param {Date}         params.endTime       — thời điểm kết thúc chiếu (startTime + duration)
   * @param {number}       params.basePrice     — giá vé ghế NORMAL (VND)
   * @param {number}       params.vipPrice      — giá vé ghế VIP
   * @param {number}       params.couplePrice   — giá vé ghế COUPLE
   * @param {Date|null}    params.cancelledAt   — null = chưa huỷ
   * @param {Date}         params.createdAt
   */
  constructor({
    id,
    movieId,
    roomId,
    startTime,
    endTime,
    basePrice,
    vipPrice,
    couplePrice,
    cancelledAt,
    createdAt,
  }) {
    this.id = id ?? null;
    this.movieId = movieId;
    this.roomId = roomId;
    this.startTime =
      startTime instanceof Date ? startTime : new Date(startTime);
    this.endTime = endTime instanceof Date ? endTime : new Date(endTime);
    this.basePrice = basePrice;
    this.vipPrice = vipPrice;
    this.couplePrice = couplePrice;
    this.cancelledAt = cancelledAt ? new Date(cancelledAt) : null;
    this.createdAt =
      createdAt instanceof Date ? createdAt : new Date(createdAt ?? Date.now());

    this.#validate();
  }

  // ── Validation nội bộ — chạy mỗi lần khởi tạo ──────────────────────
  #validate() {
    if (!this.movieId || !Number.isInteger(Number(this.movieId))) {
      throw new Error("movieId is required and must be an integer");
    }
    if (!this.roomId || !Number.isInteger(Number(this.roomId))) {
      throw new Error("roomId is required and must be an integer");
    }
    if (!(this.startTime instanceof Date) || isNaN(this.startTime.getTime())) {
      throw new Error("startTime is not a valid date");
    }
    if (!(this.endTime instanceof Date) || isNaN(this.endTime.getTime())) {
      throw new Error("endTime is not a valid date");
    }
    if (this.startTime >= this.endTime) {
      throw new Error("startTime must be before endTime");
    }
    if (!Number.isFinite(this.basePrice) || this.basePrice < 0) {
      throw new Error("basePrice must be a non-negative number");
    }
    if (!Number.isFinite(this.vipPrice) || this.vipPrice < 0) {
      throw new Error("vipPrice must be a non-negative number");
    }
    if (!Number.isFinite(this.couplePrice) || this.couplePrice < 0) {
      throw new Error("couplePrice must be a non-negative number");
    }
  }

  // ── Status động — tính theo giờ hệ thống + cancelledAt ─────────────
  // "CANCELLED" được ưu tiên check trước dù suất chưa bắt đầu
  get status() {
    if (this.cancelledAt) return "CANCELLED";

    const now = new Date();
    if (now < this.startTime) return "SCHEDULED";
    if (now <= this.endTime) return "ONGOING";
    return "ENDED";
  }

  // ── Business helpers ─────────────────────────────────────────────────

  /** Có thể đặt vé không — không cho đặt nếu đã huỷ hoặc đã bắt đầu */
  isBookable() {
    return this.status === "SCHEDULED";
  }

  /** Trả về giá vé theo loại ghế */
  priceForSeatType(seatType) {
    const map = {
      NORMAL: this.basePrice,
      VIP: this.vipPrice,
      COUPLE: this.couplePrice,
    };
    const price = map[seatType];
    if (price === undefined) {
      throw new Error(`Unknown seat type: ${seatType}`);
    }
    return price;
  }

  /** Huỷ suất chiếu — chỉ được huỷ khi chưa bắt đầu */
  cancel() {
    if (this.status !== "SCHEDULED") {
      throw new Error(
        `Không thể huỷ suất chiếu đang ở trạng thái "${this.status}"`,
      );
    }
    this.cancelledAt = new Date();
  }

  /** * Cập nhật thông tin suất chiếu
   * Chỉ được phép cập nhật khi suất chiếu chưa bắt đầu và chưa bị huỷ
   */
  updateDetails({
    roomId,
    startTime,
    endTime,
    basePrice,
    vipPrice,
    couplePrice,
  }) {
    if (this.status !== "SCHEDULED") {
      throw new Error(
        `Không thể cập nhật suất chiếu đang ở trạng thái "${this.status}"`,
      );
    }

    // Gán các giá trị mới nếu có truyền vào
    if (roomId !== undefined) this.roomId = roomId;
    if (basePrice !== undefined) this.basePrice = basePrice;
    if (vipPrice !== undefined) this.vipPrice = vipPrice;
    if (couplePrice !== undefined) this.couplePrice = couplePrice;

    if (startTime !== undefined) {
      this.startTime =
        startTime instanceof Date ? startTime : new Date(startTime);
    }
    if (endTime !== undefined) {
      this.endTime = endTime instanceof Date ? endTime : new Date(endTime);
    }

    // Chạy lại hàm validate nội bộ để đảm bảo dữ liệu mới vẫn tuân thủ
    // các rule cơ bản (vd: giá >= 0, startTime < endTime...)
    this.#validate();
  }

  // ── Factory methods ──────────────────────────────────────────────────

  /**
   * Tạo suất chiếu mới.
   * endTime = startTime + durationMinutes (tính từ bộ phim, truyền vào từ Handler)
   */
  static create({
    movieId,
    roomId,
    startTime,
    durationMinutes,
    basePrice,
    vipPrice,
    couplePrice,
  }) {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    return new Showtime({
      id: null,
      movieId,
      roomId,
      startTime: start,
      endTime: end,
      basePrice,
      vipPrice,
      couplePrice,
      cancelledAt: null,
      createdAt: new Date(),
    });
  }

  /** Khôi phục entity từ dữ liệu DB (snake_case) */
  static fromPersistence({
    id,
    movie_id,
    room_id,
    start_time,
    end_time,
    base_price,
    vip_price,
    couple_price,
    cancelled_at,
    created_at,
  }) {
    return new Showtime({
      id,
      movieId: Number(movie_id),
      roomId: Number(room_id),
      startTime: new Date(start_time),
      endTime: new Date(end_time),
      basePrice: Number(base_price),
      vipPrice: Number(vip_price),
      couplePrice: Number(couple_price),
      cancelledAt: cancelled_at ? new Date(cancelled_at) : null,
      createdAt: new Date(created_at),
    });
  }

  // ── Serialization ────────────────────────────────────────────────────

  toJSON() {
    return {
      id: this.id,
      movieId: this.movieId,
      roomId: this.roomId,
      startTime: this.startTime,
      endTime: this.endTime,
      basePrice: this.basePrice,
      vipPrice: this.vipPrice,
      couplePrice: this.couplePrice,
      status: this.status,
      cancelledAt: this.cancelledAt,
      createdAt: this.createdAt,
    };
  }

  toPersistence() {
    return {
      movie_id: this.movieId,
      room_id: this.roomId,
      start_time: this.startTime,
      end_time: this.endTime,
      base_price: this.basePrice,
      vip_price: this.vipPrice,
      couple_price: this.couplePrice,
      cancelled_at: this.cancelledAt,
      created_at: this.createdAt,
    };
  }
}

export default Showtime;
