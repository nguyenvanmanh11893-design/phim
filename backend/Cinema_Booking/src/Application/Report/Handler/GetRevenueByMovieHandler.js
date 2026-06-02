class GetRevenueByMovieHandler {
  /**
   * @param {import('../../../Domain/Report/Repository/ReportRepositoryInterface.js').default} reportRepository
   */
  constructor(reportRepository) {
    this.reportRepository = reportRepository;
  }

  async execute(query) {
    const { startDate, endDate } = query;

    const data = await this.reportRepository.getRevenueByMovie({
      startDate,
      endDate,
    });

    return data;
  }
}

export default GetRevenueByMovieHandler;
