const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const puppeteer = require('puppeteer');

const { getReportData } = require('./reportDataService.js');

const TEMPLATES_DIR = path.join(__dirname, 'templates');

let _browser = null;

// Helper para formatear fechas como DD/MM/YYYY
Handlebars.registerHelper('formatDate', (value) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
});

// Helper para formatear la respuesta de un datapoint segun su tipo
Handlebars.registerHelper('formatDataPointValue', (response, dataType) => {
    if (!response) return '-';
    if (dataType === 'boolean') {
        if (response.value_text == null) return '-';
        return (response.value_text === true || response.value_text === 'true') ? 'Yes' : 'No';
    }
    if (response.value_numeric != null) {
        const num = Number(response.value_numeric);
        const formatted = Number.isNaN(num)
            ? String(response.value_numeric)
            : num.toLocaleString('en-US', { maximumFractionDigits: 2 });
        return formatted + (dataType === 'percent' ? ' %' : '');
    }
    return response.value_text != null ? String(response.value_text) : '-';
});

async function getBrowser() {
    if (!_browser) {
        _browser = puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });
    }
    return _browser;
}

async function generateCsrdReportPdf(auditId) {
    const data = await getReportData(auditId);
    const template = Handlebars.compile(fs.readFileSync(path.join(TEMPLATES_DIR, 'csrd.hbs'), 'utf8'));
    const styles = fs.readFileSync(path.join(TEMPLATES_DIR, 'styles.css'), 'utf8');
    const html = template({ ...data, _styles: styles });

    const browser = await getBrowser();
    const page = await browser.newPage();
    try {
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBytes = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', bottom: '20mm', left: '18mm', right: '18mm' },
        });
        return Buffer.from(pdfBytes);
    } finally {
        await page.close();
    }
}

module.exports = { generateCsrdReportPdf };
