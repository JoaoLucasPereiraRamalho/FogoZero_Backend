const { z } = require("zod");

const biomaIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Id do bioma invalido."),
});

const registrosQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  data_inicio: z.coerce.date().optional(),
  data_fim: z.coerce.date().optional(),
});

module.exports = {
  biomaIdParamSchema,
  registrosQuerySchema,
};
