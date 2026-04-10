const { z } = require("zod");

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const noticiaIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Id da noticia invalido."),
});

const glossarioIdParamSchema = z.object({
  id: z.coerce.number().int().positive("Id do glossario invalido."),
});

const termoParamSchema = z.object({
  termo: z
    .string()
    .trim()
    .min(1, "Termo para busca e obrigatorio.")
    .max(120, "Termo excede o tamanho permitido."),
});

const createNoticiaSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(3, "Titulo deve ter ao menos 3 caracteres.")
    .max(200, "Titulo excede o tamanho permitido."),
  link_origem: z.string().trim().url("Link de origem invalido."),
  img_destaque_url: z
    .string()
    .trim()
    .url("URL da imagem de destaque invalida.")
    .optional(),
  adm_id: z.coerce.number().int().positive("Id do administrador invalido."),
});

const updateNoticiaSchema = createNoticiaSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe ao menos um campo para atualizar a noticia.",
  });

const noticiaListQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).max(200).optional(),
});

const createGlossarioSchema = z.object({
  termo: z
    .string()
    .trim()
    .min(2, "Termo deve ter ao menos 2 caracteres.")
    .max(120, "Termo excede o tamanho permitido."),
  definicao: z
    .string()
    .trim()
    .min(5, "Definicao deve ter ao menos 5 caracteres.")
    .max(3000, "Definicao excede o tamanho permitido."),
});

const updateGlossarioSchema = createGlossarioSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe ao menos um campo para atualizar o glossario.",
  });

const glossarioListQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).max(120).optional(),
});

module.exports = {
  noticiaIdParamSchema,
  glossarioIdParamSchema,
  termoParamSchema,
  createNoticiaSchema,
  updateNoticiaSchema,
  noticiaListQuerySchema,
  createGlossarioSchema,
  updateGlossarioSchema,
  glossarioListQuerySchema,
};
