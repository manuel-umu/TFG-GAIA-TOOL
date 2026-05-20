const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");
const puppeteer = require("puppeteer");

const { getReportData } = require("./reportDataService.js");

const TEMPLATES_DIR = path.join(__dirname, "templates");

let browser = null;

Handlebars.registerHelper("formatDate", (value) => {
  if (!value) return "-";
  const d = new Date(value);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
});

const NUMERIC_TYPES = new Set([
  "integer",
  "numeric",
  "percent",
  "monetary",
  "decimal",
  "value",
]);

Handlebars.registerHelper("formatDataPointValue", (response, dataType) => {
  if (!response) return "-";
  const v = response.value_text;
  if (v == null || v === "") return "-";

  if (dataType === "boolean") {
    return v === true || v === "true" ? "Yes" : "No";
  }

  if (NUMERIC_TYPES.has(dataType)) {
    const num = Number(v);
    // Number is NaN si por ejemplo incluye unidades
    if (Number.isNaN(num)) return String(v);
    const formatted = num.toLocaleString("en-US", { maximumFractionDigits: 2 });
    return formatted + (dataType === "percent" ? " %" : "");
  }
  return String(v);
});

async function getBrowser() {
  if (!browser) {
    browser = puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });
  }
  return browser;
}

async function generateCsrdReportPdf(auditId) {
  const data = await getReportData(auditId);
  const template = Handlebars.compile(
    fs.readFileSync(path.join(TEMPLATES_DIR, "csrd.hbs"), "utf8"),
  );
  const styles = fs.readFileSync(
    path.join(TEMPLATES_DIR, "styles.css"),
    "utf8",
  );
  const html = template({ ...data, _styles: styles });

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBytes = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "18mm", right: "18mm" },
    });
    return Buffer.from(pdfBytes);
  } finally {
    await page.close();
  }
}

module.exports = { generateCsrdReportPdf };
