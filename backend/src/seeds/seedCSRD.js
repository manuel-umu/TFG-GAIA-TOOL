'use strict';

require('dotenv').config();
const path = require('path');

const sequelize = require('../config/sequelize.js');

require('../models/user.model.js');
require('../models/organization.model.js');
require('../models/indicator.model.js');
require('../models/factor.model.js');
require('../models/process.model.js');
require('../models/audit.model.js');
require('../models/process_indicator_factor.model.js');
require('../models/calculated_value_indicator.model.js');
require('../models/calculated_value_process.model.js');
require('../models/calculated_element_matrix_saaty.model.js');
const Framework = require('../models/framework.model.js');
const FrameworkVersion = require('../models/framework_version.model.js');
const Standard = require('../models/standard.model.js');
const DisclosureRequirement = require('../models/disclosure_requirement.model.js');
const DataPoint = require('../models/data_point.model.js');

require('../models/audit_data_points.model.js');
require('../models/audit_standard.model.js');

// Las asocizaciones deben ir ultimo
require('../models/associations.js');

const ExcelParser = require('../services/excelParser.js');

// TODO: Temporal
const EXCEL_PATH = path.resolve(__dirname, '..', 'csrd', 'datapoints.xlsx');

// Descripciones de cada estandar ESRS
const STANDARD_DESCRIPTIONS = {
    'ESRS 1': 'Sets out the general principles for sustainability reporting: double materiality, value chain, time horizons, and connections with financial statements. Does not contain disclosure requirements of its own.',
    'ESRS 2': 'General disclosures mandatory for all companies: governance, strategy, management of impacts, risks and opportunities (IROs), and metrics and targets cross-cutting all material topics.',
    'E1': 'Information on the company\'s efforts to mitigate climate change (1.5 °C alignment, transition plan, scope 1, 2 and 3 GHG emissions) and to adapt to its physical effects. Includes energy use, removals and carbon credits.',
    'E2': 'Material impacts, risks and opportunities related to air, water and soil pollution, and to substances of concern or very high concern. Covers actions to prevent, mitigate and remediate pollution.',
    'E3': 'How the company affects water and marine resources: consumption, withdrawal, discharges, and dependence on water-stressed areas. Includes plans and metrics to protect these resources.',
    'E4': 'Impacts on biodiversity and ecosystems (species loss, habitat degradation, land and sea-use change, invasive species) and plans for protection, restoration and offsetting.',
    'E5': 'Resource inflows and outflows (raw materials, products and waste) and practices to extend product life, reduce resource consumption and promote the circular economy.',
    'S1': 'Information on working conditions, equal treatment and opportunities, and human rights of the company\'s direct employees (including non-employees under its control).',
    'S2': 'Information on workers of suppliers, contractors and other value chain actors affected by the company\'s operations, products or services.',
    'S3': 'Impacts on local or indigenous communities affected by the company\'s activity, including economic, social, cultural and civil rights.',
    'S4': 'Impacts on consumers and end-users related to the information they receive, their personal safety and their social inclusion.',
    'G1': 'Corporate culture, whistleblower protection, supplier relationships (including payment practices), prevention and detection of corruption and bribery, and political influence.',
};

async function seed() {
    console.log('Iniciando seed de datos EFRAG...');
    console.log('Ruta del Excel:', EXCEL_PATH);

    let parseado;
    try {
        parseado = ExcelParser.parse(EXCEL_PATH);
    } catch (err) {
        console.error('Error al parsear el Excel:', err.message);
        process.exit(1);
    }

    const { framework: frameworkData, frameworkVersion: frameworkVersionData, standards } = parseado;

    console.log(`Excel parseado: ${standards.length} standards encontrados en el Excel.`);

    // Crear tablas si no existen
    await sequelize.sync();

    const transaction = await sequelize.transaction();

    try {
        // Framework
        const [framework, fwCreated] = await Framework.findOrCreate({
            where: { code: frameworkData.code },
            defaults: {
                name: frameworkData.name,
                description: frameworkData.description,
                issuing_body: frameworkData.issuing_body,
            },
            transaction,
        });
        console.log(`Framework "${framework.code}" — ${fwCreated ? 'creado' : 'ya existía'} (id: ${framework.id})`);

        // FrameworkVersion
        const [frameworkVersion, fvCreated] = await FrameworkVersion.findOrCreate({
            where: { framework_id: framework.id, version_code: frameworkVersionData.version_code },
            defaults: {
                version_label: frameworkVersionData.version_label,
                effective_date: frameworkVersionData.effective_date,
                source_file: frameworkVersionData.source_file,
            },
            transaction,
        });
        console.log(`FrameworkVersion: "${frameworkVersion.version_code}" — ${fvCreated ? 'creada' : 'ya existía'} (id: ${frameworkVersion.id})`);

        let totalStandards = 0;
        let totalDRs = 0;
        let totalDataPoints = 0;

        // Standards
        for (const standardData of standards) {
            const description = STANDARD_DESCRIPTIONS[standardData.code] || null;
            const [standard, stdCreated] = await Standard.findOrCreate({
                where: { framework_version_id: frameworkVersion.id, code: standardData.code },
                defaults: {
                    name: standardData.name,
                    description,
                    category: standardData.category,
                    is_mandatory: standardData.is_mandatory,
                    sort_order: standardData.sort_order,
                },
                transaction,
            });
            if (stdCreated) totalStandards++;

            // DisclosureRequirements
            for (const disclosureRequirementData of standardData.disclosureRequirements) {
                const [dr, drCreated] = await DisclosureRequirement.findOrCreate({
                    where: { standard_id: standard.id, code: disclosureRequirementData.code },
                    defaults: {
                        name: disclosureRequirementData.name,
                        sort_order: disclosureRequirementData.sort_order,
                    },
                    transaction,
                });
                if (drCreated) totalDRs++;

                // DataPoints
                for (const dataPointData of disclosureRequirementData.dataPoints) {
                    const dataType = dataPointData.data_type;

                    const [, dpCreated] = await DataPoint.findOrCreate({
                        where: { official_id: dataPointData.official_id },
                        defaults: {
                            disclosure_requirement_id: dr.id,
                            name: dataPointData.name,
                            paragraph_ref: dataPointData.paragraph_ref,
                            related_ar: dataPointData.related_ar,
                            data_type: dataType,
                            is_voluntary: dataPointData.is_voluntary,
                            is_conditional: dataPointData.is_conditional,
                            phased_in_750: dataPointData.phased_in_750,
                            phased_in_appendix_c: dataPointData.phased_in_appendix_c,
                            cross_reference: dataPointData.cross_reference,
                            link: dataPointData.link,
                        },
                        transaction,
                    });
                    if (dpCreated) totalDataPoints++;
                }
            }
        }
        await transaction.commit();

        console.log('');
        console.log('Seed completado con exito:');
        console.log(`  Standards insertados:              ${totalStandards}`);
        console.log(`  DisclosureRequirements insertados: ${totalDRs}`);
        console.log(`  DataPoints insertados:             ${totalDataPoints}`);
    } catch (err) {
        await transaction.rollback();
        console.error('Error durante el seed, se ha hecho rollback de la transaccion:', err);
        throw err;
    }
}

if (require.main === module) {
    seed().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { seed };
