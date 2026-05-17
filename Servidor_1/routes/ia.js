const { Router } = require('express');
const { iaQueryPost, iaSuggestionsGet } = require('../controllers/ia');

const router = Router();

/**
 * Ruta para consultas a la IA.
 * POST /api/ia/query
 */
router.post('/query', iaQueryPost);

/**
 * Ruta para obtener sugerencias.
 * GET /api/ia/suggestions
 */
router.get('/suggestions', iaSuggestionsGet);

module.exports = router;
