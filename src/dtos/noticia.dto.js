const { z } = require("zod");

const noticiaDTO = {
  validarImportacao: (dados) => {
    const schema = z.object({
      titulo: z.string().min(5, "Título deve ter no mínimo 5 caracteres"),
      slug: z.string().min(3, "Slug deve ter no mínimo 3 caracteres"),
      conteudo: z.string().min(10, "Conteúdo deve ter no mínimo 10 caracteres"),
      imagem_capa: z.string().url().optional().nullable(),
      fonte_url: z.string().url("URL inválida"),
      data_publicacao: z.date().optional(),
      autor_id: z.number().positive(),
    });

    return schema.parse(dados);
  },

  transformarRSS: (item) => {
    const tituloRaw = item.title || item.titulo || item.item?.title || "";

    const titulo =
      tituloRaw.trim() ||
      (item.contentSnippet
        ? item.contentSnippet.substring(0, 50)
        : `Noticia-${Date.now()}`);

    const conteudo =
      item.contentSnippet ||
      item.description ||
      item.content ||
      "Conteúdo indisponível no momento.";

    const imagem_capa =
      item.media?.content?.url ||
      item.enclosure?.url ||
      (item.media && item.media["$"] ? item.media["$"].url : null);

    const fonte_url = item.link || item.guid || null;
    const data_publicacao = item.pubDate ? new Date(item.pubDate) : new Date();

    const slug =
      titulo
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .substring(0, 80) +
      "-" +
      Math.floor(Math.random() * 10000);

    return {
      titulo: titulo.substring(0, 255),
      slug,
      conteudo: conteudo.substring(0, 5000),
      imagem_capa,
      fonte_url,
      data_publicacao,
    };
  },

  formatarResposta: (noticia) => {
    return {
      id: noticia.id,
      titulo: noticia.titulo,
      slug: noticia.slug,
      conteudo: noticia.conteudo.substring(0, 500) + "...",
      imagem_capa: noticia.imagem_capa,
      fonte_url: noticia.fonte_url,
      status: noticia.status,
      data_importacao: noticia.data_importacao,
      data_publicacao: noticia.data_publicacao,
      autor: noticia.autor,
    };
  },
};

const criarNoticiaSchema = z.object({
  titulo: z.string().min(5, "Título muito curto"),
  conteudo: z.string().min(20, "O conteúdo deve ser mais detalhado"),
  imagem_capa: z.string().url().optional(),
  autor_id: z.number(),
});

module.exports = noticiaDTO;
module.exports.criarNoticiaSchema = criarNoticiaSchema;
