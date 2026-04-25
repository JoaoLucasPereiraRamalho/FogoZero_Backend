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

const anoQuerySchema = z.object({
  ano: z.coerce
    .number()
    .int()
    .min(2015, "Ano minimo permitido: 2015.")
    .max(2030, "Ano maximo permitido: 2030.")
    .optional(),
});

module.exports = {
  biomaIdParamSchema,
  registrosQuerySchema,
  anoQuerySchema,
};
