const { generateCsrdReportPdf } = require('../services/report/reportService.js');

function buildFilename(auditId) {
    const file = String(auditId).replace(/[^a-zA-Z0-9_-]/g, '');
    return `csrd-report-${file}.pdf`;
}

async function get_csrd_report(req, res) {
    const { id } = req.params;
    try {
        const pdfBuffer = await generateCsrdReportPdf(id);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${buildFilename(id)}"`
        );
        return res.status(200).send(pdfBuffer);
    } catch (error) {
        const status = error.statusCode || 500;
        console.error('Error generating CSRD report:', error);
        return res.status(status).json({
            error: status === 404 ? 'Audit not found' : 'Failed to generate CSRD report',
        });
    }
}

module.exports = { get_csrd_report };
