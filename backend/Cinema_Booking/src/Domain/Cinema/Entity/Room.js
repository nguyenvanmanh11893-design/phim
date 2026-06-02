const ROOM_TYPES = ["STANDARD", "VIP", "IMAX"];

class Room {
  constructor({ id, cinemaId, name, type, totalRows, seatsPerRow, createdAt }) {
    this.id = id ?? null;
    this.cinemaId = cinemaId;
    this.name = name;
    this.type = type ?? "STANDARD";
    this.totalRows = totalRows;
    this.seatsPerRow = seatsPerRow;
    this.createdAt = createdAt ?? new Date();

    if (!this.cinemaId) throw new Error("cinemaId is required");
    if (!this.name) throw new Error("Room name is required");
    if (!ROOM_TYPES.includes(this.type))
      throw new Error(`type must be one of: ${ROOM_TYPES.join(", ")}`);
    if (!Number.isInteger(this.totalRows) || this.totalRows <= 0)
      throw new Error("totalRows must be positive integer");
    if (!Number.isInteger(this.seatsPerRow) || this.seatsPerRow <= 0)
      throw new Error("seatsPerRow must be positive integer");
  }

  get totalSeats() {
    return this.totalRows * this.seatsPerRow;
  }

  static create({ cinemaId, name, type, totalRows, seatsPerRow }) {
    return new Room({
      id: null,
      cinemaId,
      name,
      type,
      totalRows,
      seatsPerRow,
      createdAt: new Date(),
    });
  }

  static fromPersistence({
    id,
    cinema_id,
    name,
    type,
    total_rows,
    seats_per_row,
    created_at,
  }) {
    return new Room({
      id,
      cinemaId: cinema_id,
      name,
      type,
      totalRows: total_rows,
      seatsPerRow: seats_per_row,
      createdAt: created_at,
    });
  }

  toJSON() {
    return {
      id: this.id,
      cinemaId: this.cinemaId,
      name: this.name,
      type: this.type,
      totalRows: this.totalRows,
      seatsPerRow: this.seatsPerRow,
      totalSeats: this.totalSeats,
      createdAt: this.createdAt,
    };
  }

  toPersistence() {
    return {
      cinema_id: this.cinemaId,
      name: this.name,
      type: this.type,
      total_rows: this.totalRows,
      seats_per_row: this.seatsPerRow,
      created_at: this.createdAt,
    };
  }
}

export default Room;
