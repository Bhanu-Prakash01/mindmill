const express = require('express');
const router = express.Router();
const { getSimpleResults, downloadSimpleReport } = require('../controllers/simpleReportController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/:id/simple-results', authMiddleware, getSimpleResults);
router.get('/:id/simple-report/download', authMiddleware, downloadSimpleReport);

module.exports = router;