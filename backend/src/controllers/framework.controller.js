const crypto = require("crypto");
const { Op } = require("sequelize");
const sequelize = require("../config/sequelize.js");
const Framework = require("../models/framework.model.js");
const FrameworkVersion = require("../models/framework_version.model.js");
const Standard = require("../models/standard.model.js");
const DisclosureRequirement = require("../models/disclosure_requirement.model.js");
const DataPoint = require("../models/data_point.model.js");
const ExcelParser = require("../services/excelParser.js");

const XLSX_MIMETYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const previewStore = new Map();

async function get_frameworks(req, res) {
  const isAdmin =
    req.user.role === "admin" || req.user.role === "chief_auditor";
  try {
    const frameworks = await Framework.findAll({
      where: isAdmin ? undefined : { is_active: true },
      include: [
        {
          model: FrameworkVersion,
          as: "versions",
          where: isAdmin ? undefined : { is_active: true },
          required: false,
          attributes: [
            "id",
            "version_code",
            "version_label",
            "effective_date",
            "is_active",
          ],
        },
      ],
      order: [["name", "ASC"]],
    });
    res.status(200).json(frameworks);
  } catch (error) {
    console.error("Error fetching frameworks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function get_standards_by_version(req, res) {
  const { versionId } = req.params;
  try {
    const standards = await Standard.findAll({
      where: { framework_version_id: versionId },
      order: [["sort_order", "ASC"]],
    });

    const standardIds = standards.map((s) => s.id);

    const drCounts = await DisclosureRequirement.findAll({
      where: { standard_id: { [Op.in]: standardIds } },
      attributes: [
        "standard_id",
        [sequelize.fn("COUNT", sequelize.col("id")), "dr_count"],
      ],
      group: ["standard_id"],
      raw: true,
    });
    const drCountMap = new Map(
      drCounts.map((r) => [r.standard_id, parseInt(r.dr_count, 10)]),
    );

    const drs = await DisclosureRequirement.findAll({
      where: { standard_id: { [Op.in]: standardIds } },
      attributes: ["id", "standard_id"],
      raw: true,
    });
    const drIds = drs.map((d) => d.id);
    const drToStandard = new Map(drs.map((d) => [d.id, d.standard_id]));

    const dpCounts = await DataPoint.findAll({
      where: { disclosure_requirement_id: { [Op.in]: drIds } },
      attributes: [
        "disclosure_requirement_id",
        [sequelize.fn("COUNT", sequelize.col("id")), "dp_count"],
      ],
      group: ["disclosure_requirement_id"],
      raw: true,
    });

    const dpByStandard = new Map();
    for (const row of dpCounts) {
      const stdId = drToStandard.get(row.disclosure_requirement_id);
      if (!stdId) continue;
      dpByStandard.set(
        stdId,
        (dpByStandard.get(stdId) || 0) + parseInt(row.dp_count, 10),
      );
    }

    const result = standards.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      category: s.category,
      is_mandatory: s.is_mandatory,
      sort_order: s.sort_order,
      dr_count: drCountMap.get(s.id) || 0,
      datapoint_count: dpByStandard.get(s.id) || 0,
    }));

    res.status(200).json({ standards: result });
  } catch (error) {
    console.error("Error fetching standards:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function get_standard_detail(req, res) {
  const { standardId } = req.params;
  try {
    const drs = await DisclosureRequirement.findAll({
      where: { standard_id: standardId },
      order: [["sort_order", "ASC"]],
    });

    const drIds = drs.map((dr) => dr.id);

    const dataPoints = await DataPoint.findAll({
      where: { disclosure_requirement_id: { [Op.in]: drIds } },
      order: [["id", "ASC"]],
      attributes: [
        "id",
        "official_id",
        "name",
        "data_type",
        "is_voluntary",
        "is_conditional",
        "paragraph_ref",
        "disclosure_requirement_id",
      ],
    });

    const dpsByDr = new Map();
    for (const dp of dataPoints) {
      if (!dpsByDr.has(dp.disclosure_requirement_id))
        dpsByDr.set(dp.disclosure_requirement_id, []);
      dpsByDr.get(dp.disclosure_requirement_id).push({
        id: dp.id,
        official_id: dp.official_id,
        name: dp.name,
        data_type: dp.data_type,
        is_voluntary: dp.is_voluntary,
        is_conditional: dp.is_conditional,
        paragraph_ref: dp.paragraph_ref,
      });
    }

    const result = drs.map((dr) => ({
      id: dr.id,
      code: dr.code,
      name: dr.name,
      datapoint_count: (dpsByDr.get(dr.id) || []).length,
      data_points: dpsByDr.get(dr.id) || [],
    }));

    res.status(200).json({ disclosure_requirements: result });
  } catch (error) {
    console.error("Error fetching standard detail:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function preview_upload(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  if (req.file.mimetype !== XLSX_MIMETYPE) {
    return res.status(400).json({ error: "Only .xlsx files are allowed" });
  }

  const fwData = {
    code: req.body.fw_code,
    name: req.body.fw_name,
    description: req.body.fw_description || null,
    issuing_body: req.body.fw_issuing_body || null,
  };
  const fvData = {
    version_code: req.body.fv_code,
    version_label: req.body.fv_label,
    effective_date: req.body.fv_effective_date || null,
    source_file: req.file.originalname,
  };

  if (
    !fwData.code ||
    !fwData.name ||
    !fvData.version_code ||
    !fvData.version_label
  ) {
    return res.status(400).json({ error: "Missing required metadata fields" });
  }

  try {
    let parsed;
    try {
      parsed = ExcelParser.parseFramework(req.file.buffer);
    } catch (parseErr) {
      console.error("Excel parse error:", parseErr.message);
      return res
        .status(400)
        .json({ error: "Could not parse Excel file: " + parseErr.message });
    }

    const { standards } = parsed;
    if (!Array.isArray(standards) || standards.length === 0) {
      return res.status(400).json({
        error: "No standards found. Check the file format (EFRAG IG3).",
      });
    }

    const existingFw = await Framework.findOne({
      where: { code: fwData.code },
    });
    let versionConflict = false;
    if (existingFw) {
      const existingFv = await FrameworkVersion.findOne({
        where: {
          framework_id: existingFw.id,
          version_code: fvData.version_code,
        },
      });
      versionConflict = !!existingFv;
    }

    const summary = [];
    let total_drs = 0;
    let total_dps = 0;

    for (const s of standards) {
      const drs = s.disclosureRequirements || [];
      let dpCount = 0;
      for (const dr of drs) {
        dpCount += (dr.dataPoints || []).length;
      }

      summary.push({
        code: s.code,
        name: s.name,
        category: s.category,
        is_mandatory: s.is_mandatory,
        dr_count: drs.length,
        datapoint_count: dpCount,
      });

      total_drs += drs.length;
      total_dps += dpCount;
    }

    const token = crypto.randomUUID();
    previewStore.set(token, {
      framework: fwData,
      frameworkVersion: fvData,
      standards,
      createdAt: Date.now(),
    });

    for (const [k, v] of previewStore.entries()) {
      if (Date.now() - v.createdAt > 30 * 60 * 1000) previewStore.delete(k);
    }

    res.status(200).json({
      token,
      version_conflict: versionConflict,
      summary,
      total_drs,
      total_dps,
    });
  } catch (error) {
    console.error("Error in preview_upload:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function confirm_import(req, res) {
  const { token } = req.params;
  const stored = previewStore.get(token);
  if (!stored) {
    return res.status(404).json({
      error:
        "Preview token not found or expired. Please upload the file again.",
    });
  }

  const {
    framework: frameworkData,
    frameworkVersion: frameworkVersionData,
    standards,
  } = stored;
  const transaction = await sequelize.transaction();

  try {
    const [framework] = await Framework.findOrCreate({
      where: { code: frameworkData.code },
      defaults: {
        name: frameworkData.name,
        description: frameworkData.description,
        issuing_body: frameworkData.issuing_body,
      },
      transaction,
    });

    const [frameworkVersion] = await FrameworkVersion.findOrCreate({
      where: {
        framework_id: framework.id,
        version_code: frameworkVersionData.version_code,
      },
      defaults: {
        version_label: frameworkVersionData.version_label,
        effective_date: frameworkVersionData.effective_date,
        source_file: frameworkVersionData.source_file,
      },
      transaction,
    });

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
    previewStore.delete(token);

    res.status(201).json({
      message: "Framework imported successfully",
      framework_id: framework.id,
      framework_version_id: frameworkVersion.id,
      totals: {
        standards: totalStandards,
        disclosure_requirements: totalDRs,
        data_points: totalDataPoints,
      },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error importing the framework:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function toggle_framework_active(req, res) {
  const { frameworkId } = req.params;
  try {
    const framework = await Framework.findOne({ where: { id: frameworkId } });
    if (!framework) {
      return res.status(404).json({ error: "Framework not found" });
    }
    framework.is_active = !framework.is_active;
    await framework.save();

    if (!framework.is_active) {
      await FrameworkVersion.update(
        { is_active: false },
        { where: { framework_id: frameworkId } },
      );
    }

    res.status(200).json({ id: framework.id, is_active: framework.is_active });
  } catch (error) {
    console.error("Error toggling framework active state:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function toggle_version_active(req, res) {
  const { versionId } = req.params;
  try {
    const version = await FrameworkVersion.findOne({
      where: { id: versionId },
    });
    if (!version) {
      return res.status(404).json({ error: "Framework version not found" });
    }
    version.is_active = !version.is_active;
    await version.save();
    res.status(200).json({ id: version.id, is_active: version.is_active });
  } catch (error) {
    console.error("Error toggling framework version active state:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  get_frameworks,
  get_standards_by_version,
  get_standard_detail,
  preview_upload,
  confirm_import,
  toggle_framework_active,
  toggle_version_active,
};
