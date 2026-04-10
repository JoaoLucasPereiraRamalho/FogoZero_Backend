const express = require("express");
const educativoController = require("../controllers/educativo.controller");

const router = express.Router();

router.post("/noticias", educativoController.createNoticia);
router.get("/noticias", educativoController.listNoticias);
router.get("/noticias/:id", educativoController.getNoticiaById);
router.patch("/noticias/:id", educativoController.updateNoticia);
router.delete("/noticias/:id", educativoController.deleteNoticia);

router.post("/glossario", educativoController.createGlossario);
router.get("/glossario", educativoController.listGlossario);
router.get("/glossario/termo/:termo", educativoController.getGlossarioByTermo);
router.get("/glossario/:id", educativoController.getGlossarioById);
router.patch("/glossario/:id", educativoController.updateGlossario);
router.delete("/glossario/:id", educativoController.deleteGlossario);

module.exports = router;
