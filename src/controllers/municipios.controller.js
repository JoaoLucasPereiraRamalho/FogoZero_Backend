const municipioService = require("../services/municipios.service");
const AppError = require("../utils/appError");

async function listar(req, res, next) {
  try {
    const { nome, bioma, classificacao } = req.query;

    let resultado;

    if (nome) {
      resultado = await municipioService.buscarPorNome(nome);
    } else if (bioma) {
      resultado = await municipioService.filtrarPorBioma(bioma);
    } else if (classificacao) {
      resultado = await municipioService.filtrarPorClassificacao(classificacao);
    } else {
      resultado = await municipioService.listarTodos();
    }

    return res.status(200).json(resultado);
  } catch (error) {
    if (error.statusCode) return next(error);
    return next(new AppError("Erro ao buscar municipios.", 500));
  }
}

async function ranking(req, res, next) {
  try {
    const resultado = await municipioService.rankingFocos();
    return res.status(200).json(resultado);
  } catch (error) {
    if (error.statusCode) return next(error);
    return next(new AppError("Erro ao gerar ranking.", 500));
  }
}

module.exports = {
  listar,
  ranking,
};
