const { getReportData } = require('../services/reportDataService.js');

async function get_csrd_report_data(req, res) {
  const { id } = req.params;
  try {
    const data = await getReportData(id);
    return res.status(200).json(data);
  } catch (error) {
    const status = error.statusCode || 500;
    console.error('Error fetching CSRD report data:', error);
    return res.status(status).json({
      error: status === 404 ? 'Audit not found' : 'Failed to fetch CSRD report data',
    });
  }
}

module.exports = { get_csrd_report_data };