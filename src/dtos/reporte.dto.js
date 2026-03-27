const { z } = require("zod");

const criarReporteDTO = z.object({
  usuario_id: z.number().int().positive("ID de usuário inválido."),
  assunto: z
    .string()
    .min(3, "O assunto deve ter pelo menos 3 caracteres.")
    .optional(),
  latitude: z.number({ required_error: "Latitude é obrigatória." }),
  longitude: z.number({ required_error: "Longitude é obrigatória." }),
  imagem_url: z.string().url("A URL da imagem é inválida.").optional(),
});

module.exports = {
  criarReporteDTO,
};
