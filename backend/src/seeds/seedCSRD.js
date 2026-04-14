'use strict';

require('dotenv').config();
const path = require('path');

const sequelize = require('../config/sequelize.js');

require('../models/user.model.js');
require('../models/organization.model.js');
require('../models/indicator.model.js');
require('../models/factor.model.js');
require('../models/process.model.js');
require('../models/audit.model.js');
require('../models/process_indicator_factor.model.js');
require('../models/calculated_value_indicator.model.js');
require('../models/calculated_value_process.model.js');
require('../models/calculated_element_matrix_saaty.model.js');
const Framework = require('../models/framework.model.js');
const FrameworkVersion = require('../models/framework_version.model.js');
const Standard = require('../models/standard.model.js');
const DisclosureRequirement = require('../models/disclosure_requirement.model.js');
const DataPoint = require('../models/data_point.model.js');

require('../models/audit_data_points.model.js');
require('../models/audit_standard.model.js');

// Las asocizaciones deben ir ultimo
require('../models/associations.js');

const ExcelParser = require('../services/excelParser.js');

// TODO: Temporal
const EXCEL_PATH = path.resolve(__dirname, '..', '..', '..', 'ignore', 'EFRAG IG 3 List of ESRS Data Points (1) (1).xlsx');

async function seed() {
  console.log('Iniciando seed de datos EFRAG...');
  console.log('Ruta del Excel:', EXCEL_PATH);

  let parseado;
  try {
    parseado = ExcelParser.parse(EXCEL_PATH);
  } catch (err) {
    console.error('Error al parsear el Excel:', err.message);
    process.exit(1);
  }

  const { framework: frameworkData, frameworkVersion: frameworkVersionData, standards } = parseado;

  console.log(`Excel parseado: ${standards.length} standards encontrados en el Excel.`);

  // Crear tablas si no existen
  await sequelize.sync();

  const transaction = await sequelize.transaction();

  try {
    // Framework
    const [framework, fwCreated] = await Framework.findOrCreate({
      where: { code: frameworkData.code },
      defaults: {
        name: frameworkData.name,
        description: frameworkData.description,
        issuing_body: frameworkData.issuing_body,
      },
      transaction,
    });
    console.log(`Framework "${framework.code}" — ${fwCreated ? 'creado' : 'ya existía'} (id: ${framework.id})`);

    // FrameworkVersion
    const [frameworkVersion, fvCreated] = await FrameworkVersion.findOrCreate({
      where: { framework_id: framework.id, version_code: frameworkVersionData.version_code },
      defaults: {
        version_label: frameworkVersionData.version_label,
        effective_date: frameworkVersionData.effective_date,
        source_file: frameworkVersionData.source_file,
      },
      transaction,
    });
    console.log(`FrameworkVersion: "${frameworkVersion.version_code}" — ${fvCreated ? 'creada' : 'ya existía'} (id: ${frameworkVersion.id})`);
    
    await transaction.commit();
    process.exit(0);
  } catch (err) {
    await transaction.rollback();
    console.error('Error durante el seed, se ha hecho rollback de la transaccion:', err);
    process.exit(1);
  }
}

seed();
