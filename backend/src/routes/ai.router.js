'use strict';

const express = require('express');
const multer  = require('multer');
const router  = express.Router();

const aiController = require('../controllers/ai.controller.js');
const { checkUser } = require('../utils/autorizationMildware.js');

// Subida de ficheros para IA
const upload = multer({
    storage: multer.memoryStorage(),
    limits:  { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

router.post('/audits/:id/ai/materiality', checkUser(), aiController.suggest_materiality);

router.post('/audits/:id/documents', checkUser(), upload.single('document'), aiController.upload_document);

router.get('/audits/:id/documents', checkUser(), aiController.list_documents);

router.delete('/audits/:id/documents/:docId', checkUser(), aiController.delete_document);

router.post('/audits/:id/ai/extract/:standardId', checkUser(), aiController.extract_datapoints);

module.exports = router;
