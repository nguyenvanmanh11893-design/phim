const SEAT_TYPES = ["NORMAL", "VIP", "COUPLE"];

class Seat {
  constructor({ id, roomId, row, number, type, isActive, createdAt }) {
    this.id = id ?? null;
    this.roomId = roomId;
    this.row = row; // "A", "B", "C"...
    this.number = number; // 1, 2, 3...
    this.type = type ?? "NORMAL";
    this.isActive = isActive ?? true;
    this.createdAt = createdAt ?? new Date();

    if (!this.roomId) throw new Error("roomId is required");
    if (!this.row || typeof this.row !== "string")
      throw new Error("row is required");
    if (!Number.isInteger(this.number) || this.number <= 0)
      throw new Error("number must be positive integer");
    if (!SEAT_TYPES.includes(this.type))
      throw new Error(`type must be one of: ${SEAT_TYPES.join(", ")}`);
  }

  // Label hiển thị: "A1", "B12"
  get label() {
    return `${this.row}${this.number}`;
  }

  deactivate() {
    this.isActive = false;
  }
  activate() {
    this.isActive = true;
  }

  static create({ roomId, row, number, type }) {
    return new Seat({
      id: null,
      roomId,
      row: row.toUpperCase(),
      number,
      type,
      isActive: true,
      createdAt: new Date(),
    });
  }

  static fromPersistence({
    id,
    room_id,
    row,
    number,
    type,
    is_active,
    created_at,
  }) {
    return new Seat({
      id,
      roomId: room_id,
      row,
      number,
      type,
      isActive: Boolean(is_active),
      createdAt: created_at,
    });
  }

  toJSON() {
    return {
      id: this.id,
      roomId: this.roomId,
      row: this.row,
      number: this.number,
      label: this.label,
      type: this.type,
      isActive: this.isActive,
      createdAt: this.createdAt,
    };
  }

  toPersistence() {
    return {
      room_id: this.roomId,
      row: this.row,
      number: this.number,
      type: this.type,
      is_active: this.isActive ? 1 : 0,
      created_at: this.createdAt,
    };
  }
}

export default Seat;
