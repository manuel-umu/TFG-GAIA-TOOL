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

// Nombres oficiales de cada Disclosure Requirement (Delegated Regulation EU 2023/2772, Annex I)
const DR_NAMES = {
    // ESRS 2 — General disclosures
    'BP-1': 'General basis for preparation of sustainability statements',
    'BP-2': 'Disclosures in relation to specific circumstances',
    'GOV-1': 'The role of the administrative, management and supervisory bodies',
    'GOV-2': 'Information provided to and sustainability matters addressed by the undertaking\'s administrative, management and supervisory bodies',
    'GOV-3': 'Integration of sustainability-related performance in incentive schemes',
    'GOV-4': 'Statement on due diligence',
    'GOV-5': 'Risk management and internal controls over sustainability reporting',
    'SBM-1': 'Strategy, business model and value chain',
    'SBM-2': 'Interests and views of stakeholders',
    'SBM-3': 'Material impacts, risks and opportunities and their interaction with strategy and business model',
    'IRO-1': 'Description of the processes to identify and assess material impacts, risks and opportunities',
    'IRO-2': 'Disclosure Requirements in ESRS covered by the undertaking\'s sustainability statement',
    // ESRS 2 — Minimum Disclosure Requirements (MDR)
    'MDR-P': 'Policies adopted to manage material sustainability matters',
    'MDR-A': 'Actions and resources in relation to material sustainability matters',
    'MDR-M': 'Metrics in relation to material sustainability matters',
    'MDR-T': 'Tracking effectiveness of policies and actions through targets',
    // E1 — Climate change
    'E1-1': 'Transition plan for climate change mitigation',
    'E1-2': 'Policies related to climate change mitigation and adaptation',
    'E1-3': 'Actions and resources in relation to climate change policies',
    'E1-4': 'Targets related to climate change mitigation and adaptation',
    'E1-5': 'Energy consumption and mix',
    'E1-6': 'Gross Scopes 1, 2, 3 and Total GHG emissions',
    'E1-7': 'GHG removals and GHG mitigation projects financed through carbon credits',
    'E1-8': 'Internal carbon pricing',
    'E1-9': 'Anticipated financial effects from material physical and transition risks and potential climate-related opportunities',
    // E2 — Pollution
    'E2-1': 'Policies related to pollution',
    'E2-2': 'Actions and resources related to pollution',
    'E2-3': 'Targets related to pollution',
    'E2-4': 'Pollution of air, water and soil',
    'E2-5': 'Substances of concern and substances of very high concern',
    'E2-6': 'Anticipated financial effects from pollution-related impacts, risks and opportunities',
    // E3 — Water and marine resources
    'E3-1': 'Policies related to water and marine resources',
    'E3-2': 'Actions and resources related to water and marine resources',
    'E3-3': 'Targets related to water and marine resources',
    'E3-4': 'Water consumption',
    'E3-5': 'Anticipated financial effects from water and marine resources-related impacts, risks and opportunities',
    // E4 — Biodiversity and ecosystems
    'E4-1': 'Transition plan and consideration of biodiversity and ecosystems in strategy and business model',
    'E4-2': 'Policies related to biodiversity and ecosystems',
    'E4-3': 'Actions and resources related to biodiversity and ecosystems',
    'E4-4': 'Targets related to biodiversity and ecosystems',
    'E4-5': 'Impact metrics related to biodiversity and ecosystems change',
    'E4-6': 'Anticipated financial effects from biodiversity and ecosystem-related impacts, risks and opportunities',
    // E5 — Resource use and circular economy
    'E5-1': 'Policies related to resource use and circular economy',
    'E5-2': 'Actions and resources related to resource use and circular economy',
    'E5-3': 'Targets related to resource use and circular economy',
    'E5-4': 'Resource inflows',
    'E5-5': 'Resource outflows',
    'E5-6': 'Anticipated financial effects from resource use and circular economy-related impacts, risks and opportunities',
    // S1 — Own workforce
    'S1-1': 'Policies related to own workforce',
    'S1-2': 'Processes for engaging with own workforce and workers\' representatives about impacts',
    'S1-3': 'Processes to remediate negative impacts and channels for own workforce to raise concerns',
    'S1-4': 'Taking action on material impacts on own workforce, and approaches to managing material risks and pursuing material opportunities related to own workforce, and effectiveness of those actions',
    'S1-5': 'Targets related to managing material negative impacts, advancing positive impacts, and managing material risks and opportunities',
    'S1-6': 'Characteristics of the undertaking\'s employees',
    'S1-7': 'Characteristics of non-employee workers in the undertaking\'s own workforce',
    'S1-8': 'Collective bargaining coverage and social dialogue',
    'S1-9': 'Diversity metrics',
    'S1-10': 'Adequate wages',
    'S1-11': 'Social protection',
    'S1-12': 'Persons with disabilities',
    'S1-13': 'Training and skills development metrics',
    'S1-14': 'Health and safety metrics',
    'S1-15': 'Work-life balance metrics',
    'S1-16': 'Compensation metrics (pay gap and total compensation)',
    'S1-17': 'Incidents, complaints and severe human rights impacts',
    // S2 — Workers in the value chain
    'S2-1': 'Policies related to value chain workers',
    'S2-2': 'Processes for engaging with value chain workers about impacts',
    'S2-3': 'Processes to remediate negative impacts and channels for value chain workers to raise concerns',
    'S2-4': 'Taking action on material impacts on value chain workers, and approaches to managing material risks and pursuing material opportunities related to value chain workers, and effectiveness of those actions',
    'S2-5': 'Targets related to managing material negative impacts, advancing positive impacts, and managing material risks and opportunities',
    // S3 — Affected communities
    'S3-1': 'Policies related to affected communities',
    'S3-2': 'Processes for engaging with affected communities about impacts',
    'S3-3': 'Processes to remediate negative impacts and channels for affected communities to raise concerns',
    'S3-4': 'Taking action on material impacts on affected communities, and approaches to managing material risks and pursuing material opportunities related to affected communities, and effectiveness of those actions',
    'S3-5': 'Targets related to managing material negative impacts, advancing positive impacts, and managing material risks and opportunities',
    // S4 — Consumers and end-users
    'S4-1': 'Policies related to consumers and end-users',
    'S4-2': 'Processes for engaging with consumers and end-users about impacts',
    'S4-3': 'Processes to remediate negative impacts and channels for consumers and end-users to raise concerns',
    'S4-4': 'Taking action on material impacts on consumers and end-users, and approaches to managing material risks and pursuing material opportunities related to consumers and end-users, and effectiveness of those actions',
    'S4-5': 'Targets related to managing material negative impacts, advancing positive impacts, and managing material risks and opportunities',
    // G1 — Business conduct
    'G1-1': 'Corporate culture and business conduct policies',
    'G1-2': 'Management of relationships with suppliers',
    'G1-3': 'Prevention and detection of corruption and bribery',
    'G1-4': 'Incidents of corruption or bribery',
    'G1-5': 'Political influence and lobbying activities',
    'G1-6': 'Payment practices',
};

// Algunos Excels EFRAG prefijan los DRs de ESRS 2 (por ej: "ESRS 2 GOV-1")
function resolveDrName(drCode) {
    if (DR_NAMES[drCode]) return DR_NAMES[drCode];
    const stripped = drCode.replace(/^ESRS\s+\S+\s+/i, '');
    return DR_NAMES[stripped] || drCode;
}

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
                const officialName = resolveDrName(disclosureRequirementData.code);
                const [dr, drCreated] = await DisclosureRequirement.findOrCreate({
                    where: { standard_id: standard.id, code: disclosureRequirementData.code },
                    defaults: {
                        name: officialName,
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
