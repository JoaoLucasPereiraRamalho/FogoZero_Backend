const express = require("express");
const usuarioController = require("../controllers/usuario.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  requireRole,
  requireSelfOrAdmin,
} = require("../middlewares/authorize.middleware");

const router = express.Router();

// Somente admin lista todos os usuários
router.get(
  "/",
  authMiddleware,
  requireRole(["administrador"]),
  usuarioController.listAll,
);

// Próprio usuário ou admin visualiza perfil
router.get(
  "/:id",
  authMiddleware,
  requireSelfOrAdmin("id"),
  usuarioController.getProfile,
);

// Próprio usuário ou admin atualiza perfil
router.patch(
  "/:id",
  authMiddleware,
  requireSelfOrAdmin("id"),
  usuarioController.updateProfile,
);

// Próprio usuário ou admin remove conta
router.delete(
  "/:id",
  authMiddleware,
  requireSelfOrAdmin("id"),
  usuarioController.deleteAccount,
);

// Histórico de reportes do usuário
router.get(
  "/:id/reportes",
  authMiddleware,
  requireSelfOrAdmin("id"),
  usuarioController.getHistoricoReportes,
);

module.exports = router;
