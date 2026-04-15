const XLSX = require('xlsx');

// Metadatos que no tiene el excel pero que hay que meter en bbdd
const STANDARD_METADATA = {
    'ESRS 2': { code: 'ESRS 2', name: 'General disclosures', category: 'Cross-cutting', is_mandatory: true, sort_order: 1 },
    'ESRS 2 MDR': { code: 'ESRS 2', name: 'General disclosures', category: 'Cross-cutting', is_mandatory: true, sort_order: 1 },
    'ESRS E1': { code: 'E1', name: 'Climate change', category: 'Environmental', is_mandatory: false, sort_order: 2 },
    'ESRS E2': { code: 'E2', name: 'Pollution', category: 'Environmental', is_mandatory: false, sort_order: 3 },
    'ESRS E3': { code: 'E3', name: 'Water and marine resources', category: 'Environmental', is_mandatory: false, sort_order: 4 },
    'ESRS E4': { code: 'E4', name: 'Biodiversity and ecosystems', category: 'Environmental', is_mandatory: false, sort_order: 5 },
    'ESRS E5': { code: 'E5', name: 'Resource use and circular economy', category: 'Environmental', is_mandatory: false, sort_order: 6 },
    'ESRS S1': { code: 'S1', name: 'Own workforce', category: 'Social', is_mandatory: false, sort_order: 7 },
    'ESRS S2': { code: 'S2', name: 'Workers in the value chain', category: 'Social', is_mandatory: false, sort_order: 8 },
    'ESRS S3': { code: 'S3', name: 'Affected communities', category: 'Social', is_mandatory: false, sort_order: 9 },
    'ESRS S4': { code: 'S4', name: 'Consumers and end-users', category: 'Social', is_mandatory: false, sort_order: 10 },
    'ESRS G1': { code: 'G1', name: 'Business conduct', category: 'Governance', is_mandatory: false, sort_order: 11 },
};

const HOJAS_SIN_INFO = ['Index'];

class ExcelParser {

    // Devuelve la tripleta Framework, FrameworkVersion y un array de Standards con DisclosureRequirements y DataPoints anidados.
    static parse(ruta) {
        const wb = XLSX.readFile(ruta);

        const standardsMap = new Map();

        for (const sheetName of wb.SheetNames) {
            if (HOJAS_SIN_INFO.includes(sheetName)) continue;

            const meta = STANDARD_METADATA[sheetName];
            if (!meta) continue;

            const ws = wb.Sheets[sheetName];
            ExcelParser._parseSheet(ws, sheetName, meta, standardsMap);
        }

        return {
            // De momento framework y frameworkversion hardcodeados.
            // TODO: Cambiar cuando haga la vista de upload y meter diferentes versiones de la CSRD
            framework: {
                code: 'CSRD',
                name: 'Corporate Sustainability Reporting Directive',
                description: 'EU Directive 2022/2464 requiring large companies to report on sustainability matters',
                issuing_body: 'European Union',
            },
            frameworkVersion: {
                version_code: 'ESRS-SET1-2024',
                version_label: 'ESRS Set 1 - 2024',
                effective_date: '2024-01-01',
                source_file: 'EFRAG IG 3 List of ESRS Data Points',
            },
            standards: Array.from(standardsMap.values()),
        };
    }

    static _parseSheet(ws, sheetName, meta, standardsMap) {
        const lines = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });  //defval: null porque sino peta cuando una celda este vacia

        if (lines.length < 2) return;

        const headers = lines[1];
        const colMap = {    // TODO: Hacer funcion para crear el mapa dinamicamente por si a la UE le da por cambiar el orden de las columnas o meter alguna nueva
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
        // El ESRS 2 esta dividido
        if (!standardsMap.has(meta.code)) {
            standardsMap.set(meta.code, {
                code: meta.code,
                name: meta.name,
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

        for (let i = 2;i < lines.length;i++) {
            const row = lines[i];

            const officialId = ExcelParser._str(row[colMap.id]);
            if (!officialId) continue;

            const drCode = ExcelParser._str(row[colMap.dr]);
            if (!drCode) continue;

            if (!drMap.has(drCode)) {
                drMap.set(drCode, {
                    code: drCode,
                    name: drCode,   // temporal
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
            if (paragraphRef === '') paragraphRef = null;
        }
        return {
            official_id: officialId,
            name: ExcelParser._str(row[colMap.name]) || officialId, // Por si acaso
            paragraph_ref: paragraphRef,
            related_ar: ExcelParser._str(row[colMap.related_ar]),
            data_type: ExcelParser._str(row[colMap.data_type])
                ? ExcelParser._str(row[colMap.data_type]).toLowerCase()
                : null,
            is_voluntary: ExcelParser._bool(row[colMap.is_voluntary]),
            is_conditional: ExcelParser._conditionalBool(row[colMap.is_conditional]),
            cross_reference: ExcelParser._str(row[colMap.cross_reference]),
            phased_in_750: colMap.phased_in_750 !== null
                ? ExcelParser._bool(row[colMap.phased_in_750])
                : false,
            phased_in_appendix_c: colMap.phased_in_appendix_c !== null
                ? ExcelParser._bool(row[colMap.phased_in_appendix_c])
                : false,
        };
    }

    /*
            AUXILIARES
    */

    static _str(value) {
        if (value === null || value === undefined) return null;
        const trimmed = String(value).trim().replace(/\s+/g, ' ');  //Limpar espacios dobles o o saltos de linea
        return trimmed === '' ? null : trimmed;
    }

    // Si hay algo escrito se considera true, si esta vacio no lo es (devuelve false).
    // Para columnas I, K, L
    static _bool(value) {
        if (value === null || value === undefined) return false;
        const trimmed = String(value).trim();
        return trimmed !== '';
    }

    // Columna H, "Conditional" (Condicional o no) = Si en la celda aparece la palabra "conditional" o "alternative" se considera condicional (devuelve true),
    // si esta vacio o no contiene esas palabras se considera no condicional (devuelve false).
    static _conditionalBool(value) {
        if (value === null || value === undefined) return false;
        const lower = String(value).toLowerCase().trim();
        return lower.includes('conditional') || lower.includes('alternative');
    }

    // Extrae el hipervínculo del campo name
    static _extractLink(ws, rowIdx, colIdx) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
        const cell = ws[cellRef];
        if (!cell || !cell.l || !cell.l.Target) return null;
        return cell.l.Target;
    }
}

module.exports = ExcelParser;
