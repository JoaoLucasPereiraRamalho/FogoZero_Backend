const { z } = require("zod");

const usuarioIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Id de usuario invalido."),
});

const updateUsuarioSchema = z.object({
  nome: z
    .string()
    .min(2, "Nome deve ter ao menos 2 caracteres.")
    .max(120, "Nome deve ter no maximo 120 caracteres.")
    .optional(),
  telefone: z
    .string()
    .min(8, "Telefone invalido.")
    .max(30, "Telefone invalido.")
    .optional(),
  id_regiao: z.coerce
    .number()
    .int()
    .positive("Id de regiao invalido.")
    .optional(),
});

const adminUpdateUsuarioSchema = updateUsuarioSchema.extend({
  tipo: z
    .enum(["usuario", "administrador"], {
      message: "Tipo deve ser 'usuario' ou 'administrador'.",
    })
    .optional(),
});

const listUsuariosQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

module.exports = {
  usuarioIdParamSchema,
  updateUsuarioSchema,
  adminUpdateUsuarioSchema,
  listUsuariosQuerySchema,
};
