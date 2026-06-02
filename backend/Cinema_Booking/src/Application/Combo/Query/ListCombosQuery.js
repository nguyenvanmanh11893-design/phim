import AppError from "../../../Domain/Errors/AppError.js";

class ListCombosQuery {
  constructor({ page, limit, isActive } = {}) {
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    if (
      page !== undefined &&
      (!Number.isInteger(parsedPage) || parsedPage < 1)
    ) {
      throw new AppError("page phải là số nguyên dương", 400);
    }

    if (
      limit !== undefined &&
      (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100)
    ) {
      throw new AppError("limit phải là số nguyên dương và không quá 100", 400);
    }

    this.page = parsedPage || 1;
    this.limit = parsedLimit || 20;

    if (isActive !== undefined) {
      this.isActive = isActive === "true" || isActive === true;
    } else {
      this.isActive = undefined; // Bỏ qua filter này nếu không truyền
    }
  }
}

export default ListCombosQuery;
