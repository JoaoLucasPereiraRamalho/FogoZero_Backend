const express = require("express");
const router = express.Router();
const QueimadaController = require("../controllers/queimada.controller");

// Rota GET para consultar dados
// Exemplo de uso: GET /api/queimadas?id_regiao=5&data_inicio=2026-01-01
router.get("/", QueimadaController.consultar);

module.exports = router;
