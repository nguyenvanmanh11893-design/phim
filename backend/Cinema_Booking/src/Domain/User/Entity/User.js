// src/Domain/User/Entity/User.js
import Email from "../ValueObject/Email.js";

class User {
  constructor({
    id,
    name,
    email,
    passwordHash,
    role,
    avatarUrl,
    phone,
    dateOfBirth,
    updatedAt,
    createdAt,
  }) {
    this.id = id ?? null;
    this.name = name;
    this.email = email instanceof Email ? email : new Email(email);
    this.passwordHash = passwordHash;
    this.role = role ?? "user";
    this.avatarUrl = avatarUrl ?? null;
    this.phone = phone ?? null;
    this.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    this.updatedAt = updatedAt ? new Date(updatedAt) : null;
    this.createdAt = createdAt ?? new Date();
  }

  // --- Factory Methods ---

  static create({ name, email, passwordHash }) {
    return new User({
      id: null,
      name,
      email,
      passwordHash,
      role: "user",
      avatarUrl: null,
      phone: null,
      dateOfBirth: null,
      updatedAt: null,
      createdAt: new Date(),
    });
  }

  static fromPersistence({
    id,
    name,
    email,
    passwordHash,
    role,
    avatar_url,
    phone,
    date_of_birth,
    updated_at,
    createdAt,
  }) {
    return new User({
      id,
      name,
      email: new Email(email),
      passwordHash,
      role,
      avatarUrl: avatar_url ?? null,
      phone: phone ?? null,
      dateOfBirth: date_of_birth ?? null,
      updatedAt: updated_at ?? null,
      createdAt,
    });
  }

  // --- Business Methods ---

  isAdmin() {
    return this.role === "admin";
  }

  promoteToAdmin() {
    this.role = "admin";
  }

  demoteToUser() {
    this.role = "user";
  }

  changeName(newName) {
    if (!newName || newName.trim().length < 2) {
      throw new Error("Tên phải có ít nhất 2 ký tự");
    }
    this.name = newName.trim();
    this.updatedAt = new Date();
  }

  changePassword(newPasswordHash) {
    if (!newPasswordHash) throw new Error("Password hash không hợp lệ");
    this.passwordHash = newPasswordHash;
    this.updatedAt = new Date();
  }

  updateProfile({ name, phone, dateOfBirth, avatarUrl }) {
    if (name !== undefined) {
      if (!name || name.trim().length < 2)
        throw new Error("Tên phải có ít nhất 2 ký tự");
      this.name = name.trim();
    }
    if (phone !== undefined) this.phone = phone;
    if (dateOfBirth !== undefined)
      this.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (avatarUrl !== undefined) this.avatarUrl = avatarUrl;
    this.updatedAt = new Date();
  }

  // --- Serialization ---

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email.value,
      role: this.role,
      avatarUrl: this.avatarUrl,
      phone: this.phone,
      dateOfBirth: this.dateOfBirth,
      updatedAt: this.updatedAt,
      createdAt: this.createdAt,
    };
  }

  toPersistence() {
    return {
      name: this.name,
      email: this.email.value,
      passwordHash: this.passwordHash,
      role: this.role,
      avatar_url: this.avatarUrl,
      phone: this.phone,
      date_of_birth: this.dateOfBirth,
      updated_at: this.updatedAt,
      createdAt: this.createdAt,
    };
  }
}

export default User;
