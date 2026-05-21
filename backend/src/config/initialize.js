const bcrypt = require('bcrypt');
const User = require('../models/user.model.js');
const Organization = require('../models/organization.model.js');
const Factor = require('../models/factor.model.js');
const Indicator = require('../models/indicator.model.js');
const Process = require('../models/process.model.js');
const ProcessIndicatorFactor = require('../models/process_indicator_factor.model.js');
const Audit = require('../models/audit.model.js');
const FrameworkVersion = require('../models/framework_version.model.js');
const SourceDocument = require('../models/source_document.model.js');
const DataPointSource = require('../models/data_point_source.model.js');
const sequelize = require('./sequelize.js');
const seedCSRD = require('../seeds/seedCSRD.js');
async function initialize() {
    try{
        console.log('Inicializando initialize');
        await sequelize.sync({ alter: true });
        
        const Framework = require('../models/framework.model.js');
        const existingFramework = await Framework.findOne({ where: { code: 'CSRD' } });
        if (!existingFramework) {
            await seedCSRD.seed();
        } else {
            console.log('Framework CSRD ya existe, seed omitido.');
        }
        const admin = await User.findOne({ where: { username: process.env.ADMIN_USERNAME } });
        // Usuario evaluador de prueba
        let evaluator = await User.findOne({ where: { username: 'ev1' } });
        if (!evaluator) {
            const hashed = await bcrypt.hash('evaluator1', 10);
            evaluator = await User.create({
                username: 'ev1',
                password: hashed,
                name: 'Evaluator1',
                email: 'evaluator@e.com',
                role: 'evaluator_auditor',
            });
            console.log('Evaluador creado');
        }
        // Organización
        let org = await Organization.findOne({ where: { name: 'Empresa1' } });
        if (!org) {
            org = await Organization.create({
                name: 'Empresa1',
                description: 'Empresa de desarrollo.',
                country: 'España',
                sector: 'Software',
                rangeEmployees: '101-250',
                website: 'https://empresa.com',
                goals: 'Reducir huella de carbono',
            });
            console.log('Organization created');
        }

        // Auditoria
        let audit = await Audit.findOne({ where: { name: 'Auditoria1' } });
        if (!audit) {
            audit = await Audit.create({
                name: 'Auditoria1',
                description: 'Auditoria de prueba.',
                init_date: '2026-04-01',
                end_date: '2026-06-30',
                frequency: 'Quarterly',
                state: 'Pending',
                organization: org.id,
                manager: admin.id,
                auditor: evaluator.id,
                framework_version_id: 1,
                reporting_year: 2025,
            });
            console.log('Audit created.');
        }

        console.log('Data seed completed.');
    }catch(error){
        console.log("Algo ha pasado en el initialize");
        console.log("  Mensaje:", error.message);
        if (error.errors) {
            // SequelizeValidationError / UniqueConstraintError trae array con detalles por campo
            error.errors.forEach(e => console.log(`  Campo: ${e.path}, valor: ${e.value}, motivo: ${e.message}`));
        }
        console.log("  Stack:", error.stack);
    }

}

module.exports = { initialize };
