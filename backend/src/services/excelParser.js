const XLSX = require("xlsx");

const HOJAS_SIN_INFO = ["Index"];

// Metadatos que no tiene el excel pero que hay que meter en bbdd
const STANDARD_METADATA = {
  "ESRS 2": {
    code: "ESRS 2",
    name: "General disclosures",
    category: "Cross-cutting",
    is_mandatory: true,
    sort_order: 1,
  },
  "ESRS 2 MDR": {
    code: "ESRS 2",
    name: "General disclosures",
    category: "Cross-cutting",
    is_mandatory: true,
    sort_order: 1,
  },
  "ESRS E1": {
    code: "E1",
    name: "Climate change",
    category: "Environmental",
    is_mandatory: false,
    sort_order: 2,
  },
  "ESRS E2": {
    code: "E2",
    name: "Pollution",
    category: "Environmental",
    is_mandatory: false,
    sort_order: 3,
  },
  "ESRS E3": {
    code: "E3",
    name: "Water and marine resources",
    category: "Environmental",
    is_mandatory: false,
    sort_order: 4,
  },
  "ESRS E4": {
    code: "E4",
    name: "Biodiversity and ecosystems",
    category: "Environmental",
    is_mandatory: false,
    sort_order: 5,
  },
  "ESRS E5": {
    code: "E5",
    name: "Resource use and circular economy",
    category: "Environmental",
    is_mandatory: false,
    sort_order: 6,
  },
  "ESRS S1": {
    code: "S1",
    name: "Own workforce",
    category: "Social",
    is_mandatory: false,
    sort_order: 7,
  },
  "ESRS S2": {
    code: "S2",
    name: "Workers in the value chain",
    category: "Social",
    is_mandatory: false,
    sort_order: 8,
  },
  "ESRS S3": {
    code: "S3",
    name: "Affected communities",
    category: "Social",
    is_mandatory: false,
    sort_order: 9,
  },
  "ESRS S4": {
    code: "S4",
    name: "Consumers and end-users",
    category: "Social",
    is_mandatory: false,
    sort_order: 10,
  },
  "ESRS G1": {
    code: "G1",
    name: "Business conduct",
    category: "Governance",
    is_mandatory: false,
    sort_order: 11,
  },
};

// Descripciones de cada estandar ESRS
const STANDARD_DESCRIPTIONS = {
  "ESRS 1":
    "Sets out the general principles for sustainability reporting: double materiality, value chain, time horizons, and connections with financial statements. Does not contain disclosure requirements of its own.",
  "ESRS 2":
    "General disclosures mandatory for all companies: governance, strategy, management of impacts, risks and opportunities (IROs), and metrics and targets cross-cutting all material topics.",
  E1: "Information on the company's efforts to mitigate climate change (1.5 °C alignment, transition plan, scope 1, 2 and 3 GHG emissions) and to adapt to its physical effects. Includes energy use, removals and carbon credits.",
  E2: "Material impacts, risks and opportunities related to air, water and soil pollution, and to substances of concern or very high concern. Covers actions to prevent, mitigate and remediate pollution.",
  E3: "How the company affects water and marine resources: consumption, withdrawal, discharges, and dependence on water-stressed areas. Includes plans and metrics to protect these resources.",
  E4: "Impacts on biodiversity and ecosystems (species loss, habitat degradation, land and sea-use change, invasive species) and plans for protection, restoration and offsetting.",
  E5: "Resource inflows and outflows (raw materials, products and waste) and practices to extend product life, reduce resource consumption and promote the circular economy.",
  S1: "Information on working conditions, equal treatment and opportunities, and human rights of the company's direct employees (including non-employees under its control).",
  S2: "Information on workers of suppliers, contractors and other value chain actors affected by the company's operations, products or services.",
  S3: "Impacts on local or indigenous communities affected by the company's activity, including economic, social, cultural and civil rights.",
  S4: "Impacts on consumers and end-users related to the information they receive, their personal safety and their social inclusion.",
  G1: "Corporate culture, whistleblower protection, supplier relationships (including payment practices), prevention and detection of corruption and bribery, and political influence.",
};

