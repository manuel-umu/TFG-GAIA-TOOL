'use strict';

const express = require('express');
const multer  = require('multer');
const router  = express.Router();

const aiController = require('../controllers/ai.controller.js');
const { checkUser } = require('../utils/autorizationMildware.js');

// Ficheros en memoria (buffer) — no se escriben en disco
const upload = multer({
    storage: multer.memoryStorage(),
    limits:  { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

router.post('/audits/:id/ai/materiality',
    checkUser(),
    aiController.suggest_materiality
);

router.post('/audits/:id/documents',
    checkUser(),
    upload.single('document'),   // campo del form-data
    aiController.upload_document
);

router.get('/audits/:id/documents',
    checkUser(),
    aiController.list_documents
);

router.post('/audits/:id/ai/extract/:standardId',
    checkUser(),
    aiController.extract_datapoints
);

module.exports = router;
