const { z } = require("zod");

const createReporteSchema = z.object({
  assunto: z
    .string()
    .trim()
    .min(5, "Assunto deve ter ao menos 5 caracteres.")
    .max(1000, "Assunto excede o tamanho permitido."),
  latitude: z.coerce
    .number()
    .min(-90, "Latitude deve estar entre -90 e 90.")
    .max(90, "Latitude deve estar entre -90 e 90."),
  longitude: z.coerce
    .number()
    .min(-180, "Longitude deve estar entre -180 e 180.")
    .max(180, "Longitude deve estar entre -180 e 180."),
  imagem_url: z.string().trim().url("URL da imagem invalida."),
  id_status_analise_ia: z.coerce.number().int().positive().optional(),
  id_status_analise_admin: z.coerce.number().int().positive().optional(),
});

const reporteIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Id do reporte invalido."),
});

const usuarioIdParamSchema = z.object({
  usuario_id: z.coerce.number().int().positive("Id do usuario invalido."),
});

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const adminReporteListQuerySchema = paginationQuerySchema.extend({
  usuario_id: z.coerce.number().int().positive().optional(),
  id_status_analise_ia: z.coerce.number().int().positive().optional(),
  id_status_analise_admin: z.coerce.number().int().positive().optional(),
});

const userReporteListQuerySchema = paginationQuerySchema.extend({
  id_status_analise_ia: z.coerce.number().int().positive().optional(),
  id_status_analise_admin: z.coerce.number().int().positive().optional(),
});

const updateStatusAdminSchema = z.object({
  id_status_analise_admin: z.coerce
    .number()
    .int()
    .positive("Status de analise admin invalido."),
});

const forwardReporteSchema = z.object({
  id_status_analise_admin: z.coerce
    .number()
    .int()
    .positive("Status de analise admin invalido."),
});

module.exports = {
  createReporteSchema,
  reporteIdParamSchema,
  usuarioIdParamSchema,
  adminReporteListQuerySchema,
  userReporteListQuerySchema,
  updateStatusAdminSchema,
  forwardReporteSchema,
};
