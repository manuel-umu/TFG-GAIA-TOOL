const Audit = require("../models/audit.model.js");
const AuditStandard = require("../models/audit_standard.model.js");
const Standard = require("../models/standard.model.js");
const DisclosureRequirement = require("../models/disclosure_requirement.model.js");
const DataPoint = require("../models/data_point.model.js");
const AuditDatapoints = require("../models/audit_data_points.model.js");

async function get_questionnaire(req, res) {
  const { id } = req.params;
  try {
    const audit = await Audit.findOne({ where: { id } });
    if (!audit) return res.status(404).json({ error: "Audit not found" });

    const materialAssessments = await AuditStandard.findAll({
      where: { audit_id: id, is_material: true },
    });
    const materialStandardIds = materialAssessments.map((a) => a.standard_id);

    const standards = await Standard.findAll({
      where: { id: materialStandardIds },
      order: [["sort_order", "ASC"]],
    });

    const disclosureRequirements = await DisclosureRequirement.findAll({
      where: { standard_id: materialStandardIds },
      order: [["sort_order", "ASC"]],
    });

    const dataPoints = await DataPoint.findAll({
      where: {
        disclosure_requirement_id: disclosureRequirements.map((dr) => dr.id),
      },
      order: [["id", "ASC"]],
    });

    const auditDatapoints = await AuditDatapoints.findAll({
      where: { audit_id: id, data_point_id: dataPoints.map((dp) => dp.id) },
    });

    const responseMap = new Map(
      auditDatapoints.map((r) => [r.data_point_id, r]),
    );

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
        phased_in_750: dp.phased_in_750,
        phased_in_appendix_c: dp.phased_in_appendix_c,
        paragraph_ref: dp.paragraph_ref,
        related_ar: dp.related_ar,
        cross_reference: dp.cross_reference,
        link: dp.link,
        response: saved
          ? {
              value_text: saved.value_text,
              is_applicable: saved.is_applicable,
              evidence_reference: saved.evidence_reference,
              status: saved.status,
              updated_at: saved.updated_at,
            }
          : null,
      });
    }

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

    const result = standards.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      category: s.category,
      disclosure_requirements: drsByStandardId.get(s.id) || [],
    }));

    res.status(200).json({ audit_id: parseInt(id, 10), standards: result });
  } catch (error) {
    console.error("Error fetching questionnaire:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function save_questionnaire(req, res) {
  const { id } = req.params;
  const { data_points } = req.body;

  if (!Array.isArray(data_points) || data_points.length === 0) {
    return res
      .status(400)
      .json({ error: "data_points must be a non-empty array" });
  }

  try {
    const audit = await Audit.findOne({ where: { id } });
    if (!audit) return res.status(404).json({ error: "Audit not found" });

    const datapointsIdsToSave = data_points.map((dp) => dp.data_point_id);
    const existingDatapoints = await AuditDatapoints.findAll({
      where: { audit_id: id, data_point_id: datapointsIdsToSave },
    });
    const existingMap = new Map(
      existingDatapoints.map((r) => [r.data_point_id, r]),
    );

    const records = data_points.map((dp) => {
      const value_text = dp.value_text;
      const is_applicable = dp.is_applicable;
      const evidence_reference = dp.evidence_reference;
      const existing = existingMap.get(dp.data_point_id);
      const keepStatus =
        existing &&
        (existing.status === "validated" || existing.status === "rejected") &&
        existing.value_text === value_text &&
        existing.is_applicable === is_applicable &&
        existing.evidence_reference === evidence_reference;

      return {
        audit_id: parseInt(id, 10),
        data_point_id: dp.data_point_id,
        value_text,
        is_applicable,
        evidence_reference,
        status: keepStatus ? existing.status : dp.status,
        updated_at: new Date(),
        updated_by: req.user.id,
      };
    });

    await AuditDatapoints.bulkCreate(records, {
      updateOnDuplicate: [
        "value_text",
        "is_applicable",
        "evidence_reference",
        "status",
        "updated_at",
        "updated_by",
      ],
    });

    res.status(200).json({ message: "Questionnaire saved successfully" });
  } catch (error) {
    console.error("Error saving questionnaire:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function validate_questionnaire(req, res) {
  const { id } = req.params;
  const { validated_ids, rejected_ids } = req.body;

  try {
    const audit = await Audit.findOne({ where: { id } });
    if (!audit) {
      return res.status(404).json({ error: "Audit not found" });
    }

    const now = new Date();

    await AuditDatapoints.update(
      { status: "completed", updated_at: now, updated_by: req.user.id },
      { where: { audit_id: id, status: ["validated", "rejected"] } },
    );

    if (validated_ids && validated_ids.length > 0) {
      await AuditDatapoints.update(
        { status: "validated", updated_at: now, updated_by: req.user.id },
        {
          where: {
            audit_id: id,
            data_point_id: validated_ids,
            status: "completed",
          },
        },
      );
    }

    if (rejected_ids && rejected_ids.length > 0) {
      await AuditDatapoints.update(
        { status: "rejected", updated_at: now, updated_by: req.user.id },
        {
          where: {
            audit_id: id,
            data_point_id: rejected_ids,
            status: "completed",
          },
        },
      );
    }

    res.status(200).json({ message: "Validation saved successfully" });
  } catch (error) {
    console.error("Error validating questionnaire:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  get_questionnaire,
  save_questionnaire,
  validate_questionnaire,
};
