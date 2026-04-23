const { z } = require("zod");

const registerSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Nome deve ter ao menos 2 caracteres.")
    .max(120, "Nome excede o tamanho permitido."),
  email: z.string().trim().email("Email invalido."),
  telefone: z
    .string()
    .trim()
    .min(10, "Telefone deve conter ao menos 10 caracteres.")
    .max(20, "Telefone excede o tamanho permitido.")
    .regex(/^[0-9+()\-\s]+$/, "Telefone invalido."),
  senha: z
    .string()
    .min(6, "Senha deve ter ao menos 6 caracteres.")
    .max(72, "Senha excede o tamanho permitido."),
  id_regiao: z.coerce
    .number()
    .int()
    .positive("Id da regiao informado e invalido."),
});

const loginSchema = z.object({
  email: z.string().trim().email("Email invalido."),
  senha: z.string().min(1, "Senha e obrigatoria."),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Email invalido."),
});

const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, "Token de redefinicao e obrigatorio."),
  senha: z
    .string()
    .min(6, "Senha deve ter ao menos 6 caracteres.")
    .max(72, "Senha excede o tamanho permitido."),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