// Nombres oficiales de cada Disclosure Requirement (Delegated Regulation EU 2023/2772, Annex I)
const DR_NAMES = {
  // ESRS 2 — General disclosures
  "BP-1": "General basis for preparation of sustainability statements",
  "BP-2": "Disclosures in relation to specific circumstances",
  "GOV-1": "The role of the administrative, management and supervisory bodies",
  "GOV-2":
    "Information provided to and sustainability matters addressed by the undertaking's administrative, management and supervisory bodies",
  "GOV-3":
    "Integration of sustainability-related performance in incentive schemes",
  "GOV-4": "Statement on due diligence",
  "GOV-5":
    "Risk management and internal controls over sustainability reporting",
  "SBM-1": "Strategy, business model and value chain",
  "SBM-2": "Interests and views of stakeholders",
  "SBM-3":
    "Material impacts, risks and opportunities and their interaction with strategy and business model",
  "IRO-1":
    "Description of the processes to identify and assess material impacts, risks and opportunities",
  "IRO-2":
    "Disclosure Requirements in ESRS covered by the undertaking's sustainability statement",
  // ESRS 2 — Minimum Disclosure Requirements (MDR)
  "MDR-P": "Policies adopted to manage material sustainability matters",
  "MDR-A":
    "Actions and resources in relation to material sustainability matters",
  "MDR-M": "Metrics in relation to material sustainability matters",
  "MDR-T": "Tracking effectiveness of policies and actions through targets",
  // E1 — Climate change
  "E1-1": "Transition plan for climate change mitigation",
  "E1-2": "Policies related to climate change mitigation and adaptation",
  "E1-3": "Actions and resources in relation to climate change policies",
  "E1-4": "Targets related to climate change mitigation and adaptation",
  "E1-5": "Energy consumption and mix",
  "E1-6": "Gross Scopes 1, 2, 3 and Total GHG emissions",
  "E1-7":
    "GHG removals and GHG mitigation projects financed through carbon credits",
  "E1-8": "Internal carbon pricing",
  "E1-9":
    "Anticipated financial effects from material physical and transition risks and potential climate-related opportunities",
  // E2 — Pollution
  "E2-1": "Policies related to pollution",
  "E2-2": "Actions and resources related to pollution",
  "E2-3": "Targets related to pollution",
  "E2-4": "Pollution of air, water and soil",
  "E2-5": "Substances of concern and substances of very high concern",
  "E2-6":
    "Anticipated financial effects from pollution-related impacts, risks and opportunities",
  // E3 — Water and marine resources
  "E3-1": "Policies related to water and marine resources",
  "E3-2": "Actions and resources related to water and marine resources",
  "E3-3": "Targets related to water and marine resources",
  "E3-4": "Water consumption",
  "E3-5":
    "Anticipated financial effects from water and marine resources-related impacts, risks and opportunities",
  // E4 — Biodiversity and ecosystems
  "E4-1":
    "Transition plan and consideration of biodiversity and ecosystems in strategy and business model",
  "E4-2": "Policies related to biodiversity and ecosystems",
  "E4-3": "Actions and resources related to biodiversity and ecosystems",
  "E4-4": "Targets related to biodiversity and ecosystems",
  "E4-5": "Impact metrics related to biodiversity and ecosystems change",
  "E4-6":
    "Anticipated financial effects from biodiversity and ecosystem-related impacts, risks and opportunities",
  // E5 — Resource use and circular economy
  "E5-1": "Policies related to resource use and circular economy",
  "E5-2": "Actions and resources related to resource use and circular economy",
  "E5-3": "Targets related to resource use and circular economy",
  "E5-4": "Resource inflows",
  "E5-5": "Resource outflows",
  "E5-6":
    "Anticipated financial effects from resource use and circular economy-related impacts, risks and opportunities",
  // S1 — Own workforce
  "S1-1": "Policies related to own workforce",
  "S1-2":
    "Processes for engaging with own workforce and workers' representatives about impacts",
  "S1-3":
    "Processes to remediate negative impacts and channels for own workforce to raise concerns",
  "S1-4":
    "Taking action on material impacts on own workforce, and approaches to managing material risks and pursuing material opportunities related to own workforce, and effectiveness of those actions",
  "S1-5":
    "Targets related to managing material negative impacts, advancing positive impacts, and managing material risks and opportunities",
  "S1-6": "Characteristics of the undertaking's employees",
  "S1-7":
    "Characteristics of non-employee workers in the undertaking's own workforce",
  "S1-8": "Collective bargaining coverage and social dialogue",
  "S1-9": "Diversity metrics",
  "S1-10": "Adequate wages",
  "S1-11": "Social protection",
  "S1-12": "Persons with disabilities",
  "S1-13": "Training and skills development metrics",
  "S1-14": "Health and safety metrics",
  "S1-15": "Work-life balance metrics",
  "S1-16": "Compensation metrics (pay gap and total compensation)",
  "S1-17": "Incidents, complaints and severe human rights impacts",
  // S2 — Workers in the value chain
  "S2-1": "Policies related to value chain workers",
  "S2-2": "Processes for engaging with value chain workers about impacts",
  "S2-3":
    "Processes to remediate negative impacts and channels for value chain workers to raise concerns",
  "S2-4":
    "Taking action on material impacts on value chain workers, and approaches to managing material risks and pursuing material opportunities related to value chain workers, and effectiveness of those actions",
  "S2-5":
    "Targets related to managing material negative impacts, advancing positive impacts, and managing material risks and opportunities",
  // S3 — Affected communities
  "S3-1": "Policies related to affected communities",
  "S3-2": "Processes for engaging with affected communities about impacts",
  "S3-3":
    "Processes to remediate negative impacts and channels for affected communities to raise concerns",
  "S3-4":
    "Taking action on material impacts on affected communities, and approaches to managing material risks and pursuing material opportunities related to affected communities, and effectiveness of those actions",
  "S3-5":
    "Targets related to managing material negative impacts, advancing positive impacts, and managing material risks and opportunities",
  // S4 — Consumers and end-users
  "S4-1": "Policies related to consumers and end-users",
  "S4-2": "Processes for engaging with consumers and end-users about impacts",
  "S4-3":
    "Processes to remediate negative impacts and channels for consumers and end-users to raise concerns",
  "S4-4":
    "Taking action on material impacts on consumers and end-users, and approaches to managing material risks and pursuing material opportunities related to consumers and end-users, and effectiveness of those actions",
  "S4-5":
    "Targets related to managing material negative impacts, advancing positive impacts, and managing material risks and opportunities",
  // G1 — Business conduct
  "G1-1": "Corporate culture and business conduct policies",
  "G1-2": "Management of relationships with suppliers",
  "G1-3": "Prevention and detection of corruption and bribery",
  "G1-4": "Incidents of corruption or bribery",
  "G1-5": "Political influence and lobbying activities",
  "G1-6": "Payment practices",
};

