// src/Application/User/Query/ListUsersQuery.js
import AppError from "../../../Domain/Errors/AppError.js";

const ALLOWED_ROLES = ["user", "admin"];

class ListUsersQuery {
  constructor({ page, limit, role } = {}) {
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    if (
      page !== undefined &&
      (!Number.isInteger(parsedPage) || parsedPage < 1)
    ) {
      throw new AppError("page must be a positive integer", 400);
    }

    if (
      limit !== undefined &&
      (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100)
    ) {
      throw new AppError(
        "limit must be a positive integer and no greater than 100",
        400,
      );
    }

    if (role !== undefined && !ALLOWED_ROLES.includes(role)) {
      throw new AppError(
        `role must be one of: ${ALLOWED_ROLES.join(", ")}`,
        400,
      );
    }

    this.page = parsedPage || 1;
    this.limit = parsedLimit || 20;
    this.role = role ?? null;
  }
}

export default ListUsersQuery;
