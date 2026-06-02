class Movie {
  constructor({
    id,
    title,
    duration,
    genres,
    directors,
    releaseDate,
    endDate,
    posterUrl,
    description,
    ageRating,
    language,
    createdAt,
  }) {
    this.id = id ?? null;
    this.title = title;
    this.duration = duration;
    this.genres = genres;
    this.directors = directors;
    this.releaseDate = releaseDate ? new Date(releaseDate) : null;
    this.endDate = endDate ? new Date(endDate) : null;
    this.posterUrl = posterUrl ?? null;
    this.description = description ?? null;
    this.ageRating = ageRating ?? null; // "P", "K", "T13", "T16", "T18"
    this.language = language ?? null; // "Vietsub", "Lồng tiếng", "Nguyên bản"
    this.createdAt = createdAt ?? new Date();

    if (!this.title) {
      throw new Error("Title is required");
    }

    if (!Number.isInteger(this.duration) || this.duration <= 0) {
      throw new Error("Duration must be positive integer");
    }

    if (this.releaseDate && this.endDate && this.releaseDate > this.endDate) {
      throw new Error("releaseDate must be before endDate");
    }
  }

  // Status tự tính — không lưu DB, không truyền vào constructor
  get status() {
    const now = new Date();
    if (!this.releaseDate) return "coming_soon";
    if (!this.endDate) return "now_showing"; // explicit

    if (now < this.releaseDate) return "coming_soon";
    if (now <= this.endDate) return "now_showing";
    return "ended";
  }

  static create({
    title,
    duration,
    genres,
    directors,
    releaseDate,
    endDate,
    posterUrl,
    description,
    ageRating,
    language,
  }) {
    return new Movie({
      id: null,
      title,
      duration,
      genres,
      directors,
      releaseDate,
      endDate,
      posterUrl,
      description,
      ageRating,
      language,
      createdAt: new Date(),
    });
  }

  static fromPersistence({
    id,
    title,
    duration,
    genres,
    directors,
    release_date,
    end_date,
    poster_url,
    description,
    age_rating,
    language,
    created_at,
  }) {
    return new Movie({
      id,
      title,
      duration,
      genres,
      directors: directors,
      releaseDate: release_date,
      endDate: end_date,
      posterUrl: poster_url,
      description,
      ageRating: age_rating,
      language,
      createdAt: created_at,
    });
  }

  isNowShowing() {
    return this.status === "now_showing";
  }
  isAcceptingShowtimes() {
    return this.status !== "ended";
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      duration: this.duration,
      genres: this.genres,
      directors: this.directors,
      releaseDate: this.releaseDate,
      endDate: this.endDate,
      status: this.status,
      posterUrl: this.posterUrl,
      description: this.description,
      ageRating: this.ageRating,
      language: this.language,
      createdAt: this.createdAt,
    };
  }

  toPersistence() {
    return {
      title: this.title,
      duration: this.duration,
      genres: this.genres,
      directors: this.directors,
      release_date: this.releaseDate,
      end_date: this.endDate,
      poster_url: this.posterUrl,
      description: this.description,
      age_rating: this.ageRating,
      language: this.language,
      created_at: this.createdAt,
    };
  }
}

export default Movie;
