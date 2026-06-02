import AppError from "../../../Domain/Errors/AppError.js";

class GetRevenueByTimeQuery {
  constructor({ startDate, endDate, groupBy }) {
    // Validate groupBy
    const allowedGroupBy = ["day", "month"];
    if (!groupBy || !allowedGroupBy.includes(groupBy)) {
      throw new AppError(
        `groupBy bắt buộc phải là một trong: ${allowedGroupBy.join(", ")}`,
        400,
      );
    }

    // Validate dates
    if (startDate && isNaN(new Date(startDate).getTime())) {
      throw new AppError(
        "startDate không phải là ngày hợp lệ (YYYY-MM-DD)",
        400,
      );
    }
    if (endDate && isNaN(new Date(endDate).getTime())) {
      throw new AppError("endDate không phải là ngày hợp lệ (YYYY-MM-DD)", 400);
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      throw new AppError("startDate phải nhỏ hơn hoặc bằng endDate", 400);
    }

    this.startDate = startDate || null;
    this.endDate = endDate || null;
    this.groupBy = groupBy;
  }
}

export default GetRevenueByTimeQuery;
