const Organizations = require('../models/organization.model.js');
const Factors = require('../models/factor.model.js');
const sequelize = require('../config/sequelize.js');
const handleValidation = require('../validators/handleValidations.js');
const Process = require('../models/process.model.js');
const ProcessIndicatorFactor = require('../models/process_indicator_factor.model.js');
const Audits = require('../models/audit.model.js');
const CalculatedValuesIndicator = require('../models/calculated_value_indicator.model.js');
const CalculatedValuesProcess = require('../models/calculated_value_process.model.js');
const CalculatedElementMatrixSaaty = require('../models/calculated_element_matrix_saaty.model.js');

async function get_organizations(req, res) {

    const page = req.query.page ? parseInt(req.query.page) : 1;
    const perPage = req.query.perPage ? parseInt(req.query.perPage) : 5;
    const offset = (page - 1) * perPage;
    const sortBy = req.query.sortBy || 'id';
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';

    const allowedSortFields = ['id', 'name', 'country', 'sector'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'id';
    
    try {
        const { rows: organizations, count } = await Organizations.findAndCountAll({
            limit: perPage,
            offset: offset,
            order: [[orderField, sortOrder]],
        });
        await Promise.all(
            organizations.map(async (org) => {
                org.dataValues.factors = await get_factors_names(org.id)
            })
        )
        res.status(200).json({
            data: organizations,
            total: count,
            currentPage: page,
            perPage: perPage,
            totalPages: Math.ceil(count / perPage),
            sortBy: orderField,
            sortOrder: sortOrder.toLocaleLowerCase(),
        });
    } catch (error) {
        console.error('Error fetching organizations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function get_organization(req, res) {
    try {
        const { id } = req.params;
        const organization = await Organizations.findOne({ where: { id } });
        if (!organization) {
            return res.status(404).json({
                error: 'Organization not found'
            });
        }
        organization.dataValues.factors = await get_factors_names(organization.id);
        res.status(200).json(organization);
    } catch (error) {
        console.error('Error fetching organization:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function create_organization(req, res) {

    if (handleValidation(req, res)) return;

    const { name, description, country, sector, rangeEmployees, website, goals, factors, logo_url, revenue } = req.body;

    const transaction = await sequelize.transaction();

    try {

        const existingOrg = await Organizations.findOne({ where: { name } });
        if (existingOrg) {
            return res.status(406).json({
                errors: {
                    name: 'Organization already exists'
                }
            });
        }

        var joinedGoals = goals.join(";");

        const newOrganization = await Organizations.create(
            { name, description, country, sector, rangeEmployees, website, goals: joinedGoals, logo_url: logo_url || null, revenue: revenue || null },
            { transaction }
        );

        // Eliminar duplicados en factors antes de insertar
        const uniqueFactors = [...new Set(factors)];
        const factorsToInsert = uniqueFactors.map(factorName => ({
            name: factorName,
            organization: newOrganization.id,
        }));

        await Factors.bulkCreate(factorsToInsert, { transaction });

        await transaction.commit();

        res.status(201).json({
            id: newOrganization.id,
            message: 'Organization created successfully',
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error creating organization:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function update_organization(req, res) {

    if (handleValidation(req, res)) return;
    
    const { id } = req.params;
    const { name, description, country, sector, rangeEmployees, website, goals, factors, logo_url, revenue } = req.body;

    const existingOrg = await Organizations.findOne({ where: { name } });
    if (existingOrg && existingOrg.id !== parseInt(id)) {
        return res.status(406).json({
            errors: {
                name: 'Organization already exists.'
            },
        });
    }

    const transaction = await sequelize.transaction();

    try {

        const organization = await Organizations.findOne({ where: { id } });
        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        var joinedGoals = goals.join(";");
        console.log(joinedGoals);
        const organizationUp = await Organizations.update(
            { name, description, country, sector, rangeEmployees, website, goals: joinedGoals, logo_url: logo_url || null, revenue: revenue || null },
            { where: { id }, transaction }
        );

        // Puesto que unicamente se recibe el nombre de los factores, hay que ver si alguno esta ya presente, si es nuevo o si hay que eliminarlo
        const currentFactors = await Factors.findAll({ where: { organization: id }, transaction });
        const currentFactorNames = currentFactors.map(factor => factor.name);

        const factorsToDelete = currentFactors.filter(factor => !factors.includes(factor.name));
        
        if (factorsToDelete.length > 0) {
            await Factors.destroy({
                where: { id: factorsToDelete.map(factor => factor.id) },
                transaction,
            });
        }

        const factorsToInsert = factors.filter(factor => !currentFactorNames.includes(factor));
        if (factorsToInsert.length > 0) {
            const newFactors = factorsToInsert.map(name => ({
                name,
                organization: id,
            }));
            await Factors.bulkCreate(newFactors, { transaction });
        }

        await transaction.commit();

        res.status(200).json({ message: 'Organization updated successfully' });
    } catch (error) {
        await transaction.rollback();
        console.error('Error updating organization:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function delete_organization(req, res) {

    const { id } = req.params;

    const transaction = await sequelize.transaction();
    try {

        const organization = await Organizations.findOne({ where: { id }, transaction });
        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }
 
        let factors = await Factors.findAll({ where: { organization: id }, attributes:['id'], transaction });
        factors = factors.map(f => f.id);
        if (factors.length > 0) {
            let processes = await ProcessIndicatorFactor.findAll({
            where: { factor: factors },
            attributes: ['process'],
            transaction
            });

            if (processes.length > 0) {
            processes = [...new Set(processes.map(p => p.process))];
            await CalculatedElementMatrixSaaty.destroy({ where: { process: processes }, transaction });
            await CalculatedValuesProcess.destroy({ where: { process: processes }, transaction });
            await CalculatedValuesIndicator.destroy({ where: { process: processes }, transaction });
            await ProcessIndicatorFactor.destroy({ where: { process: processes }, transaction });
            await Process.destroy({ where: { id: processes }, transaction });
            }
        }
        
        await Organizations.destroy({ where: { id }, transaction });

        await transaction.commit();
        
        res.status(200).json({ message: 'Organization deleted successfully' });

    } catch (error) {
        await transaction.rollback();
        console.error('Error deleting organization:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function delete_organizations(req, res) {
    
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Invalid request: ids must be a non-empty array' });
    }

    const transaction = await sequelize.transaction();

    try {
        // Buscar las organizaciones existentes
        const organizations = await Organizations.findAll({ where: { id: ids }, transaction });
        const foundIds = organizations.map(org => org.id);
        const notFoundIds = ids.filter(id => !foundIds.includes(id));

        // Si no se encuentra ningun id
        if (foundIds.length === 0) {
            return res.status(404).json({ error: 'No organizations found for the provided ids ', notFoundIds });
        }

        // Si se encuentran algunos, entonces se eliminan
        if (foundIds.length > 0) {

            let factors = await Factors.findAll({ where: { organization: foundIds }, attributes:['id'], transaction });
            factors = factors.map(f => f.id);
            if (factors.length > 0) {
                let processes = await ProcessIndicatorFactor.findAll({
                where: { factor: factors },
                attributes: ['process'],
                transaction
                });

                if (processes.length > 0) {
                processes = [...new Set(processes.map(p => p.process))];
                await CalculatedElementMatrixSaaty.destroy({ where: { process: processes }, transaction });
                await CalculatedValuesProcess.destroy({ where: { process: processes }, transaction });
                await CalculatedValuesIndicator.destroy({ where: { process: processes }, transaction });
                await ProcessIndicatorFactor.destroy({ where: { process: processes }, transaction });
                await Process.destroy({ where: { id: processes }, transaction });
}
            }
            await Organizations.destroy({ where: { id: foundIds }, transaction });
        }

        await transaction.commit();

        if (notFoundIds.length > 0) {
            res.status(200).json({
                message: 'Some organizations were not found',
                deletedIds: foundIds,
                notFoundIds: notFoundIds,
            });
        } else {
            res.status(200).json({message: 'Organizations deleted successfully'});
        }

    } catch (error) {
        await transaction.rollback();
        console.error('Error deleting organizations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function get_factors_organization(req, res) {

    const { id } = req.params;

    try {
        const factors = await Factors.findAll({ where: { organization: id } });
        if (!factors) {
            return res.status(404).json({ error: 'Factors not found' });
        }
        res.status(200).json(factors);
    } catch (error) {
        console.error('Error fetching factors:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function get_factors_names(id) {
    try {
        const factors = await Factors.findAll({ where: { organization: id }, attributes: ['name'] });
        return factors.map(f => f.name).join(";");
    } catch (error) {
        console.error('Error fetching factors:', error);
        throw new Error('Internal server error');
    }
}

async function get_factors(req, res) {
    try {
        const factors = await Factors.findAll();
        if (!factors) {
            return res.status(404).json({ error: 'Factors not found' });
        }
        res.status(200).json(factors);
    } catch (error) {
        console.error('Error fetching factors:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function get_audits_from_organization(req, res){

    const { id } = req.params;

    try {
        const audits = await Audits.findAll({ where: { organization: id, state: 'Closed' }});
        res.status(200).json({audits});
    } catch (error) {
        console.error('Error fetching audits: ', error);
        res.status(500).json({error: 'Internal server error'})
    }
}


module.exports = {
    get_organizations,
    get_organization,
    create_organization,
    update_organization,
    delete_organization,
    delete_organizations,
    get_factors_organization,
    get_factors,
    get_audits_from_organization
};