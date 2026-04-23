const express = require('express');
const router = express.Router();

const municipioController = require('../controllers/municipios.controller');

router.get('/', municipioController.listar);
router.get('/ranking', municipioController.ranking);

module.exports = router;