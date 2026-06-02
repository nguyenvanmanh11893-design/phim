// Domain/Auth/Entity/RefreshToken.js
class RefreshToken {
  constructor({ id, userId, token, expiresAt, createdAt }) {
    this.id = id ?? null;
    this.userId = userId;
    this.token = token;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt ?? new Date();
  }

  static create({ userId, token, daysValid = 30 }) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysValid);

    return new RefreshToken({
      id: null,
      userId,
      token,
      expiresAt,
      createdAt: new Date(),
    });
  }

  static fromPersistence({ id, userId, token, expiresAt, createdAt }) {
    return new RefreshToken({
      id: Number(id),
      userId: Number(userId),
      token,
      expiresAt: new Date(expiresAt),
      createdAt: new Date(createdAt),
    });
  }

  // Kiểm tra token còn hạn không
  isExpired() {
    return new Date() > this.expiresAt;
  }

  toPersistence() {
    return {
      user_id: this.userId,
      token: this.token,
      expires_at: this.expiresAt,
      created_at: this.createdAt,
    };
  }
}

export default RefreshToken;
