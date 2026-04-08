const Processes = require('../models/process.model.js');
const Users = require('../models/user.model.js');
const Factors = require('../models/factor.model.js');
const Audits = require('../models/audit.model.js');
const Organizations = require('../models/organization.model.js');
const Indicators = require('../models/indicator.model.js');
const AuditProcess = require('../models/calculated_value_process.model.js');
const ProcessIndicatorFactor = require('../models/process_indicator_factor.model.js');
const EmailService = require('../services/mailer');
const sequelize = require('../config/sequelize.js');
const handleValidation = require('../validators/handleValidations.js');
const {Op} = require('sequelize');

async function get_processes(req, res) {

    const page = req.query.page ? parseInt(req.query.page) : 1;
    const perPage = req.query.perPage ? parseInt(req.query.perPage) : 5;
    const offset = (page - 1) * perPage;
    const sortBy = req.query.sortBy || 'id';
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';

    const allowedSortFields = ['id', 'name', 'type', 'responsible'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'id';

    const includeDeleted = req.query.includeDeleted === 'true';
    try {
        const { rows: processes, count } = await Processes.findAndCountAll({
            where: includeDeleted ? {} : { deleted_at: null},
            limit: perPage,
            offset: offset,
            order: [[orderField, sortOrder]],
        });

        await Promise.all(
            processes.map(async (proc) => {
                // Indicators
                const indicators = await get_indicators_and_factors_by_process(proc.id);
                proc.dataValues.indicators = indicators;
                // Organization
                const organizationId = indicators[0].dataValues.factor.organization;
                const org = await Organizations.findOne({ where: { id: organizationId }});
                proc.dataValues.organization = org ? {"name": org.name, "id": org.id} : null;
                // Responsible
                const user = await Users.findOne({ where: { id: proc.responsible }});
                proc.dataValues.responsible = user ? user.name : null;
                // Auditorias
                proc.dataValues.edit_process = await can_edit_process(proc);
                proc.dataValues.remove_process = await can_remove_process(proc);
            })
        )
        res.status(200).json({
            data: processes,
            total: count,
            currentPage: page,
            perPage: perPage,
            totalPages: Math.ceil(count / perPage),
            sortBy: orderField,
            sortOrder: sortOrder.toLocaleLowerCase(),
        });
    } catch (error) {
        console.error('Error fetching processes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function get_process(req, res) {

    const { id } = req.params;

    try {
        const process = await Processes.findOne({ where: { id } });
        if (!process) {
            return res.status(404).json({ error: 'Process not found' });
        }
        // Indicators
        const indicators =  await get_indicators_and_factors_by_process(id);
        process.dataValues.indicators = indicators;
        // Organization
        const organizationId = indicators[0].dataValues.factor.organization;
        const org = await Organizations.findOne({ where: { id: organizationId }});
        process.dataValues.organization = org ? {"name": org.name, "id": org.id} : null;
        // Responsible
        const user = await Users.findOne({ where: { id: process.responsible }});
        process.dataValues.responsible = user ? user.name : null;
        res.status(200).json(process);
    } catch (error) {
        console.error('Error fetching process:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function create_process(req, res) {

    if (handleValidation(req, res)) return;
    const { name, description, type, responsible, indicators } = req.body;

    const existingProc = await Processes.findOne({ where: { name, deleted_at: null }});
    if (existingProc) {
        return res.status(406).json({
            errors: {
                name: 'Process name already exists'
            }
        });
    }

    if (!Array.isArray(indicators) || indicators.length < 3) {
        return res.status(400).json({
            errors: { indicators: 'At least 3 indicators are required.' },
        });
    }

    for (const indicator of indicators) {
        if (!indicator.id || !indicator.factor) {
            return res.status(400).json({
                errors: { indicators: 'Each indicator must have an id and a factorId.' },
            });
        }
    }

    const factorIds = [...new Set(indicators.map(i => i.factor))];

    // Validar factores y organización en una sola query
    const factors = await Factors.findAll({ where: { id: factorIds }, attributes: ['id', 'organization']});

    if (factors.length !== factorIds.length) {
        return res.status(400).json({
            errors: { indicators: 'One or more factors do not exist.' }
        });
    }

    const organizationId = factors[0].organization;
    if (!factors.every(f => f.organization === organizationId)) {
        return res.status(400).json({
            errors: { indicators: 'All factors must belong to the same organization.' },
        });
    }

    const transaction = await sequelize.transaction();

    try {

        // Crear proceso
        const newProcess = await Processes.create(
            { name, description, type, responsible },
            { transaction }
        );

        // Construir relaciones process-indicator-factor
        const relations = indicators.map(i => ({
            process: newProcess.id,
            indicator: i.id,
            factor: i.factor
        }));

        // Inserción masiva tolerante a duplicados
        await ProcessIndicatorFactor.bulkCreate(relations, {
            transaction,
            ignoreDuplicates: true
        });

        await transaction.commit();
        
        res.status(201).json({
            id: newProcess.id,
            message: 'Process created successfully',
        });
    
        const user = await Users.findOne({ where: { id: responsible }});
        await sendProcessEmail(user.email, { name, description, type }, 'assignment');

    } catch (error) {
        await transaction.rollback();
        console.error('Error creating process:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function update_process(req, res) {

    if (handleValidation(req, res)) return;

    const { id } = req.params;
    const { name, description, type, responsible, indicators } = req.body;

    if (!Array.isArray(indicators) || indicators.length < 3) {
        return res.status(400).json({
            errors: { indicators: 'At least 3 indicators are required to update a process.' },
        });
    }

    for (const indicator of indicators) {
        if (!indicator.id || !indicator.factor) {
            return res.status(400).json({
                errors: { indicators: 'Each indicator must have an id and a factorId.' },
            })
        }
    }

    // Obtener factores únicos
    const factorIds = [...new Set(indicators.map(i => i.factor))];

    // Validar factores y organización en una sola query
    const factors = await Factors.findAll({ where: { id: factorIds }, attributes: ['id', 'organization']})

    if (factors.length !== factorIds.length) {
        return res.status(400).json({
            errors: { indicators: 'One or more factors do not exist.' }
        });
    }

    const organizationId = factors[0].organization;
    if (!factors.every(f => f.organization === organizationId)) {
        return res.status(400).json({
            errors: { indicators: 'All factors must belong to the same organization.' },
        });
    }

    const transaction = await sequelize.transaction();

    try {
        const existingProcess = await Processes.findOne({ where: { id } })
        if (!existingProcess) {
            return res.status(404).json({ error: 'Process not found' });
        }

        const existingProc = await Processes.findOne({ where: { name, deleted_at: null }});
        if (existingProc && existingProc.id !== existingProcess.id) {
            return res.status(406).json({
                errors: {
                    name: 'Process name already exists'
                }
            });
        }

        const editProcess = await can_edit_process(existingProcess);
        if (!editProcess) {
            return res.status(400).json({
                error: "It isn't possible to update a process which take part in a active audit"
            })
        }

        const oldResponsible = existingProcess.responsible;

        existingProcess.name = name;
        existingProcess.description = description;
        existingProcess.type = type;
        existingProcess.responsible = responsible;

        await existingProcess.save({ transaction });

        // Eliminar relaciones existentes
        await ProcessIndicatorFactor.destroy({
            where: { process: id },
            transaction
        });

        // Construir nuevas relaciones
        const relations = indicators.map(i => ({
            process: id,
            indicator: i.id,
            factor: i.factor
        }));

        // Inserción masiva, ignorando duplicados si existieran
        await ProcessIndicatorFactor.bulkCreate(relations, {
            transaction,
            ignoreDuplicates: true
        });

        await transaction.commit();

        res.status(200).json({
            message: 'Process updated successfully',
        });

        if (oldResponsible !== responsible) {
            const oldUser = await Users.findOne({ where: { id: oldResponsible } });
            const newUser = await Users.findOne({ where: { id: responsible } });
            await sendProcessEmail(oldUser.email, { id, name, type }, 'deassignment');
            await sendProcessEmail(newUser.email, { name, description, type }, 'assignment');
        }

    } catch (error) {
        await transaction.rollback();
        console.error('Error updating process:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function delete_process(req, res) {

    const { id } = req.params;

    const transaction = await sequelize.transaction();

    try {
        const process = await Processes.findOne({ where: { id }, transaction });
        if (!process) {
            return res.status(404).json({ error: 'Process not found' });
        }

        const processInAudits = await AuditProcess.findAll({ where: { process: id }, transaction });
        const dataValues = processInAudits.map(rel => rel.dataValues);
        if (dataValues.length > 0) {
            for (audit_procc of dataValues) {
                const audit = await Audits.findOne({ where: { id: audit_procc.audit }, transaction });
                if (audit.state !== 'Closed' && audit.state !== 'Not evaluated'){
                    await transaction.rollback();
                    return res.status(400).json({ error: 'Can not delete process because it is associated with one or more active audits' });
                }
            }
        }

        await process.update({ deleted_at: new Date() }, { transaction });

        await transaction.commit();

        res.status(200).json({ message: 'Process deleted successfully' });

        const user = await Users.findOne({ where: { id: process.responsible }});
        await sendProcessEmail(user.email, { id, name: process.name, type: process.type }, 'deletion');

    } catch (error) {
        await transaction.rollback();
        console.error('Error deleting process:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function delete_processes(req, res) {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Invalid request: ids must be a non-empty array' });
    }

    const transaction = await sequelize.transaction();

    try {
        // Buscar los procesos existentes
        const processes = await Processes.findAll({ where: { id: ids }, transaction });
        const foundIds = processes.map(proc => proc.id);
        const notFoundIds = ids.filter(id => !foundIds.includes(id));

        if (foundIds.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ error: 'No processes found for the provided ids' });
        }

        // Verificar si hay auditorías que bloquean la eliminación
        const rowWithProcesses = await AuditProcess.findAll({ where: { process: foundIds }, transaction });
        const notPossibleToDeleteIds = [];

        for (const rel of rowWithProcesses) {
            const audit = await Audits.findOne({ where: { id: rel.audit }, transaction });
            if (audit.state !== 'Closed' && audit.state !== 'Not evaluated') {
                notPossibleToDeleteIds.push(rel.process);
            }
        }

        const foundIdsFiltered = foundIds.filter(id => !notPossibleToDeleteIds.includes(id));

        // Soft delete
        if (foundIdsFiltered.length > 0) {
            await Processes.update(
                { deleted_at: new Date() },
                { where: { id: foundIdsFiltered }, transaction }
            );
        }

        await transaction.commit();

        // Preparar respuesta
        const response = {
            deletedIds: foundIdsFiltered,
            notFoundIds,
            notPossibleToDelete: notPossibleToDeleteIds,
        };

        // Enviar emails **fuera de la transacción**
        for (const procId of foundIdsFiltered) {
            const process = processes.find(p => p.id === procId);
            const user = await Users.findOne({ where: { id: process.responsible }});
            if (user) {
                await sendProcessEmail(user.email, { id: procId, name: process.name, type: process.type }, 'deletion');
            }
        }

        if (deletedIds.length > 0){
            res.status(200).json({
                message: 'Processes deleted successfully',
                ...response
            });
        } else {
            res.status(406).json({
                error: 'No process could be deleted',
                ...response
            })
        }

    } catch (error) {
        // Solo rollback si aún no se ha hecho commit
        if (!transaction.finished) {
            await transaction.rollback();
        }
        console.error('Error deleting processes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


async function get_organization_from_process(req, res) {

    const { id } = req.params;

    try {
        const row = await ProcessIndicatorFactor.findOne({ where: { process: id }, attributes: ['factor'] });

        if (!row) {
            return res.status(404).json({ error: 'Process not found' });
        }

        const rowF = await Factors.findOne({ where: { id: row.factor }, attributes: ['organization'] });

        const organization = await Organizations.findOne({ where: { id: rowF.organization } });
        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        res.status(200).json(organization.dataValues);

    } catch (error) {
        console.error('Error fetching organization:', error);
        res.status(500).json({ error: 'Internal server error' });
    }

}

async function get_indicators_from_process(req, res) {
    
    const { id } = req.params;

    try {
        const indicators = await get_indicators_and_factors_by_process(id);
        if (indicators.length === 0) {
            return res.status(404).json({ error: 'No indicators found for this process' });
        }
        res.status(200).json(indicators);
    } catch (error) {
        console.error('Error fetching indicators:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

async function get_indicators_and_factors_by_process(processId) {
    try {
        const rows = await ProcessIndicatorFactor.findAll({ where: { process: processId } });
        const indicators = [];
        for (const row of rows) {
            const indicator = await Indicators.findOne({ where: { id: row.indicator } });
            const factor = await Factors.findOne({ where: { id: row.factor } });
            if (indicator && factor) {
                const ind = indicator;
                ind.dataValues.factor = factor.dataValues;
                indicators.push(ind);
            }
        }
        return indicators;
    } catch (error) {
        console.error('Error fetching indicators:', error);
    }
}

const sendProcessEmail = async (email, processDetails, emailType) => {
    try {
        switch (emailType) {
            case 'assignment':
                // Enviar correo de asignación de proceso
                await EmailService.sendAssignmentProcess(email, processDetails.name, processDetails.description, processDetails.type);
                console.log(`Assignment email sent to ${email}`);
                break;
            
            case 'deassignment':
                // Enviar correo de desasignación de proceso
                await EmailService.sendDeassignmentProcess(email, processDetails.id, processDetails.name, processDetails.type);
                console.log(`Deassignment email sent to ${email}`);
                break;
            
            case 'deletion':
                // Enviar correo de eliminación de proceso
                await EmailService.sendProcessDeletion(email, processDetails.id, processDetails.name, processDetails.type);
                console.log(`Process deletion email sent to ${email}`);
                break;
            
            default:
                console.error('Invalid email type');
        }
    } catch (emailError) {
        console.error('Error sending email:', emailError);
    }
};

async function can_edit_process(process) {
    const audits = await AuditProcess.findAll({ where: { process: process.id }});
    if (audits && audits.length > 0){
        for (const aud of audits){
            const id = aud.dataValues.audit;
            const audit = await Audits.findAll({ where: { id, state: { [Op.notIn]: ['Not Started'] }}});
            if (audit.length > 0){
                return false;
            }
        }
    }
    return true;
};

async function can_remove_process(process) {
    const processInAudits = await AuditProcess.findAll({ where: { process: process.id } });
    const dataValues = processInAudits.map(rel => rel.dataValues);
    if (dataValues.length > 0) {
        // return false;
        for (audit_procc of dataValues) {
            const audit = await Audits.findOne({ where: { id: audit_procc.audit } });
            if (audit.state !== 'Closed' && audit.state !== 'Not evaluated'){
                return false;
            }
        }
    }
    return true;
};

module.exports = {
    get_processes,
    get_process,
    create_process,
    update_process,
    delete_process,
    delete_processes,
    get_organization_from_process,
    get_indicators_from_process,
    get_indicators_and_factors_by_process,
}
