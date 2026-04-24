const usuarioService = require("../services/usuario.service");
const reporteService = require("../services/reporte.service");
const AppError = require("../utils/appError");

async function getProfile(req, res, next) {
  try {
    const result = await usuarioService.getProfile(req.params);
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) return next(error);
    return next(new AppError("Erro ao buscar perfil do usuario.", 500));
  }
}

async function listAll(req, res, next) {
  try {
    const result = await usuarioService.listAll(req.query);
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) return next(error);
    return next(new AppError("Erro ao listar usuarios.", 500));
  }
}

async function updateProfile(req, res, next) {
  try {
    const result = await usuarioService.updateProfile(
      req.params,
      req.body,
      req.user,
    );
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) return next(error);
    return next(new AppError("Erro ao atualizar perfil do usuario.", 500));
  }
}

async function deleteAccount(req, res, next) {
  try {
    const result = await usuarioService.deleteAccount(req.params);
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) return next(error);
    return next(new AppError("Erro ao remover conta do usuario.", 500));
  }
}

async function getHistoricoReportes(req, res, next) {
  try {
    const result = await reporteService.listByUsuario(
      req.params,
      req.query,
      req.user.userId,
    );
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) return next(error);
    return next(new AppError("Erro ao buscar historico de reportes.", 500));
  }
}

module.exports = {
  getProfile,
  listAll,
  updateProfile,
  deleteAccount,
  getHistoricoReportes,
};
