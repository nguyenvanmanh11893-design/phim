// src/Domain/Combo/Entity/Combo.js

class Combo {
  /**
   * @param {object}      params
   * @param {number|null} params.id
   * @param {string}      params.name         — Tên combo (VD: Combo 1 Bắp 2 Nước)
   * @param {string|null} params.description  — Mô tả chi tiết
   * @param {number}      params.price        — Giá combo (VND)
   * @param {string|null} params.imageUrl     — Ảnh minh họa
   * @param {boolean}     params.isActive     — Trạng thái đang bán hay ngừng bán
   * @param {Date}        params.createdAt    — Ngày tạo
   */
  constructor({ id, name, description, price, imageUrl, isActive, createdAt }) {
    this.id = id ?? null;
    this.name = name;
    this.description = description ?? null;
    this.price = price;
    this.imageUrl = imageUrl ?? null;
    this.isActive = isActive ?? true;
    this.createdAt =
      createdAt instanceof Date ? createdAt : new Date(createdAt ?? Date.now());

    this.#validate();
  }

  // ── Validation nội bộ ────────────────────────────────────────────────
  #validate() {
    if (
      !this.name ||
      typeof this.name !== "string" ||
      this.name.trim().length === 0
    ) {
      throw new Error("Tên combo là bắt buộc và không được để trống");
    }
    if (!Number.isFinite(Number(this.price)) || Number(this.price) < 0) {
      throw new Error("Giá combo phải là một số không âm");
    }
  }

  // ── Business methods ─────────────────────────────────────────────────

  deactivate() {
    this.isActive = false;
  }

  activate() {
    this.isActive = true;
  }

  updateDetails({ name, description, price, imageUrl }) {
    if (name !== undefined) this.name = name;
    if (description !== undefined) this.description = description;
    if (price !== undefined) this.price = price;
    if (imageUrl !== undefined) this.imageUrl = imageUrl;

    this.#validate();
  }

  // ── Factory methods ──────────────────────────────────────────────────

  static create({ name, description, price, imageUrl }) {
    return new Combo({
      id: null,
      name: name.trim(),
      description: description ? description.trim() : null,
      price: Number(price),
      imageUrl: imageUrl ? imageUrl.trim() : null,
      isActive: true,
      createdAt: new Date(),
    });
  }

  static fromPersistence({
    id,
    name,
    description,
    price,
    image_url,
    is_active,
    created_at,
  }) {
    return new Combo({
      id: Number(id),
      name,
      description,
      price: Number(price),
      imageUrl: image_url,
      isActive: Boolean(is_active),
      createdAt: new Date(created_at),
    });
  }

  // ── Serialization ────────────────────────────────────────────────────

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      imageUrl: this.imageUrl,
      isActive: this.isActive,
      createdAt: this.createdAt,
    };
  }

  toPersistence() {
    return {
      name: this.name,
      description: this.description,
      price: this.price,
      image_url: this.imageUrl,
      is_active: this.isActive ? 1 : 0,
      created_at: this.createdAt,
    };
  }
}

export default Combo;
