const jwt = require("jsonwebtoken");
const AppError = require("./appError");
const { formatarDataBR } = require("./formatters");

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError("JWT_SECRET nao configurada no ambiente.", 500);
  }
  return secret;
}

function getBcryptRounds() {
  const rounds = Number(process.env.BCRYPT_ROUNDS || 10);
  if (!Number.isInteger(rounds) || rounds < 6 || rounds > 14) {
    throw new AppError(
      "BCRYPT_ROUNDS invalido. Use um valor entre 6 e 14.",
      500,
    );
  }
  return rounds;
}

function signToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      tipo: String(user.tipo || "usuario").toLowerCase(),
    },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRATION || "24h" },
  );
}

function sanitizeUser(user) {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    telefone: user.telefone,
    tipo: user.tipo,
    id_regiao: user.id_regiao,
    data_cadastro: user.data_cadastro
      ? formatarDataBR(user.data_cadastro)
      : null,
  };
}

module.exports = { getJwtSecret, getBcryptRounds, signToken, sanitizeUser };
