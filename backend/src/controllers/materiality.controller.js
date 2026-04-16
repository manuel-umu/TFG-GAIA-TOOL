const Audit = require('../models/audit.model.js');
const Standard = require('../models/standard.model.js');
const AuditStandard = require('../models/audit_standard.model.js');

async function get_materiality_standards(req, res) {
    const {id} = req.params;
    try {
        const audit = await Audit.findOne({ where: { id } });
        const standards = await Standard.findAll({
            where: { framework_version_id: audit.framework_version_id },
            order: [['sort_order', 'ASC']],
        });

        const evaluate = await AuditStandard.findAll({ where: { audit_id: id } });

        const result = standards.map(s => {
            const a = evaluate.find(e => e.standard_id === s.id);
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
        console.error('Error', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

async function save_materiality(req, res) {
    const { id } = req.params;
    const { standards } = req.body;

    try {
        const audit = await Audit.findOne({ where: { id } });

        const now = new Date();
        const records = standards.map(s => ({
            audit_id: parseInt(id, 10),
            standard_id: s.standard_id,
            is_material: s.is_material,
            justification: s.justification || null,
            assessed_by: req.user.id,
            assessed_at: now,
            updated_at: now,
        }));

        await AuditStandard.bulkCreate(records, {
            updateOnDuplicate: ['is_material', 'justification', 'assessed_by', 'assessed_at', 'updated_at'],
        });

        return res.status(200).json({ message: 'Guardado evaluacion correctamente' });
    } catch (error) {
        console.error('Error en el guardado de la evaluacion de materialidad:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    get_materiality_standards,
    save_materiality,
};
