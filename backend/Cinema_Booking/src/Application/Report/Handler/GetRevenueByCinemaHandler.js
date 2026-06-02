class GetRevenueByCinemaHandler {
  /**
   * @param {import('../../../Domain/Report/Repository/ReportRepositoryInterface.js').default} reportRepository
   */
  constructor(reportRepository) {
    this.reportRepository = reportRepository;
  }

  async execute(query) {
    const { startDate, endDate } = query;

    const data = await this.reportRepository.getRevenueByCinema({
      startDate,
      endDate,
    });

    return data;
  }
}

export default GetRevenueByCinemaHandler;
