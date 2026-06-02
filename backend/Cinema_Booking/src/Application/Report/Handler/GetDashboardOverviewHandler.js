class GetDashboardOverviewHandler {
  /**
   * @param {import('../../../Domain/Report/Repository/ReportRepositoryInterface.js').default} reportRepository
   */
  constructor(reportRepository) {
    this.reportRepository = reportRepository;
  }

  async execute(query) {
    // query.userId chứa ID của admin đang gọi API,
    // bạn có thể dùng để log audit nếu cần thiết trong tương lai.

    // ── Gọi xuống repository để lấy data tổng hợp ──────────────────────
    const dashboardData = await this.reportRepository.getDashboardOverview();

    // Trả về dữ liệu thẳng cho Controller
    return dashboardData;
  }
}

export default GetDashboardOverviewHandler;
