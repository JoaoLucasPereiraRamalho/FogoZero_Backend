const prisma = require("../config/database");

const noticiaRepository = {
  async criar(dados) {
    return await prisma.noticia.create({
      data: {
        titulo: dados.titulo,
        slug: dados.slug,
        conteudo: dados.conteudo,
        imagem_capa: dados.imagem_capa,
        fonte_url: dados.fonte_url,
        data_publicacao: dados.data_publicacao,
        status: "PENDENTE",
        autor_id: dados.autor_id,
      },
    });
  },

  async buscarPorSlug(slug) {
    try {
      return await prisma.noticia.findUnique({
        where: { slug: slug },
      });
    } catch (error) {
      throw error;
    }
  },

  async buscarPorFonteUrl(fonte_url) {
    try {
      const noticia = await prisma.noticia.findFirst({
        where: { fonte_url },
      });
      return noticia;
    } catch (error) {
      throw error;
    }
  },

  async listar(opcoes = {}) {
    try {
      const noticias = await prisma.noticia.findMany({
        where: opcoes.where || {},
        skip: opcoes.skip,
        take: opcoes.take,
        orderBy: opcoes.orderBy || { data_importacao: "desc" },
        include: {
          autor: true,
        },
      });
      return noticias;
    } catch (error) {
      throw error;
    }
  },

  async atualizarStatus(id, status) {
    try {
      const noticia = await prisma.noticia.update({
        where: { id },
        data: { status },
      });
      return noticia;
    } catch (error) {
      throw error;
    }
  },
};

module.exports = noticiaRepository;
