const express = require("express");
const router = express.Router();

const municipioController = require("../controllers/municipios.controller");

router.get("/", municipioController.listar);
router.get("/ranking", municipioController.ranking);

// Rotas IMRI — devem ficar ANTES de /:municipio para evitar conflito de param
router.get("/imri/estatisticas", municipioController.estatisticasImri);
router.get("/imri/ranking", municipioController.rankingImri);
router.get("/:municipio/evolucao", municipioController.evolucaoHistorica);

module.exports = router;
