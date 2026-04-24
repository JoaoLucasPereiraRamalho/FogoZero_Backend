const express = require("express");
const notificacaoController = require("../controllers/notificacao.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware);
router.get("/", notificacaoController.index);
router.get("/nao-lidas/contar", notificacaoController.contarNaoLidas);
router.patch("/:id/lida", notificacaoController.marcarComoLida);
router.patch("/marcar-todas-lidas", notificacaoController.marcarTodasComoLidas);
router.delete("/:id", notificacaoController.delete);

module.exports = router;
