const { Op } = require('sequelize');

const Audit = require('../../models/audit.model.js');
const Organization = require('../../models/organization.model.js');
const User = require('../../models/user.model.js');
const FrameworkVersion = require('../../models/framework_version.model.js');
const Framework = require('../../models/framework.model.js');
const Standard = require('../../models/standard.model.js');
const AuditStandard = require('../../models/audit_standard.model.js');
const DisclosureRequirement = require('../../models/disclosure_requirement.model.js');
const DataPoint = require('../../models/data_point.model.js');
const AuditDatapoints = require('../../models/audit_data_points.model.js');

// Devuelve toda la informacion para generar el pdf de la CSRD
async function getReportData(auditId) {
    const id = parseInt(auditId, 10);

    // Auditoria
    const audit = await Audit.findOne({ where: { id } });
    if (!audit) {
        const err = new Error('Audit not found');
        err.statusCode = 404;
        throw err;
    }
    // Organizacion, auditor, creador, frameworkversion
    const [organization, auditor, manager, frameworkVersion] = await Promise.all([
        Organization.findByPk(audit.organization),
        User.findByPk(audit.auditor, { attributes: { exclude: ['password'] } }),
        User.findByPk(audit.manager, { attributes: { exclude: ['password'] } }),
        audit.framework_version_id
            ? FrameworkVersion.findByPk(audit.framework_version_id)
            : null,
    ]);

    const framework = await Framework.findByPk(frameworkVersion.framework_id);

    // Standards de esa version
    const standards = await Standard.findAll({
              where: { framework_version_id: frameworkVersion.id },
              order: [['sort_order', 'ASC']],
          });
    const standardIds = standards.map(s => s.id);

    // Evaluacion de materialidad
    const assessments = await AuditStandard.findAll({ where: { audit_id: id } });
    const assessmentMap = new Map(assessments.map(a => [a.standard_id, a]));

    // Standards con su evaluacion (incluso los no evaluados)
    const materialityStandards = standards.map(s => {
        const a = assessmentMap.get(s.id);
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

    // Standards materiales para el cuestionario
    const materialStandardIds = standards
        .filter(s => {
            const a = assessmentMap.get(s.id);
            return a && a.is_material;
        })
        .map(s => s.id);

    let questionnaireStandards = [];
    if (materialStandardIds.length > 0) {
        const disclosureRequirements = await DisclosureRequirement.findAll({
            where: { standard_id: { [Op.in]: materialStandardIds } },
            order: [['sort_order', 'ASC']],
        });
        const drIds = disclosureRequirements.map(dr => dr.id);

        const dataPoints = await DataPoint.findAll({
                  where: { disclosure_requirement_id: { [Op.in]: drIds } },
                  order: [['id', 'ASC']],
              });
        const dpIds = dataPoints.map(dp => dp.id);

        //Evaluacion de los datapoints
        const auditDatapoints = await AuditDatapoints.findAll({
                  where: { audit_id: id, data_point_id: { [Op.in]: dpIds } },
              });
        const responseMap = new Map(auditDatapoints.map(r => [r.data_point_id, r]));

        // Mapa <DR, [Datapoints de ese DR con su respuesta]>
        const dpsByDrId = new Map();
        for (const dp of dataPoints) {
            if (!dpsByDrId.has(dp.disclosure_requirement_id)) {
                dpsByDrId.set(dp.disclosure_requirement_id, []);
            }
            const saved = responseMap.get(dp.id);
            dpsByDrId.get(dp.disclosure_requirement_id).push({
                id: dp.id,
                official_id: dp.official_id,
                name: dp.name,
                data_type: dp.data_type,
                is_voluntary: dp.is_voluntary,
                is_conditional: dp.is_conditional,
                paragraph_ref: dp.paragraph_ref,
                response: {
                    value_text: saved.value_text,
                    value_numeric: saved.value_numeric,
                    is_applicable: saved.is_applicable,
                    evidence_reference: saved.evidence_reference,
                    status: saved.status,
                    updated_at: saved.updated_at,
                },
            });
        }

        // Mapa <Standard, [DRs con datapoints y sus respuestas]>
        const drsByStandardId = new Map();
        for (const dr of disclosureRequirements) {
            if (!drsByStandardId.has(dr.standard_id)) {
                drsByStandardId.set(dr.standard_id, []);
            }
            drsByStandardId.get(dr.standard_id).push({
                id: dr.id,
                code: dr.code,
                name: dr.name,
                data_points: dpsByDrId.get(dr.id) || [],
            });
        }
        // TEMPORAL
        const isValidated = true;

        // Cuestionario final con solo los standards materiales, sus DRs y DP con respuestas
        questionnaireStandards = standards
            .filter(s => materialStandardIds.includes(s.id))
            .map(s => {
                const drs = (drsByStandardId.get(s.id)).map(dr => {
                    const validated = (dr.data_points).filter(isValidated);
                    return { ...dr, validated_data_points: validated };
                });
                return {
                    id: s.id,
                    code: s.code,
                    name: s.name,
                    category: s.category,
                    disclosure_requirements: drs,
                };
            });
    }

    return {
        audit: {
            id: audit.id,
            name: audit.name,
            description: audit.description,
            init_date: audit.init_date,
            end_date: audit.end_date,
            frequency: audit.frequency,
            state: audit.state,
        },
        organization: {
            id: organization.id,
            name: organization.name,
            description: organization.description,
            country: organization.country,
            sector: organization.sector,
            rangeEmployees: organization.rangeEmployees,
            website: organization.website,
        },
        auditor: { id: auditor.id, name: auditor.name, email: auditor.email } ,
        manager: { id: manager.id, name: manager.name, email: manager.email },
        framework: {
            id: framework.id,
            code: framework.code,
            name: framework.name,
        },
        frameworkVersion: {
            id: frameworkVersion.id,
            version_code: frameworkVersion.version_code,
            version_label: frameworkVersion.version_label,
            effective_date: frameworkVersion.effective_date,
        },
        materiality: { standards: materialityStandards },
        questionnaire: { standards: questionnaireStandards },
    };
}

module.exports = { getReportData };
