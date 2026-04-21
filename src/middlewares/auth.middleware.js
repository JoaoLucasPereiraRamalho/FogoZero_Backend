const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");

function getTokenFromHeader(authorizationHeader) {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

function authMiddleware(req, res, next) {
  try {
    const token = getTokenFromHeader(req.headers.authorization);
    if (!token) {
      throw new AppError("Token de acesso ausente ou invalido.", 401);
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AppError("JWT_SECRET nao configurada no ambiente.", 500);
    }

    const payload = jwt.verify(token, secret);

    req.user = {
      userId: Number(payload.userId),
      email: payload.email,
      tipo: String(payload.tipo || "").toLowerCase(),
    };

    if (!req.user.userId || Number.isNaN(req.user.userId)) {
      throw new AppError("Token de acesso invalido.", 401);
    }

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Token expirado.", 401));
    }

    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Token de acesso invalido.", 401));
    }

    return next(error);
  }
}

module.exports = authMiddleware;
