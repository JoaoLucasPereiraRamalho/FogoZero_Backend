const errorHandler = (err, req, res, next) => {
  if (err.name === "ZodError") {
    return res.status(400).json({
      erro: "Dados inválidos de entrada.",
      detalhes: err.errors.map((e) => ({
        campo: e.path[0],
        mensagem: e.message,
      })),
    });
  }

  console.error(err);
  return res
    .status(500)
    .json({ erro: "Erro interno no servidor do FogoZero MG." });
};

module.exports = errorHandler;
