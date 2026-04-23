const express = require("express");
const router = express.Router();
const monitoramentoController = require("../controllers/monitoramento.controller");
const authMiddleware = require("../middlewares/auth.middleware"); // O seu middleware de JWT

// Todas as rotas de monitorização exigem login
router.use(authMiddleware);

router.post("/", monitoramentoController.store);
router.get("/", monitoramentoController.index);
router.delete("/:id", monitoramentoController.delete);

module.exports = router;
