'use strict';

const { suggestMateriality } = require('../services/materialityService.js');
const { extractDataPoints }  = require('../services/extractionService.js');

const Audit = require('../models/audit.model.js');
const Standard = require('../models/standard.model.js');
const DisclosureRequirement = require('../models/disclosure_requirement.model.js');
const DataPoint = require('../models/data_point.model.js');
const SourceDocument = require('../models/source_document.model.js');
const AuditDatapoint = require('../models/audit_data_points.model.js');
const DataPointSource = require('../models/data_point_source.model.js');

// IA para sugerir la materialidad de los estandares
async function suggest_materiality(req, res) {
    const { id } = req.params;
    const { sector, employees, revenue, description } = req.body;

    if (!sector || employees == null) {
        return res.status(400).json({ error: 'sector y employees son obligatorios' });
    }

    try {
        const audit = await Audit.findOne({ where: { id } });
        if (!audit) return res.status(404).json({ error: 'Audit not found' });

        const suggestions = await suggestMateriality({
            sector,
            employees: Number(employees),
            revenue: revenue != null ? Number(revenue) : null,
            description: description || null,
        });

        return res.status(200).json({ suggestions });
    } catch (error) {
        console.error('Materiality suggestion error:', error);
        return res.status(500).json({ error: 'service error', detail: error.message });
    }
}

const ALLOWED_FORMATS = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  // Content-type de los .docx
];

// Subir documento para una auditoria
async function upload_document(req, res) {
    const { id } = req.params;

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    if (!ALLOWED_FORMATS.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Only PDF and DOCX files are allowed' });
    }

    try {
        const audit = await Audit.findOne({ where: { id } });
        if (!audit) return res.status(404).json({ error: 'Audit not found' });

        let extractedText = null;
        let pageCount = null;
        let processedStatus = 'completed';

        try {
            const result  = await extractTextFromFile(req.file.buffer, req.file.mimetype);
            extractedText = result.text;
            pageCount = result.pageCount;
        } catch (parseErr) {
            console.error('Text extraction error:', parseErr.message);
            processedStatus = 'failed';
        }

        const doc = await SourceDocument.create({
            audit_id: parseInt(id, 10),
            filename: `${Date.now()}_${req.file.originalname}`,
            original_name: req.file.originalname,
            format: req.file.mimetype,
            file_size: req.file.size,
            extracted_text: extractedText,
            page_count: pageCount,
            processed_status: processedStatus,
            uploaded_by: req.user.id,
            uploaded_at: new Date(),
        });

        return res.status(201).json({
            id: doc.id,
            original_name: doc.original_name,
            format: doc.format,
            file_size: doc.file_size,
            page_count: doc.page_count,
            processed_status: doc.processed_status,
            uploaded_at: doc.uploaded_at,
        });
    } catch (error) {
        console.error('Document upload error:', error);
        return res.status(500).json({ error: 'Processing error', detail: error.message });
    }
}

