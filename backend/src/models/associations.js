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


Process.belongsToMany(Indicator, { through: ProcessIndicatorFactor, foreignKey: 'process', otherKey: 'indicator', as: 'indicators'});
Indicator.belongsToMany(Process, { through: ProcessIndicatorFactor, foreignKey: 'indicator', otherKey: 'process', as: 'processes'});

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
