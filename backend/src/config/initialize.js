const bcrypt = require('bcrypt');
const User = require('../models/user.model.js');
const Organization = require('../models/organization.model.js');
const Factor = require('../models/factor.model.js');
const Indicator = require('../models/indicator.model.js');
const Process = require('../models/process.model.js');
const ProcessIndicatorFactor = require('../models/process_indicator_factor.model.js');
const Audit = require('../models/audit.model.js');

//temporal
async function initialize() {
    try{
        console.log('Inicializando initialize');
        
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

        // Factores críticos
        const factorNames = [
            'Eficiencia energética',
            'Calidad del producto',
            'Bienestar del talento',
        ];
        const factors = [];
        for (const name of factorNames) {
            const [factor] = await Factor.findOrCreate({
                where: { name, organization: org.id },
                defaults: { name, organization: org.id },
            });
            factors.push(factor);
        }

        // Indicadores
        const indicatorDefs = [
            { name: 'Consumo eléctrico', dimension: 'Ambiental', formula: 'kWh totales en el periodo', goal: 'Minimize', measure: 'kWh', frequency: 'Monthly' },
            { name: 'Densidad de defectos', dimension: 'Técnica', formula: 'Número de defectos / KLOC', goal: 'Minimize', measure: 'def/KLOC', frequency: 'Monthly' },
            { name: 'Cobertura de tests', dimension: 'Técnica', formula: 'Líneas cubiertas / líneas totales * 100', goal: 'Maximize', measure: '%', frequency: 'Weekly' },
        ];
        const indicators = [];
        for (const def of indicatorDefs) {
            const [indicator] = await Indicator.findOrCreate({
                where: { name: def.name },
                defaults: def,
            });
            indicators.push(indicator);
        }

        const admin = await User.findOne({ where: { username: process.env.ADMIN_USERNAME } });

        // Proceso de negocio
        let businessProcess = await Process.findOne({ where: { name: 'Produccion de Software' } });
        if (!businessProcess) {
            businessProcess = await Process.create({
                name: 'Produccion de Software',
                type: 'Key',
                description: 'Desarrollo, testing y entrega de software.',
                responsible: admin.id,
            });
            console.log('Process created');
        }

        // Vincular cada indicador al proceso con su factor critico correspondiente
        const links = [
            { indicator: indicators[0], factor: factors[0] },
            { indicator: indicators[1], factor: factors[1] },
            { indicator: indicators[2], factor: factors[1] },
        ];
        for (const { indicator, factor } of links) {
            await ProcessIndicatorFactor.findOrCreate({
                where: { process: businessProcess.id, indicator: indicator.id, factor: factor.id },
                defaults: { process: businessProcess.id, indicator: indicator.id, factor: factor.id },
            });
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
            });
            console.log('Audit created');
        }

        console.log('Data seed completed.');
    }catch(error){
        console.log("Algo ha pasado en el initialize")
    }

}

module.exports = { initialize };
