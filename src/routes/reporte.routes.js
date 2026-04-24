const express = require("express");
const router = express.Router();
const reporteController = require("../controllers/reporte.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const {
  requireRole,
  requireSelf,
} = require("../middlewares/authorize.middleware");

router.post("/primeiro", reporteController.createFirstReporte);

router.post("/", authMiddleware, reporteController.create);

router.get(
  "/usuario/:usuario_id",
  authMiddleware,
  requireSelf("usuario_id"),
  reporteController.listByUsuario,
);
router.get("/:id", authMiddleware, reporteController.getById);

router.get(
  "/",
  authMiddleware,
  requireRole(["administrador"]),
  reporteController.listAll,
);
router.patch(
  "/:id/status-admin",
  authMiddleware,
  requireRole(["administrador"]),
  reporteController.updateAdminStatus,
);
router.patch(
  "/:id/encaminhar-bombeiros",
  authMiddleware,
  requireRole(["administrador"]),
  reporteController.forwardToFireDepartment,
);

module.exports = router;
