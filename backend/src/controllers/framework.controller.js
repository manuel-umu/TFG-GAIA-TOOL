const { Op } = require('sequelize');
const sequelize = require('../config/sequelize.js');
const Framework = require('../models/framework.model.js');
const FrameworkVersion = require('../models/framework_version.model.js');
const Standard = require('../models/standard.model.js');
const DisclosureRequirement = require('../models/disclosure_requirement.model.js');
const DataPoint = require('../models/data_point.model.js');

async function get_frameworks(req, res) {
    try {
        const frameworks = await Framework.findAll({
            where: { is_active: true },
            include: [{
                model: FrameworkVersion,
                as: 'versions',
                where: { is_active: true },
                required: false,
                attributes: ['id', 'version_code', 'version_label', 'effective_date'],
            }],
            order: [['name', 'ASC']],
        });
        return res.status(200).json(frameworks);
    } catch (error) {
        console.error('Error fetching frameworks:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

async function get_standards_by_version(req, res) {
    const { versionId } = req.params;
    try {
        const standards = await Standard.findAll({
            where: { framework_version_id: versionId },
            order: [['sort_order', 'ASC']],
        });

        const standardIds = standards.map(s => s.id);

        const drCounts = await DisclosureRequirement.findAll({
            where: { standard_id: { [Op.in]: standardIds } },
            attributes: [
                'standard_id',
                [sequelize.fn('COUNT', sequelize.col('id')), 'dr_count'],
            ],
            group: ['standard_id'],
            raw: true,
        });
        const drCountMap = new Map(drCounts.map(r => [r.standard_id, parseInt(r.dr_count, 10)]));

        const drs = await DisclosureRequirement.findAll({
            where: { standard_id: { [Op.in]: standardIds } },
            attributes: ['id', 'standard_id'],
            raw: true,
        });
        const drIds = drs.map(d => d.id);
        const drToStandard = new Map(drs.map(d => [d.id, d.standard_id]));

        const dpCounts = await DataPoint.findAll({
            where: { disclosure_requirement_id: { [Op.in]: drIds } },
            attributes: [
                'disclosure_requirement_id',
                [sequelize.fn('COUNT', sequelize.col('id')), 'dp_count'],
            ],
            group: ['disclosure_requirement_id'],
            raw: true,
        });

        const dpByStandard = new Map();
        for (const row of dpCounts) {
            const stdId = drToStandard.get(row.disclosure_requirement_id);
            if (!stdId) continue;
            dpByStandard.set(stdId, (dpByStandard.get(stdId) || 0) + parseInt(row.dp_count, 10));
        }

        const result = standards.map(s => ({
            id: s.id,
            code: s.code,
            name: s.name,
            category: s.category,
            is_mandatory: s.is_mandatory,
            sort_order: s.sort_order,
            dr_count: drCountMap.get(s.id) || 0,
            datapoint_count: dpByStandard.get(s.id) || 0,
        }));

        return res.status(200).json({ standards: result });
    } catch (error) {
        console.error('Error fetching standards:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

async function get_standard_detail(req, res) {
    const { standardId } = req.params;
    try {
        const drs = await DisclosureRequirement.findAll({
            where: { standard_id: standardId },
            order: [['sort_order', 'ASC']],
        });

        const drIds = drs.map(dr => dr.id);

        const dataPoints = await DataPoint.findAll({
            where: { disclosure_requirement_id: { [Op.in]: drIds } },
            order: [['id', 'ASC']],
            attributes: ['id', 'official_id', 'name', 'data_type', 'is_voluntary', 'is_conditional', 'paragraph_ref', 'disclosure_requirement_id'],
        });

        const dpsByDr = new Map();
        for (const dp of dataPoints) {
            if (!dpsByDr.has(dp.disclosure_requirement_id)) dpsByDr.set(dp.disclosure_requirement_id, []);
            dpsByDr.get(dp.disclosure_requirement_id).push({
                id: dp.id,
                official_id: dp.official_id,
                name: dp.name,
                data_type: dp.data_type,
                is_voluntary: dp.is_voluntary,
                is_conditional: dp.is_conditional,
                paragraph_ref: dp.paragraph_ref,
            });
        }

        const result = drs.map(dr => ({
            id: dr.id,
            code: dr.code,
            name: dr.name,
            datapoint_count: (dpsByDr.get(dr.id) || []).length,
            data_points: dpsByDr.get(dr.id) || [],
        }));

        return res.status(200).json({ disclosure_requirements: result });
    } catch (error) {
        console.error('Error fetching standard detail:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// ─── Upload: preview e importación de normativa ───────────────────────────

// Mapa en memoria: token -> { framework, frameworkVersion, standards, createdAt }
// Para no enviar dos veces, una para el preview y otra para subirlo al final
const previewStore = new Map();

async function preview_upload(req, res) {
    try {
        const { framework: fwData, frameworkVersion: fvData, standards } = req.body;

        if (!fwData?.code || !fwData?.name || !fvData?.version_code || !fvData?.version_label) {
            return res.status(400).json({ error: 'Missing required metadata fields' });
        }
        if (!Array.isArray(standards) || standards.length === 0) {
            return res.status(400).json({ error: 'No standards found in the parsed data' });
        }

        const existingFw = await Framework.findOne({ where: { code: fwData.code } });
        let versionConflict = false;
        if (existingFw) {
            const existingFv = await FrameworkVersion.findOne({
                where: { framework_id: existingFw.id, version_code: fvData.version_code },
            });
            versionConflict = !!existingFv;
        }

        const summary = standards.map(s => ({
            code: s.code,
            name: s.name,
            category: s.category,
            is_mandatory: s.is_mandatory,
            dr_count: s.disclosureRequirements?.length || 0,
            datapoint_count: (s.disclosureRequirements || []).reduce((sum, dr) => sum + (dr.dataPoints?.length || 0), 0),
        }));

        const total_drs = summary.reduce((s, r) => s + r.dr_count, 0);
        const total_dps = summary.reduce((s, r) => s + r.datapoint_count, 0);

        const token = require('crypto').randomUUID();
        previewStore.set(token, { framework: fwData, frameworkVersion: fvData, standards, createdAt: Date.now() });

        // Limpiar tokens viejos (>30 min)
        for (const [k, v] of previewStore.entries()) {
            if (Date.now() - v.createdAt > 30 * 60 * 1000) previewStore.delete(k);
        }

        return res.status(200).json({ token, version_conflict: versionConflict, summary, total_drs, total_dps });
    } catch (error) {
        console.error('Error in preview_upload:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// Se sube finalmente a bbdd
async function confirm_import(req, res) {
    const { token } = req.params;
    const stored = previewStore.get(token);
    if (!stored) {  // Solo si pasan 30 minutos (TTL del token)
        return res.status(404).json({ error: 'Preview token not found or expired. Please upload the file again.' });
    }

    const { framework: frameworkData, frameworkVersion: frameworkVersionData, standards } = parseado;
    const transaction = await sequelize.transaction();

    try {   // Misma logica que el seeder del backend
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
            const [standard, stdCreated] = await Standard.findOrCreate({
                where: { framework_version_id: frameworkVersion.id, code: standardData.code },
                defaults: {
                    name: standardData.name,
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
        // Borrar el token para evitar importaciones duplicadas
        previewStore.delete(token);

        return res.status(201).json({
            message: 'Framework imported successfully',
            framework_id: framework.id,
            framework_version_id: frameworkVersion.id,
            totals: { standards: totalStandards, disclosure_requirements: totalDRs, data_points: totalDataPoints },
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error importing the framework:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { get_frameworks, get_standards_by_version, get_standard_detail, preview_upload, confirm_import };
