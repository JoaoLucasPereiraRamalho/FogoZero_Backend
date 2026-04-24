const express = require("express");
const biomaController = require("../controllers/bioma.controller");

const router = express.Router();

router.get("/", biomaController.listBiomas);
router.get("/:id", biomaController.getBiomaById);
router.get("/:id/registros", biomaController.listRegistrosByBioma);

module.exports = router;
