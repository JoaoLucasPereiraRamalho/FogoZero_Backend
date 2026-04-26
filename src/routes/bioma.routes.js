const express = require("express");
const biomaController = require("../controllers/bioma.controller");

const router = express.Router();

// Rotas estáticas devem vir ANTES de /:id para evitar conflito de parâmetro
router.get("/distribuicao", biomaController.getDistribuicao);
router.get("/anos-disponiveis", biomaController.getAnosDisponiveis);

router.get("/", biomaController.listBiomas);
router.get("/:id", biomaController.getBiomaById);
router.get("/:id/registros", biomaController.listRegistrosByBioma);
router.get("/:id/evolucao-mensal", biomaController.getEvolucaoMensal);
router.get("/:id/estatisticas", biomaController.getEstatisticas);

module.exports = router;
