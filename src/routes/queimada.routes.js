const express = require("express");
const router = express.Router();
const QueimadaController = require("../controllers/queimada.controller");

router.get("/", QueimadaController.consultar);
router.post("/", QueimadaController.store);

module.exports = router;
