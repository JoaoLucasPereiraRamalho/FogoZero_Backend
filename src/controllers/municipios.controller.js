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

async function estatisticasImri(req, res, next) {
  try {
    const resultado = await municipioService.estatisticasImri();
    return res.status(200).json(resultado);
  } catch (error) {
    if (error.statusCode) return next(error);
    return next(new AppError("Erro ao buscar estatisticas IMRI.", 500));
  }
}

async function rankingImri(req, res, next) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 853);
    const resultado = await municipioService.rankingImri(limit);
    return res.status(200).json(resultado);
  } catch (error) {
    if (error.statusCode) return next(error);
    return next(new AppError("Erro ao gerar ranking IMRI.", 500));
  }
}

async function evolucaoHistorica(req, res, next) {
  try {
    const { municipio } = req.params;
    const resultado = await municipioService.evolucaoHistorica(municipio);
    if (!resultado) {
      return next(new AppError("Municipio nao encontrado.", 404));
    }
    return res.status(200).json(resultado);
  } catch (error) {
    if (error.statusCode) return next(error);
    return next(new AppError("Erro ao buscar evolucao historica.", 500));
  }
}

module.exports = {
  listar,
  ranking,
  estatisticasImri,
  rankingImri,
  evolucaoHistorica,
};