// Listar documentos de una auditoria (sin el texto)
async function list_documents(req, res) {
    const { id } = req.params;
    try {
        const audit = await Audit.findOne({ where: { id } });
        if (!audit) return res.status(404).json({ error: 'Audit not found' });

        const docs = await SourceDocument.findAll({
            where: { audit_id: id },
            attributes: ['id', 'original_name', 'format', 'file_size', 'page_count', 'processed_status', 'uploaded_at'],
            order: [['uploaded_at', 'DESC']],
        });

        return res.status(200).json(docs);
    } catch (error) {
        console.error('Document listing error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// Extraer DataPoints de un documento con IA
async function extract_datapoints(req, res) {
    const { id, standardId } = req.params;
    const { source_document_id } = req.body;

    if (!source_document_id) {
        return res.status(400).json({ error: 'source_document_id is required' });
    }

    try {
        // Verificaciones: auditoria, estandar, framework y documento
        const audit = await Audit.findOne({ where: { id } });
        if (!audit) return res.status(404).json({ error: 'Audit not found' });

        const standard = await Standard.findOne({
            where: { id: standardId, framework_version_id: audit.framework_version_id },
        });
        if (!standard) return res.status(404).json({ error: 'Standard not found for this audit' });

        const sourceDoc = await SourceDocument.findOne({
            where: { id: source_document_id, audit_id: id },
        });
        if (!sourceDoc) return res.status(404).json({ error: 'Document not found for this audit' });
        if (sourceDoc.processed_status !== 'completed') {
            return res.status(400).json({ error: 'The document has not been processed correctly' });
        }
        if (!sourceDoc.extracted_text) {
            return res.status(400).json({ error: 'The document does not have extracted text' });
        }

        const dataPoints = await DataPoint.findAll({
            attributes: ['id', 'official_id', 'name', 'data_type'],
            include: [{
                model: DisclosureRequirement,
                required: true,
                attributes: [],
                where: { standard_id: standardId },
            }],
        });

        if (dataPoints.length === 0) {
            return res.status(404).json({ error: 'No DataPoints found for this standard' });
        }

        // Llamar al servicio de IA
        const extractions = await extractDataPoints({
            documentText: sourceDoc.extracted_text,
            dataPoints:   dataPoints.map(dp => dp.toJSON()),
            standardCode: standard.code,
            standardName: standard.name,
        });

        if (extractions.length === 0) {
            return res.status(200).json({
                extracted: 0,
                message: 'The AI did not find data for this standard in the document',
            });
        }

        const date  = new Date();
        const auditId = parseInt(id, 10);
        const docId = parseInt(source_document_id, 10);

        // Guardar o actualizar valores en AuditDatapoint
        await AuditDatapoint.bulkCreate(
            extractions.map(e => ({
                audit_id:      auditId,
                data_point_id: e.data_point_id,
                value_text:    e.extracted_value,
                is_applicable: true,
                status:        'pending',
                updated_at:    date,
                updated_by:    req.user.id,
            })),
            { updateOnDuplicate: ['value_text', 'status', 'updated_at', 'updated_by'] }
        );

        // Insertar fuentes en DataPointSource
        await DataPointSource.bulkCreate(
            extractions.map(e => ({
                audit_id:          auditId,
                data_point_id:     e.data_point_id,
                source_document_id: docId,
                extracted_value:   e.extracted_value,
                quote:             e.quote,
                page_hint:         e.page_hint || null,
                confidence:        e.confidence,
                extracted_at:      date,
                is_validated:      false,
            }))
        );

        const dpMetaMap = new Map(dataPoints.map(dp => [dp.id, { official_id: dp.official_id, name: dp.name }]));
        return res.status(200).json({
            extracted: extractions.length,
            standard:  { id: standard.id, code: standard.code, name: standard.name },
            results:   extractions.map(e => {
                const meta = dpMetaMap.get(e.data_point_id) || {};
                return {
                    data_point_id:   e.data_point_id,
                    official_id:     meta.official_id || null,
                    name:            meta.name || null,
                    extracted_value: e.extracted_value,
                    confidence:      e.confidence,
                    page_hint:       e.page_hint || null,
                };
            }),
        });
    } catch (error) {
        console.error('DataPoint extraction error:', error);
        return res.status(500).json({ error: 'Service error', detail: error.message });
    }
}

// Eliminar un documento subido y sus fuentes de extraccion
async function delete_document(req, res) {
    const { id, docId } = req.params;
    try {
        const doc = await SourceDocument.findOne({ where: { id: docId, audit_id: id } });
        if (!doc) return res.status(404).json({ error: 'Document not found' });

        await DataPointSource.destroy({ where: { source_document_id: docId } });
        await doc.destroy();

        return res.status(200).json({ message: 'Document deleted' });
    } catch (error) {
        console.error('Document delete error:', error);
        return res.status(500).json({ error:'Internal server error'});
    }
}

// Extrae el texto plano de un fichero en memoria segun su mimetype (formato).
async function extractTextFromFile(buffer, mimetype) {
    if (mimetype === 'application/pdf') {
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);
        return { text: data.text, pageCount: data.numpages };
    } else {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        return { text: result.value, pageCount: null };
    }
}

module.exports = { suggest_materiality, upload_document, list_documents, extract_datapoints, delete_document };
