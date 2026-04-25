const AppError = require("../utils/appError");

function requireRole(roles = []) {
  const normalizedRoles = roles.map((role) => String(role).toLowerCase());

  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Usuario nao autenticado.", 401));
    }

    const userRole = String(req.user.tipo || "").toLowerCase();
    if (!normalizedRoles.includes(userRole)) {
      return next(new AppError("Acesso negado para este recurso.", 403));
    }

    return next();
  };
}

function requireSelf(paramName) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Usuario nao autenticado.", 401));
    }

    const targetValue = req.params?.[paramName];
    const targetId = Number(targetValue);

    if (!targetId || Number.isNaN(targetId)) {
      return next(new AppError("Identificador de usuario invalido.", 400));
    }

    if (req.user.userId !== targetId) {
      return next(new AppError("Acesso negado para este recurso.", 403));
    }

    return next();
  };
}

/**
 * Permite acesso se o usuario autenticado for o proprio dono do recurso
 * OU se for administrador.
 */
function requireSelfOrAdmin(paramName) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Usuario nao autenticado.", 401));
    }

    const targetValue = req.params?.[paramName];
    const targetId = Number(targetValue);

    if (!targetId || Number.isNaN(targetId)) {
      return next(new AppError("Identificador de usuario invalido.", 400));
    }

    const isAdmin = String(req.user.tipo).toLowerCase() === "admin";

    if (!isAdmin && req.user.userId !== targetId) {
      return next(new AppError("Acesso negado para este recurso.", 403));
    }

    return next();
  };
}

module.exports = {
  requireRole,
  requireSelf,
  requireSelfOrAdmin,
};
