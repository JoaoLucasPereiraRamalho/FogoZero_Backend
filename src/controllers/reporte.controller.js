const reporteService = require("../services/reporte.service");

async function create(req, res, next) {
  try {
    const reporte = await reporteService.create(req.body, req.user.userId);
    return res.status(201).json({ reporte });
  } catch (error) {
    return next(error);
  }
}

async function listAll(req, res, next) {
  try {
    const result = await reporteService.listAll(req.query);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function listByUsuario(req, res, next) {
  try {
    const result = await reporteService.listByUsuario(
      req.params,
      req.query,
      req.user.userId,
    );
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function getById(req, res, next) {
  try {
    const reporte = await reporteService.getById(req.params);
    return res.status(200).json({ reporte });
  } catch (error) {
    return next(error);
  }
}

async function updateAdminStatus(req, res, next) {
  try {
    const reporte = await reporteService.updateAdminStatus(
      req.params,
      req.body,
    );
    return res.status(200).json({ reporte });
  } catch (error) {
    return next(error);
  }
}

async function forwardToFireDepartment(req, res, next) {
  try {
    const result = await reporteService.forwardToFireDepartment(
      req.params,
      req.body,
    );
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  create,
  listAll,
  listByUsuario,
  getById,
  updateAdminStatus,
  forwardToFireDepartment,
};
