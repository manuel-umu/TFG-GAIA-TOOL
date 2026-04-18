const Indicators = require('../models/indicator.model.js');
const sequelize = require('../config/sequelize.js');
const handleValidation = require('../validators/handleValidations.js');
const ProcessIndicatorFactor = require('../models/process_indicator_factor.model.js');
const Processes = require('../models/process.model.js')

async function get_indicators(req, res) {

    const page = req.query.page ? parseInt(req.query.page) : 1;
    const perPage = req.query.perPage ? parseInt(req.query.perPage) : 5;
    const offset = (page - 1) * perPage;
    const sortBy = req.query.sortBy || 'id';
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';

    const allowedSortFields = ['id', 'name', 'dimension', 'goal','measure','frequency'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'id';

    const includeDeleted = req.query.includeDeleted === 'true';
    
    try {
        const { rows: indicators, count } = await Indicators.findAndCountAll({
            where: includeDeleted ? {} : { deleted_at: null},
            limit: perPage,
            offset: offset,
            order: [[orderField, sortOrder]],
        });

        await Promise.all(
            indicators.map(async (ind) => {
                ind.dataValues.remove_indicator = await can_remove_indicator(ind);
            })
        )

        res.status(200).json({
            data: indicators,
            total: count,
            currentPage: page,
            perPage: perPage,
            totalPages: Math.ceil(count / perPage),
            sortBy: orderField,
            sortOrder: sortOrder.toLocaleLowerCase(),
        });

    } catch (error) {
        console.error('Error fetching indicators:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function get_indicator(req, res) {
    try {
        const { id } = req.params;
        const indicator = await Indicators.findOne({ where: { id } });
        if (!indicator) {
            return res.status(404).json({ error: 'Indicator not found' });
        }
        res.status(200).json(indicator);
    } catch (error) {
        console.error('Error fetching indicator:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function create_indicator(req, res) {
    
    if (handleValidation(req, res)) return;

    const { name, dimension, formula, goal, measure, frequency } = req.body;

    try {
        const existingInd = await Indicators.findOne({ where: { name, deleted_at: null }});
        if (existingInd) {
            return res.status(406).json({
                errors: {
                    name: 'Indicator already exists'
                }
            });
        }

        const newIndicator = await Indicators.create(
            { name, dimension, formula, goal, measure, frequency }
        );

        res.status(201).json({
            id: newIndicator.id,
            message: 'Indicator created successfully',
        });

    } catch (error) {
        console.error('Error creating indicator:', error);
        res.status(500).json({ error: 'Internal server error' })
    }
}


async function update_indicator(req, res) {
    if (handleValidation(req, res)) return;

    const { id } = req.params;
    const { name, dimension, formula, goal, measure, frequency } = req.body;

    try {
        const indicator = await Indicators.findOne({ where: { id } });
        if (!indicator) {
            return res.status(404).json({ error: 'Indicator not found' });
        }

        const existingInd = await Indicators.findOne({ where: { name, deleted_at: null }});
        if (existingInd && existingInd.id !== indicator.id) {
            return res.status(406).json({
                errors: {
                    name: 'Indicator name already exists'
                }
            });
        }

        await Indicators.update(
            { name, dimension, formula, goal, measure, frequency },
            { where: { id } }
        );

        res.status(200).json({
            message: 'Indicator updated successfully',
        });

    } catch (error) {
        console.error('Error updating indicator:', error);
        res.status(500).json({ error: 'Internal server error' })
    }
}

async function delete_indicator(req, res) {
    const { id } = req.params;

    try {
        const indicator = await Indicators.findOne({ where: { id } });
        if (!indicator) {
            return res.status(404).json({ error: 'Indicator not found' });
        }

        const relations = await ProcessIndicatorFactor.findAll({ where: { indicator: id } });

        if (relations.length > 0) {
            const processIds = relations.map(r => r.process);
            const activeProcesses = await Processes.findAll({
                where: { 
                    id: processIds,
                    deleted_at: null
                }
            });

            if (activeProcesses.length > 0) {
                return res.status(400).json({
                    error: 'Cannot delete indicator because it is associated with one or more active processes',
                });
            }
        }

        await indicator.update({ deleted_at: new Date() });

        res.status(200).json({ message: 'Indicator deleted successfully' });

    } catch (error) {
        console.error('Error deleting indicator:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


async function delete_indicators(req, res) {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Invalid request: ids must be a non-empty array' });
    }

    const transaction = await sequelize.transaction();

    try {

        // Buscar los indicadores existentes
        const indicators = await Indicators.findAll({ where: { id: ids }, transaction });
        const foundIds = indicators.map(indicator => indicator.id);
        const notFoundIds = ids.filter(id => !foundIds.includes(id));
        
        // Si no se encuentra ningun id
        if (foundIds.length === 0) {
            return res.status(404).json({ error: 'No indicators found for the provided ids ' });
        }

        const rowWithIndicators = await ProcessIndicatorFactor.findAll({ where: { indicator: ids } })
        const notPossibleToDelete = rowWithIndicators.map(row => row.indicator);
        const foundIdsFiltered = foundIds.filter(id => !notPossibleToDelete.includes(id));

        if (foundIdsFiltered.length === 0) {
            return res.status(400).json({
                error: 'Can not delete indicators because they are associated with one or more processes',
            });
        }

        // Si se encuentran algunos, entonces se eliminan
        if (foundIdsFiltered.length > 0) {
            await Indicators.destroy({ where: { id: foundIdsFiltered }, transaction });
        }

        await transaction.commit();

        if (notFoundIds.length > 0) {
            res.status(200).json({
                message: 'Some indicators were not found',
                deletedIds: foundIdsFiltered,
                notFoundIds: notFoundIds,
                notPossibleToDelete: notPossibleToDelete,
            });
        } else {
            res.status(200).json({message: 'Indicators deleted successfully',});
        }

    } catch (error) {
        await transaction.rollback();
        console.error('Error deleting indicators:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function can_remove_indicator(indicator) {
    const indicatorInAudits = await ProcessIndicatorFactor.findAll({ where: { indicator: indicator.id } });
    const dataValues = indicatorInAudits.map(rel => rel.dataValues);
    if (dataValues.length > 0) {
        for (const rel of indicatorInAudits) {
            const process = await Processes.findOne({
                where: { id: rel.process, deleted_at: null }
            });
            if (process) {
                return false;
            }
        }
    }
    return true;
};

async function create_indicator_data_point(req, res){

}




module.exports = {
    get_indicators,
    get_indicator,
    create_indicator,
    update_indicator,
    delete_indicator,
    delete_indicators,
}