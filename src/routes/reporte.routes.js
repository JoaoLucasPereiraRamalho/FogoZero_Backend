const express = require("express");
const router = express.Router();
const reporteController = require("../controllers/reporte.controller");

router.post("/", reporteController.create);

router.get("/usuario/:usuario_id", reporteController.listByUsuario);
router.get("/:id", reporteController.getById);

router.get("/", reporteController.listAll);
router.patch("/:id/status-admin", reporteController.updateAdminStatus);
router.patch(
  "/:id/encaminhar-bombeiros",
  reporteController.forwardToFireDepartment,
);

module.exports = router;
