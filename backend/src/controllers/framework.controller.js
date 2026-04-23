const Framework = require('../models/framework.model.js');
const FrameworkVersion = require('../models/framework_version.model.js');

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

module.exports = { get_frameworks };
