const { z } = require("zod");

const consultaQueimadaDTO = z
  .object({
    id_regiao: z.coerce.number().positive("ID da região inválido.").optional(),

    data_inicio: z.coerce.date().optional(),
    data_fim: z.coerce.date().optional(),
  })
  .refine(
    (data) => {
      if (data.data_inicio && data.data_fim) {
        return data.data_inicio <= data.data_fim;
      }
      return true;
    },
    {
      message: "A data de início não pode ser maior que a data de fim.",
      path: ["data_inicio"],
    },
  );

module.exports = {
  consultaQueimadaDTO,
};
