'use strict';

const { suggestMateriality } = require('../services/materialityService.js');
const Audit = require('../models/audit.model.js');

// IA para sugerir la materialidad de los estandares

async function suggest_materiality(req, res) {
    const { id } = req.params;
    const { sector, employees, revenue, description } = req.body;

    if (!sector || employees == null) {
        return res.status(400).json({ error: 'sector y employees son obligatorios' });
    }

    try {
        const audit = await Audit.findOne({ where: { id } });
        if (!audit) return res.status(404).json({ error: 'Audit not found' });

        const suggestions = await suggestMateriality({
            sector,
            employees: Number(employees),
            revenue: revenue != null ? Number(revenue) : null,
            description: description || null,
        });

        return res.status(200).json({ suggestions });
    } catch (error) {
        console.error('[AI] Error al sugerir materialidad:', error);
        return res.status(500).json({ error: 'AI service error', detail: error.message });
    }
}

module.exports = { suggest_materiality };
