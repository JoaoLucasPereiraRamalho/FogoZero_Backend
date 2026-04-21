const express = require("express");
const educativoController = require("../controllers/educativo.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/authorize.middleware");

const router = express.Router();

router.post(
  "/noticias",
  authMiddleware,
  requireRole(["administrador"]),
  educativoController.createNoticia,
);
router.get("/noticias", educativoController.listNoticias);
router.get("/noticias/:id", educativoController.getNoticiaById);
router.patch(
  "/noticias/:id",
  authMiddleware,
  requireRole(["administrador"]),
  educativoController.updateNoticia,
);
router.delete(
  "/noticias/:id",
  authMiddleware,
  requireRole(["administrador"]),
  educativoController.deleteNoticia,
);

router.post(
  "/glossario",
  authMiddleware,
  requireRole(["administrador"]),
  educativoController.createGlossario,
);
router.get("/glossario", educativoController.listGlossario);
router.get("/glossario/termo/:termo", educativoController.getGlossarioByTermo);
router.get("/glossario/:id", educativoController.getGlossarioById);
router.patch(
  "/glossario/:id",
  authMiddleware,
  requireRole(["administrador"]),
  educativoController.updateGlossario,
);
router.delete(
  "/glossario/:id",
  authMiddleware,
  requireRole(["administrador"]),
  educativoController.deleteGlossario,
);

module.exports = router;
