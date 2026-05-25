"use strict";

require("dotenv").config();
const path = require("path");

const sequelize = require("../config/sequelize.js");

require("../models/user.model.js");
require("../models/organization.model.js");
require("../models/indicator.model.js");
require("../models/factor.model.js");
require("../models/process.model.js");
require("../models/audit.model.js");
require("../models/process_indicator_factor.model.js");
require("../models/calculated_value_indicator.model.js");
require("../models/calculated_value_process.model.js");
require("../models/calculated_element_matrix_saaty.model.js");
const Framework = require("../models/framework.model.js");
const FrameworkVersion = require("../models/framework_version.model.js");
const Standard = require("../models/standard.model.js");
const DisclosureRequirement = require("../models/disclosure_requirement.model.js");
const DataPoint = require("../models/data_point.model.js");

require("../models/audit_data_points.model.js");
require("../models/audit_standard.model.js");

// Las asociaciones deben ir ultimo
require("../models/associations.js");

const ExcelParser = require("../services/excelParser.js");

// TODO: Temporal
const EXCEL_PATH = path.resolve(__dirname, "..", "csrd", "datapoints.xlsx");

// Metadatos del framework para el seed (en el upload por UI estos los aporta el formulario)
const FRAMEWORK_DATA = {
  code: "CSRD",
  name: "Corporate Sustainability Reporting Directive",
  description:
    "EU Directive 2022/2464 requiring large companies to report on sustainability matters",
  issuing_body: "European Union",
};
const FRAMEWORK_VERSION_DATA = {
  version_code: "ESRS-SET1-2024",
  version_label: "ESRS Set 1 - 2024",
  effective_date: "2024-01-01",
  source_file: "EFRAG IG 3 List of ESRS Data Points",
};

async function seed() {
  console.log("Iniciando seed de datos EFRAG...");
  console.log("Ruta del Excel:", EXCEL_PATH);

  let parseado;
  try {
    parseado = ExcelParser.parse(EXCEL_PATH);
  } catch (err) {
    console.error("Error al parsear el Excel:", err.message);
    process.exit(1);
  }

  const { standards } = parseado;
  console.log(
    `Excel parseado: ${standards.length} standards encontrados en el Excel.`,
  );

  await sequelize.sync();

  const transaction = await sequelize.transaction();

  try {
    const [framework, fwCreated] = await Framework.findOrCreate({
      where: { code: FRAMEWORK_DATA.code },
      defaults: {
        name: FRAMEWORK_DATA.name,
        description: FRAMEWORK_DATA.description,
        issuing_body: FRAMEWORK_DATA.issuing_body,
      },
      transaction,
    });
    console.log(
      `Framework "${framework.code}" — ${fwCreated ? "creado" : "ya existía"} (id: ${framework.id})`,
    );

    const [frameworkVersion, fvCreated] = await FrameworkVersion.findOrCreate({
      where: {
        framework_id: framework.id,
        version_code: FRAMEWORK_VERSION_DATA.version_code,
      },
      defaults: {
        version_label: FRAMEWORK_VERSION_DATA.version_label,
        effective_date: FRAMEWORK_VERSION_DATA.effective_date,
        source_file: FRAMEWORK_VERSION_DATA.source_file,
      },
      transaction,
    });
    console.log(
      `FrameworkVersion: "${frameworkVersion.version_code}" — ${fvCreated ? "creada" : "ya existía"} (id: ${frameworkVersion.id})`,
    );

    let totalStandards = 0;
    let totalDRs = 0;
    let totalDataPoints = 0;

    for (const standardData of standards) {
      const [standard, stdCreated] = await Standard.findOrCreate({
        where: {
          framework_version_id: frameworkVersion.id,
          code: standardData.code,
        },
        defaults: {
          name: standardData.name,
          description: standardData.description,
          category: standardData.category,
          is_mandatory: standardData.is_mandatory,
          sort_order: standardData.sort_order,
        },
        transaction,
      });
      if (stdCreated) totalStandards++;

      for (const drData of standardData.disclosureRequirements) {
        const [dr, drCreated] = await DisclosureRequirement.findOrCreate({
          where: { standard_id: standard.id, code: drData.code },
          defaults: {
            name: drData.name,
            sort_order: drData.sort_order,
          },
          transaction,
        });
        if (drCreated) totalDRs++;

        for (const dpData of drData.dataPoints) {
          const [, dpCreated] = await DataPoint.findOrCreate({
            where: { official_id: dpData.official_id },
            defaults: {
              disclosure_requirement_id: dr.id,
              name: dpData.name,
              paragraph_ref: dpData.paragraph_ref,
              related_ar: dpData.related_ar,
              data_type: dpData.data_type,
              is_voluntary: dpData.is_voluntary,
              is_conditional: dpData.is_conditional,
              phased_in_750: dpData.phased_in_750,
              phased_in_appendix_c: dpData.phased_in_appendix_c,
              cross_reference: dpData.cross_reference,
              link: dpData.link,
            },
            transaction,
          });
          if (dpCreated) totalDataPoints++;
        }
      }
    }
    await transaction.commit();

    console.log("");
    console.log("Seed completado con exito:");
    console.log(`  Standards insertados:              ${totalStandards}`);
    console.log(`  DisclosureRequirements insertados: ${totalDRs}`);
    console.log(`  DataPoints insertados:             ${totalDataPoints}`);
  } catch (err) {
    await transaction.rollback();
    console.error(
      "Error durante el seed, se ha hecho rollback de la transaccion:",
      err,
    );
    throw err;
  }
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seed };
