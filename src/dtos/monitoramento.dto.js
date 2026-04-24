const { z } = require("zod");

const criarMonitoramentoSchema = z.object({
  cidade: z.string().min(2, "Nome da cidade é obrigatório"),
  estado: z.string().length(2).optional().default("MG"),
  notificar: z.boolean().optional().default(true),
});

module.exports = { criarMonitoramentoSchema };
