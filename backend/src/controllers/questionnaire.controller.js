const Audit = require('../models/audit.model.js');
const AuditStandard = require('../models/audit_standard.model.js');
const Standard = require('../models/standard.model.js');
const DisclosureRequirement = require('../models/disclosure_requirement.model.js');
const DataPoint = require('../models/data_point.model.js');
const AuditDatapoints = require('../models/audit_data_points.model.js');
const { Op } = require('sequelize');

// GET /questionnaire/:id
// Devuelve el cuestionario filtrado: solo los estandares materiales
async function get_questionnaire(req, res) {
    const { id } = req.params;
    try {
        const audit = await Audit.findOne({ where: { id } });
        if (!audit) return res.status(404).json({ error: 'Audit not found' });

        // Estandares marcados como materiales
        const materialAssessments = await AuditStandard.findAll({
            where: { audit_id: id, is_material: true },
        });
        // Si no tiene estandar material, se vuelve directo
        if (materialAssessments.length === 0) {
            return res.status(200).json({ audit_id: parseInt(id, 10), standards: [] });
        }

        const materialStandardIds = materialAssessments.map(a => a.standard_id);

        const standards = await Standard.findAll({
            where: { id: { [Op.in]: materialStandardIds } },
            order: [['sort_order', 'ASC']],
        });

        // Disclosure Requirements del estandar
        const disclosureRequirements = await DisclosureRequirement.findAll({
            where: { standard_id: { [Op.in]: materialStandardIds } },
            order: [['sort_order', 'ASC']],
        });

        const drIds = disclosureRequirements.map(dr => dr.id);
        
        // DataPoints de cada DR
        const dataPoints = await DataPoint.findAll({
            where: { disclosure_requirement_id: { [Op.in]: drIds } },
            order: [['id', 'ASC']],
        });

        const dpIds = dataPoints.map(dp => dp.id);

        const auditDatapoints = await AuditDatapoints.findAll({
            where: { audit_id: id, data_point_id: { [Op.in]: dpIds } },
        });

        const responseMap = new Map(auditDatapoints.map(r => [r.data_point_id, r]));

        const dpsByDrId = new Map();
        for (const dp of dataPoints) {
            if (!dpsByDrId.has(dp.disclosure_requirement_id)) {
                dpsByDrId.set(dp.disclosure_requirement_id, []);
            }
            // Respuesta previa si existe
            const saved = responseMap.get(dp.id) || null;
            dpsByDrId.get(dp.disclosure_requirement_id).push({
                id: dp.id,
                official_id: dp.official_id,
                name: dp.name,
                data_type: dp.data_type,
                is_voluntary: dp.is_voluntary,
                is_conditional: dp.is_conditional,
                paragraph_ref: dp.paragraph_ref,
                related_ar: dp.related_ar,
                cross_reference: dp.cross_reference,
                link: dp.link,
                response: saved ? {
                    value_text: saved.value_text,
                    value_numeric: saved.value_numeric,
                    is_applicable: saved.is_applicable,
                    evidence_reference: saved.evidence_reference,
                    status: saved.status,
                    updated_at: saved.updated_at,
                } : null,
            });
        }

        const drsByStandardId = new Map();
        for (const dr of disclosureRequirements) {
            if (!drsByStandardId.has(dr.standard_id)) {
                drsByStandardId.set(dr.standard_id, []);
            }
            drsByStandardId.get(dr.standard_id).push({
                id: dr.id,
                code: dr.code,
                name: dr.name,
                data_points: dpsByDrId.get(dr.id) || [],
            });
        }

        const result = standards.map(s => ({
            id: s.id,
            code: s.code,
            name: s.name,
            category: s.category,
            disclosure_requirements: drsByStandardId.get(s.id) || [],
        }));

        return res.status(200).json({ audit_id: parseInt(id, 10), standards: result });
    } catch (error) {
        console.error('Error fetching questionnaire:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

async function save_questionnaire(req, res) {
    const { id } = req.params;
    const { data_points } = req.body;

    if (!Array.isArray(data_points) || data_points.length === 0) {
        return res.status(400).json({ error: 'data_points must be a non-empty array' });
    }

    try {
        const audit = await Audit.findOne({ where: { id } });
        if (!audit) return res.status(404).json({ error: 'Audit not found' });

        const records = data_points.map(dp => ({
            audit_id: parseInt(id, 10),
            data_point_id: dp.data_point_id,
            value_text: dp.value_text ?? null,
            value_numeric: (dp.value_numeric === '' || dp.value_numeric == null) ? null : dp.value_numeric,
            is_applicable: dp.is_applicable !== false,
            evidence_reference: dp.evidence_reference ?? null,
            status: dp.status || 'draft',
            updated_at: new Date(),
            updated_by: req.user.id,
        }));

        await AuditDatapoints.bulkCreate(records, {
            updateOnDuplicate: ['value_text', 'value_numeric', 'is_applicable', 'evidence_reference', 'status', 'updated_at', 'updated_by'],
        });

        return res.status(200).json({ message: 'Questionnaire saved successfully' });
    } catch (error) {
        console.error('Error saving questionnaire:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { get_questionnaire, save_questionnaire };
