const express = require('express');
const router = express.Router();

const graficosController = require('../controllers/graficos.controller');

router.get('/:nome/assets', graficosController.buscarPorNome);

module.exports = router;