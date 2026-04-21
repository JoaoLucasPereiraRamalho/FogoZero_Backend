const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ZodError } = require("zod");
const AppError = require("../utils/appError");
const authRepository = require("../repositories/auth.repository");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../dtos/auth.dto");

function mapZodError(error) {
  return error.issues.map((issue) => ({
    campo: issue.path.join("."),
    mensagem: issue.message,
  }));
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new AppError("JWT_SECRET nao configurada no ambiente.", 500);
  }

  return secret;
}

function signToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    tipo: String(user.tipo || "usuario").toLowerCase(),
  };

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRATION || "24h",
  });
}

function signPasswordResetToken(user) {
  const payload = {
    userId: user.id,
    tokenType: "password_reset",
  };

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: process.env.PASSWORD_RESET_EXPIRATION || "15m",
  });
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

function sanitizeUser(user) {
  return {
    id: user.id,
    nome: user.nome,
    email: user.email,
    telefone: user.telefone,
    tipo: user.tipo,
    id_regiao: user.id_regiao,
    data_cadastro: user.data_cadastro,
  };
}

async function register(input) {
  try {
    const data = registerSchema.parse(input);
    const email = data.email.toLowerCase();

    const existingUser = await authRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError("Email ja cadastrado.", 409);
    }

    const senhaHash = await bcrypt.hash(data.senha, getBcryptRounds());

    const createdUser = await authRepository.createUsuario({
      nome: data.nome,
      email,
      telefone: data.telefone,
      senha_hash: senhaHash,
      tipo: "usuario",
      id_regiao: data.id_regiao,
    });

    return {
      usuario: sanitizeUser(createdUser),
      token: signToken(createdUser),
    };
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(
        "Dados de cadastro invalidos.",
        400,
        mapZodError(error),
      );
    }

    throw error;
  }
}

async function login(input) {
  try {
    const data = loginSchema.parse(input);
    const email = data.email.toLowerCase();

    const user = await authRepository.findByEmail(email);

    if (!user) {
      throw new AppError("Credenciais invalidas.", 401);
    }

    const isPasswordValid = await bcrypt.compare(data.senha, user.senha_hash);
    if (!isPasswordValid) {
      throw new AppError("Credenciais invalidas.", 401);
    }

    return {
      usuario: sanitizeUser(user),
      token: signToken(user),
    };
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError("Dados de login invalidos.", 400, mapZodError(error));
    }

    throw error;
  }
}

async function logout(authenticatedUser) {
  if (!authenticatedUser?.userId) {
    throw new AppError("Usuario nao autenticado.", 401);
  }

  return {
    mensagem: "Logout realizado com sucesso.",
  };
}

async function forgotPassword(input) {
  try {
    const data = forgotPasswordSchema.parse(input);
    const email = data.email.toLowerCase();

    const user = await authRepository.findByEmail(email);
    const response = {
      mensagem:
        "Se o email estiver cadastrado, voce recebera instrucoes para redefinir a senha.",
    };

    if (!user) {
      return response;
    }

    const resetToken = signPasswordResetToken(user);
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(
      resetToken,
    )}`;

    if (process.env.NODE_ENV !== "production") {
      return {
        ...response,
        token_reset: resetToken,
        link_reset: resetLink,
      };
    }

    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(
        "Dados para recuperacao de senha invalidos.",
        400,
        mapZodError(error),
      );
    }

    throw error;
  }
}

async function resetPassword(input) {
  try {
    const data = resetPasswordSchema.parse(input);

    let payload;
    try {
      payload = jwt.verify(data.token, getJwtSecret());
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new AppError("Token de redefinicao expirado.", 400);
      }

      throw new AppError("Token de redefinicao invalido.", 400);
    }

    if (payload.tokenType !== "password_reset" || !payload.userId) {
      throw new AppError("Token de redefinicao invalido.", 400);
    }

    const user = await authRepository.findById(Number(payload.userId));
    if (!user) {
      throw new AppError("Usuario nao encontrado.", 404);
    }

    const senhaHash = await bcrypt.hash(data.senha, getBcryptRounds());
    await authRepository.updatePasswordById(user.id, senhaHash);

    return {
      mensagem: "Senha redefinida com sucesso.",
    };
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(
        "Dados para redefinicao de senha invalidos.",
        400,
        mapZodError(error),
      );
    }

    throw error;
  }
}

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
};