// Algunos Excels EFRAG prefijan los DRs de ESRS 2 (por ej: "ESRS 2 GOV-1")
function resolveDrName(drCode) {
  if (DR_NAMES[drCode]) return DR_NAMES[drCode];
  const stripped = drCode.replace(/^ESRS\s+\S+\s+/i, "");
  return DR_NAMES[stripped] || drCode;
}

class ExcelParser {
  // Seeder
  static parse(ruta) {
    const wb = XLSX.readFile(ruta);
    return ExcelParser._parseWorkbook(wb);
  }
  // Endpoint
  static parseFramework(buffer) {
    const wb = XLSX.read(buffer, { type: "buffer" });
    return ExcelParser._parseWorkbook(wb);
  }

  static _parseWorkbook(wb) {
    const standardsMap = new Map();

    for (const sheetName of wb.SheetNames) {
      if (HOJAS_SIN_INFO.includes(sheetName)) continue;

      const meta = STANDARD_METADATA[sheetName];
      if (!meta) continue;

      const ws = wb.Sheets[sheetName];
      ExcelParser._parseSheet(ws, meta, standardsMap);
    }
    return { standards: Array.from(standardsMap.values()) };
  }

  static _parseSheet(ws, meta, standardsMap) {
    const lines = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }); // defval: null porque sino peta cuando una celda este vacia

    if (lines.length < 2) return;

    const colMap = {
      id: 0,
      esrs: 1,
      dr: 2,
      paragraph: 3,
      related_ar: 4,
      name: 5,
      data_type: 6,
      is_conditional: 7,
      is_voluntary: 8,
      cross_reference: 9,
      phased_in_750: 10,
      phased_in_appendix_c: 11,
    };

    // El ESRS 2 esta dividido en dos hojas, ambas van al mismo standard
    if (!standardsMap.has(meta.code)) {
      standardsMap.set(meta.code, {
        code: meta.code,
        name: meta.name,
        description: STANDARD_DESCRIPTIONS[meta.code] || null,
        category: meta.category,
        is_mandatory: meta.is_mandatory,
        sort_order: meta.sort_order,
        disclosureRequirements: [],
      });
    }
    const standard = standardsMap.get(meta.code);

    const drMap = new Map();
    for (const dr of standard.disclosureRequirements) {
      drMap.set(dr.code, dr);
    }

    for (let i = 2; i < lines.length; i++) {
      const row = lines[i];

      const officialId = ExcelParser._str(row[colMap.id]);
      if (!officialId) continue;

      const drCode = ExcelParser._str(row[colMap.dr]);
      if (!drCode) continue;

      if (!drMap.has(drCode)) {
        drMap.set(drCode, {
          code: drCode,
          name: resolveDrName(drCode),
          sort_order: drMap.size + 1,
          dataPoints: [],
        });
        standard.disclosureRequirements.push(drMap.get(drCode));
      }
      const dr = drMap.get(drCode);

      const dataPoint = ExcelParser._buildDataPoint(row, colMap, officialId);
      dataPoint.link = ExcelParser._extractLink(ws, i, colMap.name);
      dr.dataPoints.push(dataPoint);
    }
  }

  static _buildDataPoint(row, colMap, officialId) {
    const paragraphRaw = row[colMap.paragraph];
    let paragraphRef = null;
    if (paragraphRaw !== null && paragraphRaw !== undefined) {
      paragraphRef = String(paragraphRaw).trim();
      if (paragraphRef === "") paragraphRef = null;
    }
    return {
      official_id: officialId,
      name: ExcelParser._str(row[colMap.name]) || officialId,
      paragraph_ref: paragraphRef,
      related_ar: ExcelParser._str(row[colMap.related_ar]),
      data_type: ExcelParser._str(row[colMap.data_type])
        ? ExcelParser._str(row[colMap.data_type]).toLowerCase()
        : null,
      is_voluntary: ExcelParser._bool(row[colMap.is_voluntary]),
      is_conditional: ExcelParser._conditionalBool(row[colMap.is_conditional]),
      cross_reference: ExcelParser._str(row[colMap.cross_reference]),
      phased_in_750: ExcelParser._bool(row[colMap.phased_in_750]),
      phased_in_appendix_c: ExcelParser._bool(row[colMap.phased_in_appendix_c]),
    };
  }

  /*
            AUXILIARES
    */

  static _str(value) {
    if (value === null || value === undefined) return null;
    const trimmed = String(value).trim().replace(/\s+/g, " "); // Limpar espacios dobles o saltos de linea
    return trimmed === "" ? null : trimmed;
  }

  // Si hay algo escrito se considera true, si esta vacio no lo es (devuelve false).
  static _bool(value) {
    if (value === null || value === undefined) return false;
    return String(value).trim() !== "";
  }

  // Si en la celda aparece "conditional" o "alternative" se considera condicional (true)
  static _conditionalBool(value) {
    if (value === null || value === undefined) return false;
    const lower = String(value).toLowerCase().trim();
    return lower.includes("conditional") || lower.includes("alternative");
  }

  // Extrae el hipervinculo del campo name (columna F)
  static _extractLink(ws, rowIdx, colIdx) {
    const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
    const cell = ws[cellRef];
    if (!cell || !cell.l || !cell.l.Target) return null;
    return cell.l.Target;
  }
}

module.exports = ExcelParser;
