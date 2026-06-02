class Cinema {
  constructor({ id, name, address, city, phone, imageUrl, createdAt }) {
    this.id = id ?? null;
    this.name = name;
    this.address = address;
    this.city = city;
    this.phone = phone ?? null;
    this.imageUrl = imageUrl ?? null;
    this.createdAt = createdAt ?? new Date();

    if (!this.name) throw new Error("Cinema name is required");
    if (!this.address) throw new Error("Cinema address is required");
    if (!this.city) throw new Error("Cinema city is required");
  }

  static create({ name, address, city, phone, imageUrl }) {
    return new Cinema({
      id: null,
      name,
      address,
      city,
      phone,
      imageUrl,
      createdAt: new Date(),
    });
  }

  static fromPersistence({
    id,
    name,
    address,
    city,
    phone,
    image_url,
    created_at,
  }) {
    return new Cinema({
      id,
      name,
      address,
      city,
      phone,
      imageUrl: image_url,
      createdAt: created_at,
    });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      address: this.address,
      city: this.city,
      phone: this.phone,
      imageUrl: this.imageUrl,
      createdAt: this.createdAt,
    };
  }

  toPersistence() {
    return {
      name: this.name,
      address: this.address,
      city: this.city,
      phone: this.phone,
      image_url: this.imageUrl,
      created_at: this.createdAt,
    };
  }
}

export default Cinema;
