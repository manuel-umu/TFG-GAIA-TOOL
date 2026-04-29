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

module.exports = { get_frameworks, get_standards_by_version, get_standard_detail };
