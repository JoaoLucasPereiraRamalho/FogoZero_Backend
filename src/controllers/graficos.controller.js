const graficosService = require("../services/graficos.service");
const AppError = require("../utils/appError");

function buscarPorNome(req, res, next) {
  try {
    const { nome } = req.params;
    const assets = graficosService.buscarAssetsPorMunicipio(nome);
    return res.status(200).json(assets);
  } catch (error) {
    if (error.statusCode) return next(error);
    return next(new AppError("Erro ao buscar assets do municipio.", 500));
  }
}

module.exports = {
  buscarPorNome,
};
