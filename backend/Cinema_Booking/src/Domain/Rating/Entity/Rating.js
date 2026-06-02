// src/Domain/Rating/Entity/Rating.js

class Rating {
  constructor({ id, userId, movieId, score, review, createdAt }) {
    this.id = id ?? null;
    this.userId = userId;
    this.movieId = movieId;
    this.score = score;
    this.review = review ?? null;
    this.createdAt =
      createdAt instanceof Date ? createdAt : new Date(createdAt ?? Date.now());

    this.#validate();
  }

  #validate() {
    if (!this.userId || !Number.isInteger(Number(this.userId))) {
      throw new Error("userId is required and must be an integer");
    }
    if (!this.movieId || !Number.isInteger(Number(this.movieId))) {
      throw new Error("movieId is required and must be an integer");
    }
    if (!Number.isInteger(this.score) || this.score < 1 || this.score > 5) {
      throw new Error("score must be an integer between 1 and 5");
    }
    if (
      this.review !== null &&
      (typeof this.review !== "string" || this.review.trim().length === 0)
    ) {
      throw new Error("review must be a non-empty string or null");
    }
  }

  static create({ userId, movieId, score, review }) {
    return new Rating({
      id: null,
      userId,
      movieId,
      score,
      review: review ? review.trim() : null,
      createdAt: new Date(),
    });
  }

  static fromPersistence({ id, user_id, movie_id, score, review, created_at }) {
    return new Rating({
      id: Number(id),
      userId: Number(user_id),
      movieId: Number(movie_id),
      score: Number(score),
      review: review ?? null,
      createdAt: new Date(created_at),
    });
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      movieId: this.movieId,
      score: this.score,
      review: this.review,
      createdAt: this.createdAt,
    };
  }

  toPersistence() {
    return {
      user_id: this.userId,
      movie_id: this.movieId,
      score: this.score,
      review: this.review,
      created_at: this.createdAt,
    };
  }
}

export default Rating;
