const express = require('express');
const router = express.Router();
const { getExperts, getExpertById, getStats } = require('../controllers/expertController');

router.get('/', getExperts);
router.get('/stats', getStats);
router.get('/:id', getExpertById);

module.exports = router;
