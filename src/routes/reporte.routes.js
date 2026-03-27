const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res
    .status(200)
    .json({ mensagem: "Rota de reportes de incêndio funcionando!" });
});

router.post("/", (req, res) => {
  res
    .status(201)
    .json({ mensagem: "Aqui o DTO vai validar e criar um novo reporte." });
});

module.exports = router;
