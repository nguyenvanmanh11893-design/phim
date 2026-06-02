class GetRevenueByTimeHandler {
  /**
   * @param {import('../../../Domain/Report/Repository/ReportRepositoryInterface.js').default} reportRepository
   */
  constructor(reportRepository) {
    this.reportRepository = reportRepository;
  }

  async execute(query) {
    const { startDate, endDate, groupBy } = query;

    const data = await this.reportRepository.getRevenueByTime({
      startDate,
      endDate,
      groupBy,
    });

    return data;
  }
}

export default GetRevenueByTimeHandler;
