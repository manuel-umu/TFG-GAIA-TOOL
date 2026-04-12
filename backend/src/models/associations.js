const Indicator = require('./indicator.model.js');
const Factor = require('./factor.model.js');
const Process = require('./process.model.js');
const Organization = require('./organization.model.js');
const ProcessIndicatorFactor = require('./process_indicator_factor.model.js');
const Audit = require('./audit.model.js');
const User = require('./user.model.js');
const CalculatedValueIndicator = require('./calculated_value_indicator.model.js');
const CalculatedValueProcess = require('./calculated_value_process.model.js');
const CalculatedElementMatrixSaaty = require('./calculated_element_matrix_saaty.model.js');

const Framework = require('./framework.model.js');
const FrameworkVersion = require('./framework_version.model.js');
const Standard = require('./standard.model.js');
const DataPoint = require('./data_point.model.js');
const DisclosureRequirement = require('./disclosure_requirement.model.js');
const AuditDataPoint = require('./audit_data_points.model.js');
const AuditStandard = require('./audit_standard.model.js');


Process.belongsTo(User, { foreignKey: 'responsible' });
User.hasMany(Process, { as: 'responsibleProcesses', foreignKey: 'responsible' });

Audit.belongsTo(User, { foreignKey: 'auditor' });
User.hasMany(Audit, { as: 'auditsAsAuditor', foreignKey: 'auditor' });

Audit.belongsTo(User, { foreignKey: 'manager' });
User.hasMany(Audit, { as: 'auditsAsManager', foreignKey: 'manager' });

Audit.belongsTo(Organization, { foreignKey: 'organization' });
Organization.hasMany(Audit, { as: 'audits', foreignKey: 'organization' });

Factor.belongsTo(Organization, { foreignKey: 'organization' });
Organization.hasMany(Factor, { as: 'factors', foreignKey: 'organization' });

Process.belongsToMany(Indicator, { through: ProcessIndicatorFactor, foreignKey: 'process', otherKey: 'indicator', as: 'indicators' });
Indicator.belongsToMany(Process, { through: ProcessIndicatorFactor, foreignKey: 'indicator', otherKey: 'process', as: 'processes' });

Indicator.belongsToMany(Factor, { through: ProcessIndicatorFactor, foreignKey: 'indicator', otherKey: 'factor', as: 'factors' });
Factor.belongsToMany(Indicator, { through: ProcessIndicatorFactor, foreignKey: 'factor', otherKey: 'indicator', as: 'indicators' });


CalculatedValueIndicator.belongsTo(Audit, { foreignKey: 'audit' });
CalculatedValueIndicator.belongsTo(Process, { foreignKey: 'process' });
CalculatedValueIndicator.belongsTo(Indicator, { foreignKey: 'indicator' });

Audit.hasMany(CalculatedValueIndicator, { foreignKey: 'audit' });
Process.hasMany(CalculatedValueIndicator, { foreignKey: 'process' });
Indicator.hasMany(CalculatedValueIndicator, { foreignKey: 'indicator' });

CalculatedValueProcess.belongsTo(Audit, { foreignKey: 'audit' });
CalculatedValueProcess.belongsTo(Process, { foreignKey: 'process' });

Audit.hasMany(CalculatedValueProcess, { foreignKey: 'audit' });
Process.hasMany(CalculatedValueProcess, { foreignKey: 'process' });

CalculatedElementMatrixSaaty.belongsTo(Audit, { foreignKey: 'audit' });
CalculatedElementMatrixSaaty.belongsTo(Process, { foreignKey: 'process' });
CalculatedElementMatrixSaaty.belongsTo(Indicator, { foreignKey: 'column_ind', as: 'columnIndicator' });
CalculatedElementMatrixSaaty.belongsTo(Indicator, { foreignKey: 'row_ind', as: 'rowIndicator' });

Audit.hasMany(CalculatedElementMatrixSaaty, { foreignKey: 'audit' });
Process.hasMany(CalculatedElementMatrixSaaty, { foreignKey: 'process' });
Indicator.hasMany(CalculatedElementMatrixSaaty, { foreignKey: 'column_ind', as: 'columnElements' });
Indicator.hasMany(CalculatedElementMatrixSaaty, { foreignKey: 'row_ind', as: 'rowElements' });


// Framwork, version, estandar, dr y datapoint entre ellas
Framework.hasMany(FrameworkVersion, { as: 'versions', foreignKey: 'framework_id' });
FrameworkVersion.belongsTo(Framework, { foreignKey: 'framework_id' });

FrameworkVersion.hasMany(Standard, { as: 'standards', foreignKey: 'framework_version_id' });
Standard.belongsTo(FrameworkVersion, { foreignKey: 'framework_version_id' });

Standard.hasMany(DisclosureRequirement, { as: 'disclosureRequirements', foreignKey: 'standard_id' });
DisclosureRequirement.belongsTo(Standard, { foreignKey: 'standard_id' });

DisclosureRequirement.hasMany(DataPoint, { as: 'dataPoints', foreignKey: 'disclosure_requirement_id' });
DataPoint.belongsTo(DisclosureRequirement, { foreignKey: 'disclosure_requirement_id' });

// FrameworkVer con auditoria e indicador con datapoint
Audit.belongsTo(FrameworkVersion, { foreignKey: 'framework_version_id', as: 'frameworkVersion' });
FrameworkVersion.hasMany(Audit, { foreignKey: 'framework_version_id', as: 'audits' });

Indicator.belongsTo(DataPoint, { foreignKey: 'data_point_id', as: 'dataPoint' });
DataPoint.hasMany(Indicator, { foreignKey: 'data_point_id', as: 'indicators' });

// Tabla pivote de auditoria y datapoint
AuditDataPoint.belongsTo(Audit, { foreignKey: 'audit_id' });
AuditDataPoint.belongsTo(DataPoint, { foreignKey: 'data_point_id' });
AuditDataPoint.belongsTo(User, { foreignKey: 'updated_by', as: 'updatedByUser' });

Audit.hasMany(AuditDataPoint, { foreignKey: 'audit_id', as: 'dataPointValues' });
DataPoint.hasMany(AuditDataPoint, { foreignKey: 'data_point_id', as: 'auditValues' });

Audit.belongsToMany(Standard, { through: AuditStandard, foreignKey: 'audit_id', otherKey: 'standard_id', as: 'materialStandards' });
Standard.belongsToMany(Audit, { through: AuditStandard, foreignKey: 'standard_id', otherKey: 'audit_id', as: 'audits' });

AuditStandard.belongsTo(Audit, { foreignKey: 'audit_id' });
AuditStandard.belongsTo(Standard, { foreignKey: 'standard_id' });
AuditStandard.belongsTo(User, { foreignKey: 'assessed_by', as: 'assessor' });

Audit.hasMany(AuditStandard, { foreignKey: 'audit_id', as: 'standardAssessments' });
Standard.hasMany(AuditStandard, { foreignKey: 'standard_id', as: 'auditAssessments' });
