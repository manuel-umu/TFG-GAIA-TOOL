const Audit = require('../models/audit.model.js');
const Standard = require('../models/standard.model.js');
const AuditStandard = require('../models/audit_standard.model.js');

async function get_materiality_standards(req, res) {
    const {id} = req.params;
    try {
        const audit = await Audit.findOne({ where: { id } });
        if (!audit) return res.status(404).json({ error: 'Audit not found' });

        const standards = await Standard.findAll({
            where: { framework_version_id: audit.framework_version_id },
            order: [['sort_order', 'ASC']],
        });

        const assessments = await AuditStandard.findAll({ where: { audit_id: id } });
        const assessmentMap = new Map(assessments.map(a => [a.standard_id, a]));

        console.log('estandares: ', assessmentMap);

        const result = standards.map(s => {
            const a = assessmentMap.get(s.id) || null;
            return {
                id: s.id,
                code: s.code,
                name: s.name,
                category: s.category,
                is_mandatory: s.is_mandatory,
                sort_order: s.sort_order,
                assessment: a ? {
                    is_material: a.is_material,
                    justification: a.justification,
                    assessed_by: a.assessed_by,
                    assessed_at: a.assessed_at,
                } : null,
            };
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching materiality standards:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

async function save_materiality(req, res) {
    const { id } = req.params;
    const { standards } = req.body;

    if (!Array.isArray(standards) || standards.length === 0) {
        return res.status(400).json({ error: 'standards must be a non-empty array' });
    }

    try {
        const audit = await Audit.findOne({ where: { id } });
        if (!audit) return res.status(404).json({ error: 'Audit not found' });

        const standardIds = standards.map(s => s.standard_id);
        const dbStandards = await Standard.findAll({ where: { id: standardIds } });
        const mandatorySet = new Set(dbStandards.filter(s => s.is_mandatory).map(s => s.id));

        const now = new Date();
        const records = standards.map(s => ({
            audit_id: parseInt(id, 10),
            standard_id: s.standard_id,
            is_material: mandatorySet.has(s.standard_id) ? true : s.is_material,
            justification: s.justification || null,
            assessed_by: req.user.id,
            assessed_at: now,
            updated_at: now,
        }));

        await AuditStandard.bulkCreate(records, {
            updateOnDuplicate: ['is_material', 'justification', 'assessed_by', 'assessed_at', 'updated_at'],
        });

        return res.status(200).json({ message: 'Materiality assessment saved successfully' });
    } catch (error) {
        console.error('Error saving materiality assessment:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    get_materiality_standards,
    save_materiality,
};
