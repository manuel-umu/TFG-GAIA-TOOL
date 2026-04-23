const { Op } = require('sequelize'); // Asegúrate de importarlo arriba
const sequelize = require('../config/sequelize.js');
const handleValidation = require('../validators/handleValidations.js');
const Audits = require('../models/audit.model.js');
const Process = require('../models/process.model.js');
const Organizations = require('../models/organization.model.js');
const Users = require('../models/user.model.js')
const AuditProcessIndicator = require('../models/calculated_value_indicator.model.js');
const AuditProcessMatrix = require('../models/calculated_element_matrix_saaty.model.js');
const AuditProcess = require('../models/calculated_value_process.model.js');
const EmailService = require('../services/mailer');
const { get_indicators_and_factors_by_process } = require('./process.controller.js');
const Standard = require('../models/standard.model.js');
const AuditStandard = require('../models/audit_standard.model.js');
const FrameworkVersion = require('../models/framework_version.model.js');
const Framework = require('../models/framework.model.js');

async function get_audits(req, res) {
    
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const perPage = req.query.perPage ? parseInt(req.query.perPage) : 5;
    const offset = (page - 1) * perPage;
    const sortBy = req.query.sortBy || 'id';
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';

    const allowedSortFields = ['id', 'name', 'init_date', 'end_date', 'frequency', 'state'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'id';
    
    const statesFilter = req.query.states ? req.query.states.split(',') : null;

    try {

        const where = {};

        if (statesFilter && statesFilter.length > 0) {
            where.state = { [Op.or]: statesFilter };
        }
        const { rows: audits, count } = await Audits.findAndCountAll({
            where,
            limit: perPage,
            offset: offset,
            order: [[orderField, sortOrder]],
        });

        const auditsWithDetails = await addAuditDetails(audits);

        res.status(200).json({
            data: auditsWithDetails,
            total: count,
            currentPage: page,
            perPage: perPage,
            totalPages: Math.ceil(count / perPage),
            sortBy: orderField,
            sortOrder: sortOrder.toLocaleLowerCase(),
        });
    } catch (error) {
        console.error('Error fetching audits:', error);
        return res.status(500).json({ message: 'Error in the server' });
    }
}

async function get_my_audits(req, res) {
    
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const perPage = req.query.perPage ? parseInt(req.query.perPage) : 5;
    const offset = (page - 1) * perPage;
    const sortBy = req.query.sortBy || 'id';
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';

    const allowedSortFields = ['id', 'name', 'init_date', 'end_date', 'frequency', 'state'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'id';
    
    try {
        const user = req.user;

        const { rows: audits, count } = await Audits.findAndCountAll({
            where: { manager: user.id},
            limit: perPage,
            offset: offset,
            order: [[orderField, sortOrder]],
        });

        const auditsWithDetails = await addAuditDetails(audits);

        res.status(200).json({
            data: auditsWithDetails,
            total: count,
            currentPage: page,
            perPage: perPage,
            totalPages: Math.ceil(count / perPage),
            sortBy: orderField,
            sortOrder: sortOrder.toLocaleLowerCase(),
        });
    } catch (error) {
        console.error('Error fetching audits:', error);
        return res.status(500).json({ message: 'Error in the server' });
    }
}

async function get_assigned_audits(req, res) {
    
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const perPage = req.query.perPage ? parseInt(req.query.perPage) : 5;
    const offset = (page - 1) * perPage;
    const sortBy = req.query.sortBy || 'id';
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';

    const allowedSortFields = ['id', 'name', 'init_date', 'end_date', 'frequency', 'state'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'id';
    
    try {
        const user = req.user;
        const { rows: audits, count } = await Audits.findAndCountAll({
            where: { 
                auditor: user.id,
            },
            limit: perPage,
            offset: offset,
            order: [[orderField, sortOrder]],
        });

        const auditsWithDetails = await addAuditDetails(audits);

        res.status(200).json({
            data: auditsWithDetails,
            total: count,
            currentPage: page,
            perPage: perPage,
            totalPages: Math.ceil(count / perPage),
            sortBy: orderField,
            sortOrder: sortOrder.toLocaleLowerCase(),
        });
    } catch (error) {
        console.error('Error fetching audits:', error);
        return res.status(500).json({ message: 'Error in the server' });
    }
}

async function get_audit(req, res) {
    const { id } = req.params;

    try {
        const audit = await Audits.findOne({ where: { id } });
        if (!audit) {
            return res.status(404).json({ error: 'Audit not found' });
        }

        let processes = await AuditProcess.findAll({ where: { audit: id }, attributes: ['process', 'sustainability_index'] });
        audit.dataValues.processes = processes.map(p => p.process);
        
        const state = audit.state;

        let results = {};

        if (state !== 'Evaluated' && state !== 'Closed') {
            return res.status(200).json({
                audit,
                results
            });
        }

        results = {
            coefficient: audit.coefficient,
            processes: []
        };

        for (const proc of processes) {

            const indicators = await AuditProcessIndicator.findAll({
                where: {
                    audit: id,
                    process: proc.process
                }
            });

            const matrix = await AuditProcessMatrix.findAll({
                where: {
                    audit: id,
                    process: proc.process
                }
            });

            results.processes.push({
            process: proc.process,
            sustainability_index: Number(proc.sustainability_index),
            indicators: indicators.map(i => ({
                id: i.indicator,
                real_value: Number(i.real_value),
                ideal_value: Number(i.ideal_value),
                normalized_value: Number(i.normalized_value),
                weight: Number(i.weight)
            })),
            matrix
            });
        }

        return res.status(200).json({
            audit,
            results
        });

    } catch (error) {
        console.error('Error fetching audit:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

async function create_audit(req, res) {

    if (handleValidation(req, res)) return;

    const { name, description, auditor, manager, init_date, end_date, frequency, organization, processes, framework_version_id } = req.body;

    let transaction = undefined;
    let processes_ids = processes;

    try {

        const existingAudit = await Audits.findOne({ where: { name } });
        if (existingAudit) {
            return res.status(406).json({
                errors: {
                    name: 'Audits with this name already exists'
                }
            });
        }

        const existingOrganization = await Organizations.findOne({ where: { id: organization } });
        if (!existingOrganization) {
            return res.status(404).json({
                message: 'Organization not found',
            });
        }

        for (const proc of processes_ids) {
            const processExists = await Process.findOne({ where: { id: proc } });
            if (!processExists) {
                return res.status(404).json({
                    message: `Process with id ${proc} not found`,
                });
            }
        }

        const validFrequencies = ["Daily", "Weekly", "Monthly", "Quarterly", "Annual"];
        if (!validFrequencies.includes(frequency)) {
            return res.status(400).json({
                errors: {
                    frequency: 'Invalid frequency value'
                }
            });
        }

        let state = 'Not started';
        // Convertimos ambas fechas a YYYY-MM-DD para ignorar horas
        const initDate = new Date(init_date);
        const today = new Date();
        // Convertimos ambas fechas a YYYY-MM-DD para ignorar horas
        const initDateStr = initDate.toISOString().split('T')[0];
        const todayStr = today.toISOString().split('T')[0];

        if (initDateStr <= todayStr) {
        state = 'Pending';
        }

        transaction = await sequelize.transaction();

        const newAudit = await Audits.create({ name, description, auditor, manager, init_date, end_date, frequency, state, organization: organization, framework_version_id: framework_version_id || null }, { transaction });


        for (const proc of processes_ids) {
            await AuditProcess.create({ audit: newAudit.id, process: proc }, { transaction });
        }

        await transaction.commit();

        res.status(201).json({
            id: newAudit.id,
            message: 'Audit created successfully',
        });

    } catch (error) {
        if (transaction != undefined) {
            await transaction.rollback();
        }
        console.error("Error creating audit:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }

    try {
        const user = await Users.findOne({ where: { id: auditor }});
        const managerUser = await Users.findOne({ where: { id: manager }});
        await EmailService.sendEvaluatorAssignment(user.email, name, description, init_date, end_date, managerUser.name);
    } catch (emailError) {
        console.error('Error sending email:', emailError);
    }

}

async function update_audit(req, res) {

    if (handleValidation(req, res)) return;

    const { id } = req.params;

    const { name, description, auditor, manager, init_date, end_date, frequency, organization, processes, framework_version_id } = req.body;

    let transaction = undefined;

    try {
        const audit = await Audits.findOne({ where: { id } });
        if (!audit) {
            return res.status(404).json({ error: 'Audit not found' });
        }

        const oldEvaluator = audit.auditor;
        const currentDate = new Date();
        const startDate = new Date(init_date);

        // Comprobar si la fecha de inicio es menor que la fecha actual
        if (startDate < currentDate) {
            return res.status(400).json({
                error: 'The audit has already started and can not be edited.',
            });
        }

        const validFrequencies = ["Daily", "Weekly", "Monthly", "Quarterly", "Annual"];
        if (!validFrequencies.includes(frequency)) {
            return res.status(400).json({ errors: { frequency: 'Invalid frequency value'} });
        }

        const existingOrganization = await Organizations.findOne({ where: { id: organization } });
        if (!existingOrganization) {
            return res.status(404).json({
                message: 'Organization not found',
            });
        }

        for (const proc of processes) {
            const processExists = await Process.findOne({ where: { id: proc } });
            if (!processExists) {
                return res.status(404).json({
                    message: `Process with id ${proc} not found`,
                });
            }
        }

        transaction = await sequelize.transaction();

        await Audits.update(
            { name, description, auditor, manager, init_date, end_date, frequency, organization, framework_version_id: framework_version_id || null },
            { where: { id }, transaction }
        );

        // Eliminar procesos asociados
        await AuditProcess.destroy({ where: { audit: id }, transaction });

        // Agregar nuevos procesos
        if (processes && processes.length > 0) {
            const auditProcesses = processes.map(proc => ({ audit: id, process: proc }));
            await AuditProcess.bulkCreate(auditProcesses, { transaction });
        }

        await transaction.commit();

        res.status(200).json({ message: 'Audit updated successfully' });

        if (oldEvaluator !== auditor) {
            try {
                const oldEvaluatorUser = await Users.findOne({ where: { id: oldEvaluator }});
                const newEvaluatorUser = await Users.findOne({ where: { id: auditor }});
                const managerUser = await Users.findOne({ where: { id: manager }});
                await EmailService.sendEvaluatorDeassignment(oldEvaluatorUser.email, id, name, init_date, end_date, managerUser.name);
                await EmailService.sendEvaluatorAssignment(newEvaluatorUser.email, name, description, init_date, end_date, managerUser.name);
            } catch (error) {
                console.error('Error sending email to new evaluator:', error);
            }
        }

    } catch (error) {
        if (transaction != undefined) await transaction.rollback();
        console.error('Error updating audit:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

async function delete_audit(req, res) {

    const { id } = req.params;

    const transaction = await sequelize.transaction();

    try {
        const audit = await Audits.findOne({ where: { id } });
        if (!audit) {
            return res.status(404).json({ error: 'Audit not found' });
        }

        const auditProcesses = await AuditProcess.findAll({
            where: { audit: id },
            attributes: ['process'],
            transaction
        });

        const processIds = auditProcesses.map(ap => ap.process);

        let deletedProcessIds = [];

        if (processIds.length > 0) {
            const deletedProcesses = await Process.findAll({
                where: {
                    id: processIds,
                    deleted_at: { [Op.not]: null }
                },
                attributes: ['id'],
                transaction
            });

            deletedProcessIds = deletedProcesses.map(p => p.id);
        }

        if (deletedProcessIds.length > 0) {
            await ProcessIndicatorFactor.destroy({
                where: { process: deletedProcessIds },
                transaction
            });
        }
        await Audits.destroy({ where: { id }, transaction });

        await transaction.commit();

        res.status(200).json({ message: 'Audit deleted successfully' });

        try {
            const user = await Users.findOne({ where: { id: audit.auditor }});
            await EmailService.sendAuditDeletion(user.email, id, audit.name, audit.init_date, audit.end_date);
        } catch (emailError) {
            console.error('Error sending email:', emailError);
        }

    } catch (error) {
        await transaction.rollback();
        console.error('Error deleting audit:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }

}

async function evaluate_audit(req, res) {

    const { id } = req.params;
    const { processes, matrix } = req.body;

    try {
        for (const proc of processes) {
            for (const i of proc.indicators) {
                if (typeof i.real_value !== 'number' || typeof i.ideal_value !== 'number') {
                    return res.status(400).json({ errors: { indicators: 'Indicators real and ideal values must be numbers' } });
                }
            }
        }
        for (const matKey of Object.keys(matrix)) {
            const m = matrix[matKey];
            for (const f of m) {
                for (const e of f) {
                    if (typeof e !== 'number') {
                        return res.status(400).json({ errors: { matrix_satty: 'The elements of Satty matrix must be numbers' } });
                    }
                }
            }
        }
    } catch (error) {
        return res.status(400).json({ error: 'Invalid arguments' });
    }

    const transaction = await sequelize.transaction();

    try {

        // ===========================
        // 1. Normalización de valores
        // ===========================
        let normalized_value;

        for (const proc of processes) {
            for (const i of proc.indicators) {
                if (i.goal.toLowerCase() === 'maximize') {
                    if (i.ideal_value !== 0) {
                        normalized_value = i.real_value / i.ideal_value;
                        if (normalized_value > 1) normalized_value = 1;
                        i.normalized_value = normalized_value;
                    } else {
                        await transaction.rollback();
                        return res.status(400).json({ error: `Illegal argument: Ideal value of indicator ${i.id} can't be 0` });
                    }
                } else if (i.goal.toLowerCase() === 'minimize') {
                    if (i.real_value !== 0) {
                        normalized_value = i.ideal_value / i.real_value;
                        if (normalized_value > 1) normalized_value = 1;
                        i.normalized_value = normalized_value;
                    } else {
                        if (i.ideal_value == 0) {
                            normalized_value = 1;
                            i.normalized_value = normalized_value;
                        } else {
                            await transaction.rollback();
                            return res.status(400).json({ error: `Illegal argument: The real value of indicator ${i.id} can't be 0 if its ideal value isn't 0.` });
                        }
                    }
                }

                const relations = await AuditProcessIndicator.findAll({
                    where: {
                        audit: id,
                        process: proc.id,
                        indicator: i.id,
                    },
                    transaction
                });

                if (relations.length > 0) {
                    await AuditProcessIndicator.destroy({
                        where: {
                            audit: id,
                            process: proc.id,
                            indicator: i.id,
                        },
                        transaction
                    });
                }

                await AuditProcessIndicator.create({
                    audit: id,
                    process: proc.id,
                    indicator: i.id,
                    real_value: i.real_value,
                    ideal_value: i.ideal_value,
                    normalized_value
                }, { transaction });
            }
        }

        // ===========================
        // 2. Cálculo de pesos + índices (AHP - Saaty)
        // ===========================
        for (const processName of Object.keys(matrix)) {
            const mat = matrix[processName];
            const proc = processes.find(p => p.name === processName);

            if (!proc) {
                await transaction.rollback();
                return res.status(400).json({ error: `Process '${processName}' not found in processes array` });
            }

            const n = mat.length;

            if (proc.indicators.length !== n) {
                await transaction.rollback();
                return res.status(400).json({
                    error: `Matrix size (${n}) does not match number of indicators (${proc.indicators.length}) for process ${processName}`
                });
            }

            // ---------- AHP real ----------

            // Paso 1: sumar columnas
            const colSums = Array(n).fill(0);
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    colSums[j] += mat[i][j];
                }
            }

            // Paso 2: normalizar columnas y acumular filas
            proc.indicators.forEach(ind => ind.weight = 0);

            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    const normalized = mat[i][j] / colSums[j];
                    proc.indicators[i].weight += normalized;

                    await AuditProcessMatrix.destroy({
                        where: {
                            audit: parseInt(id, 10),
                            process: proc.id,
                            column_ind: proc.indicators[i].id,
                            row_ind: proc.indicators[j].id,
                        },
                        transaction
                    });

                    await AuditProcessMatrix.create({
                        audit: parseInt(id, 10),
                        process: proc.id,
                        column_ind: proc.indicators[i].id,
                        row_ind: proc.indicators[j].id,
                        element: mat[i][j]
                    }, { transaction });
                }
            }

            // Paso 3: promediar filas
            for (let i = 0; i < n; i++) {
                proc.indicators[i].weight /= n;
            }

            // ---------- Fin AHP ----------

            // 2.4 Índice de sostenibilidad del proceso
            let indiceSup = 0;
            proc.indicators.forEach(ind => {
                indiceSup += ind.normalized_value * ind.weight;
            });
            proc.index = indiceSup;
        }

        // ===========================
        // 3. Persistencia de resultados
        // ===========================
        for (const proc of processes) {
            await AuditProcess.update(
                { sustainability_index: proc.index },
                { where: { audit: id, process: proc.id }, transaction }
            );

            for (const i of proc.indicators) {
                await AuditProcessIndicator.update(
                    { weight: parseFloat(i.weight.toFixed(2)) },
                    {
                        where: {
                            audit: parseInt(id, 10),
                            process: proc.id,
                            indicator: i.id
                        },
                        transaction
                    }
                );
            }
        }

        // ===========================
        // 4. Coeficiente global
        // ===========================
        const process_length = processes.length;
        let indexes = 0;
        for (const p of processes) {
            indexes += p.index;
        }

        const coeff = indexes / process_length;
        const results = {
            coefficient: coeff,
            processes
        };

        await Audits.update(
            { state: 'Evaluated', coefficient: coeff },
            { where: { id }, transaction }
        );

        const audit = await Audits.findOne({ where: { id } });

        await transaction.commit();

        res.status(200).json({ message: 'Audit evaluated successfully', results });

        const user = await Users.findOne({ where: { id: audit.manager } });
        await EmailService.sendAuditEvaluatedNotification(user.email, id, audit.name);

    } catch (error) {
        await transaction.rollback();
        console.error('Error evaluating audit:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }

}


async function close_audit(req, res) {
    const { id } = req.params;

    try {
        const audit = await Audits.findOne({ where: { id } });
        if (!audit) {
            return res.status(404).json({ error: 'Audit not found' });
        }
        if (audit.state !== 'Evaluated') {
            return res.status(400).json({ error: 'Only evaluated audits can be closed' });
        }
        await Audits.update(
            { state: 'Closed' },
            { where: { id } }
        );

        res.status(200).json({ message: 'Audit closed successfully' });

        const user = await Users.findOne({ where: { id: audit.auditor }});
        await EmailService.sendAuditCloseNotification(user.email, id, audit.name);

    } catch (error) {
        console.error('Error closing audit:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

async function addAuditDetails(audits) {
    await Promise.all(
        audits.map(async (aud) => {
            // Obtener usuario evaluador
            const evaluator_user = await Users.findOne({ where: {id: aud.auditor} });
            aud.dataValues.auditor = evaluator_user ? evaluator_user.name : null;
            // Obtener usuario manager
            const manager_user = await Users.findOne({ where: {id: aud.manager} });
            aud.dataValues.manager = manager_user ? manager_user.name : null;
            // Obtener organizacion
            const org = await Organizations.findOne({ where: {id: aud.organization} });
            aud.dataValues.organization = org ? org.name : null;
            // Comprobar si la evaluacion de materialidad esta completa
            if (!aud.framework_version_id) {
                aud.dataValues.materiality_complete = false;
                aud.dataValues.framework_code = null;
            } else {
                const totalStandards = await Standard.count({ where: { framework_version_id: aud.framework_version_id } });
                const assessedStandards = await AuditStandard.count({ where: { audit_id: aud.id } });
                aud.dataValues.materiality_complete = totalStandards > 0 && assessedStandards >= totalStandards;
                const fv = await FrameworkVersion.findOne({ where: { id: aud.framework_version_id } });
                if (fv) {
                    const fw = await Framework.findOne({ where: { id: fv.framework_id } });
                    aud.dataValues.framework_code = fw ? fw.code : null;
                } else {
                    aud.dataValues.framework_code = null;
                }
            }
        })
    );
    return audits;
};

async function get_processes_from_audit(req, res) {
    const { id } = req.params;

    try {
        const auditProcess = await AuditProcess.findAll({ where: { audit: id }});

        if (auditProcess.length === 0) {
            return res.status(404).json({ error: 'No processes found for this audit' });
        }

        const processes = await Promise.all(
            auditProcess.map(async (process) => {
                const processId = process.dataValues.process;
                const detailsProcess = await Process.findOne({ where: { id: processId } });
                const indicators = await get_indicators_and_factors_by_process(processId);
                return {
                    processId: detailsProcess.id,
                    processName: detailsProcess.name,
                    processIndex: process.dataValues.sustainability_index,
                    indicators: indicators,
                }
            }
        ));

        res.status(200).json(processes);

    } catch (error) {
        console.error('Error fetching processes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    get_audits,
    get_my_audits,
    get_assigned_audits,
    create_audit,
    get_audit,
    delete_audit,
    update_audit,
    evaluate_audit,
    close_audit,
    get_processes_from_audit,
};
