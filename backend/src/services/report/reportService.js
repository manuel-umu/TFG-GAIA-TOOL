const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const puppeteer = require('puppeteer');

const { getReportData } = require('./reportDataService.js');

const TEMPLATES_DIR = path.join(__dirname, 'templates');

let _browser = null;


async function getBrowser() {
    if (_browser) return _browser;
    _browser = puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
        ],
    });
    return _browser;
}

function loadTemplate() {
    const csrdTplPath = path.join(TEMPLATES_DIR, 'csrd.hbs');
    const src = fs.readFileSync(csrdTplPath, 'utf8');
    return Handlebars.compile(src);
}

function loadStyles() {
    const cssPath = path.join(TEMPLATES_DIR, 'styles.css');
    if (!fs.existsSync(cssPath)) return '';
    return fs.readFileSync(cssPath, 'utf8');
}

async function renderHTML(auditId) {
    const data = await getReportData(auditId);
    const template = loadTemplate();
    const styles = loadStyles();
    return template({ ...data, _styles: styles });
}

async function generateCsrdReportPdf(auditId) {
    const html = await renderHTML(auditId);

}

async function shutdown() {
    if (_browser) {
        const browser = await _browser;
        await browser.close();
        _browser = null;
    }
}

module.exports = { generateCsrdReportPdf, renderHTML, shutdown };
