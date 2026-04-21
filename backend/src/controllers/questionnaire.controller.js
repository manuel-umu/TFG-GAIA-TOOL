const Audit = require('../models/audit.model.js');
const AuditStandard = require('../models/audit_standard.model.js');
const Standard = require('../models/standard.model.js');
const DisclosureRequirement = require('../models/disclosure_requirement.model.js');
const DataPoint = require('../models/data_point.model.js');
const AuditDatapoints = require('../models/audit_data_points.model.js');

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

        const result = [];

        for (const assessment of materialAssessments) {
            const standard = await Standard.findOne({ where: { id: assessment.standard_id } });
            if (!standard) continue;

            // Disclosure Requirements del estandar
            const disclosureRequirements = await DisclosureRequirement.findAll({
                where: { standard_id: standard.id },
                order: [['sort_order', 'ASC']],
            });

            const drList = [];
            for (const dr of disclosureRequirements) {
                // DataPoints de cada DR
                const dataPoints = await DataPoint.findAll({
                    where: { disclosure_requirement_id: dr.id },
                    order: [['id', 'ASC']],
                });

                const dpList = [];
                for (const dp of dataPoints) {
                    // Respuesta previa si existe
                    const saved = await AuditDatapoints.findOne({
                        where: { audit_id: id, data_point_id: dp.id },
                    });

                    dpList.push({
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

                drList.push({
                    id: dr.id,
                    code: dr.code,
                    name: dr.name,
                    data_points: dpList,
                });
            }

            result.push({
                id: standard.id,
                code: standard.code,
                name: standard.name,
                category: standard.category,
                disclosure_requirements: drList,
            });
        }

        return res.status(200).json({ audit_id: parseInt(id, 10), standards: result });
    } catch (error) {
        console.error('Error fetching questionnaire:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { get_questionnaire };
