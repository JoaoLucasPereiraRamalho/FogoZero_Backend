const express = require("express");
const router = express.Router();
const noticiaController = require("../controllers/noticia.controller");

router.post("/importar", noticiaController.importar);
router.get("/status/:importId", noticiaController.obterStatus);
router.get("/", noticiaController.listar);
router.patch("/:id/status", noticiaController.atualizarStatus);

module.exports = router;
