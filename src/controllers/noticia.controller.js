const noticiaCrawler = require("../services/noticiaCrawler.service");
const noticiaRepository = require("../repositories/noticia.repository");
const noticiaDTO = require("../dtos/noticia.dto");
const alertaService = require("../services/alerta.service");

const importacaoStatus = {};

const noticiaController = {
  async importar(req, res) {
    const startTime = Date.now();
    const importId = `imp_${Date.now()}`;

    try {
      const autorId = req.body?.autorId || 1;

      importacaoStatus[importId] = {
        id: importId,
        status: "processando",
        total: 0,
        salvas: 0,
        erros: 0,
        dataInicio: new Date(),
        dataFim: null,
        mensagem: "Iniciando importação...",
      };

      res.status(202).json({
        mensagem: "✅ Importação iniciada! Processando em background...",
        importId,
        statusUrl: `/api/noticias/status/${importId}`,
      });

      processarImportacao(importId, autorId).catch((err) => {
        console.error(`💥 Erro em importação ${importId}:`, err.message);
        importacaoStatus[importId].status = "erro";
        importacaoStatus[importId].mensagem = err.message;
      });
    } catch (error) {
      console.error("💥 Erro ao iniciar importação:", error.message);
      return res.status(500).json({
        erro: error.message,
        mensagem: "Erro ao iniciar importação",
      });
    }
  },

  async obterStatus(req, res) {
    const { importId } = req.params;

    if (!importacaoStatus[importId]) {
      return res.status(404).json({
        erro: "Importação não encontrada",
        importId,
      });
    }

    const status = importacaoStatus[importId];
    return res.json({
      ...status,
      tempoDecorrido: Date.now() - new Date(status.dataInicio).getTime(),
    });
  },

  async listar(req, res) {
    try {
      const { status, pagina = 1, limite = 10 } = req.query;

      const opcoes = {
        skip: (pagina - 1) * limite,
        take: parseInt(limite),
        where: {},
      };

      if (status) {
        opcoes.where.status = status.toUpperCase();
      }

      const noticias = await noticiaRepository.listar(opcoes);

      return res.json({
        mensagem: "Notícias listadas com sucesso",
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        total: noticias.length,
        noticias: noticias.map(noticiaDTO.formatarResposta),
      });
    } catch (error) {
      console.error("Erro ao listar notícias:", error.message);
      return res.status(500).json({
        erro: error.message,
        mensagem: "Erro ao listar notícias",
      });
    }
  },

  async atualizarStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !["PENDENTE", "APROVADA", "REJEITADA"].includes(status)) {
        return res.status(400).json({
          erro: "Status inválido. Use: PENDENTE, APROVADA ou REJEITADA",
        });
      }

      const noticia = await noticiaRepository.atualizarStatus(
        parseInt(id),
        status,
      );

      return res.json({
        mensagem: "Status atualizado com sucesso",
        noticia: noticiaDTO.formatarResposta(noticia),
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error.message);
      return res.status(500).json({
        erro: error.message,
        mensagem: "Erro ao atualizar status",
      });
    }
  },
};

async function processarImportacao(importId, autorId) {
  const startTime = Date.now();
  console.log(`\n📡 [${importId}] Processamento iniciado em background...\n`);

  try {
    console.log(`[${importId}] 🔍 Capturando notícias do RSS...`);
    const noticiasCapturadas = await noticiaCrawler.capturarAgenciaMinas();

    importacaoStatus[importId].total = noticiasCapturadas.length;

    if (!noticiasCapturadas || noticiasCapturadas.length === 0) {
      console.log(`[${importId}] ⚠️ Nenhuma notícia encontrada no feed`);
      importacaoStatus[importId].status = "completo";
      importacaoStatus[importId].mensagem =
        "Nenhuma notícia encontrada no feed";
      importacaoStatus[importId].dataFim = new Date();
      return;
    }

    const noticiasSalvas = [];
    const erros = [];

    console.log(
      `[${importId}] 📰 Processando ${noticiasCapturadas.length} notícias...`,
    );

    for (const noticiaRaw of noticiasCapturadas) {
      try {
        const dadosTransformados = noticiaDTO.transformarRSS(noticiaRaw);

        const jaExiste = await noticiaRepository.buscarPorSlug(
          dadosTransformados.slug,
        );

        if (jaExiste) {
          console.log(
            `[${importId}] ⏭️ Notícia já existe: ${dadosTransformados.slug}`,
          );
          continue;
        }

        const dadosParaSalvar = {
          ...dadosTransformados,
          autor_id: autorId,
        };

        const dadosValidados = noticiaDTO.validarImportacao(dadosParaSalvar);

        const noticiaSalva = await noticiaRepository.criar(dadosValidados);
        noticiasSalvas.push(noticiaSalva);

        console.log(`[${importId}] ✅ Notícia salva: ${noticiaSalva.titulo}`);

        try {
          const cidade = extrairCidade(noticiaSalva.titulo);
          if (cidade) {
            console.log(`[${importId}] 📍 Cidade detectada: ${cidade}`);
            alertaService
              .notificarNoticia(
                noticiaSalva.titulo,
                noticiaSalva.conteudo,
                cidade,
                noticiaSalva.fonte_url,
              )
              .catch((err) => {
                console.error(
                  `[${importId}] ⚠️ Erro ao enviar alertas: ${err.message}`,
                );
              });
          }
        } catch (erroAlerta) {
          console.error(
            `[${importId}] ⚠️ Erro ao processar alertas: ${erroAlerta.message}`,
          );
        }
      } catch (erro) {
        importacaoStatus[importId].erros++;
        console.error(
          `[${importId}] ⚠️ Erro ao processar notícia: ${erro.message}`,
        );
        erros.push({
          titulo: noticiaRaw.titulo,
          erro: erro.message,
        });
      }
    }

    const duration = Date.now() - startTime;
    console.log(`\n[${importId}] 🏁 Importação concluída em ${duration}ms!`);
    console.log(
      `[${importId}] Total: ${noticiasCapturadas.length}, Salvas: ${noticiasSalvas.length}, Erros: ${erros.length}\n`,
    );

    importacaoStatus[importId].status = "completo";
    importacaoStatus[importId].salvas = noticiasSalvas.length;
    importacaoStatus[importId].dataFim = new Date();
    importacaoStatus[importId].mensagem =
      `Importação concluída: ${noticiasSalvas.length} notícias salvas`;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `[${importId}] 💥 Erro no robô (${duration}ms): ${error.message}`,
    );
    importacaoStatus[importId].status = "erro";
    importacaoStatus[importId].mensagem = error.message;
    importacaoStatus[importId].dataFim = new Date();
  }
}

module.exports = noticiaController;
module.exports.processarImportacao = processarImportacao;
module.exports.importacaoStatus = importacaoStatus;

function extrairCidade(titulo) {
  const cidades = [
    "Belo Horizonte",
    "Brumadinho",
    "Lagoa da Prata",
    "Divinópolis",
    "Governador Valadares",
    "Montes Claros",
    "Juiz de Fora",
    "Contagem",
    "Betim",
    "Uberlândia",
    "Anápolis",
    "Araxá",
    "Itabira",
    "Timóteo",
    "Ipatinga",
    "Caratinga",
    "Ouro Preto",
    "Mariana",
    "São João del-Rei",
    "Congonhas",
    "Itajubá",
    "Poços de Caldas",
    "Lavras",
    "Passos",
    "Iguatama",
    "Nova Lima",
    "Sabará",
    "Santa Bárbara",
    "Itabira",
    "João Monlevade",
    "Açucena",
    "Viçosa",
    "Ponte Nova",
    "Aimorés",
    "Itueta",
    "Nanuque",
    "Teófilo Otoni",
    "Turmalina",
    "Almenara",
    "Araçuaí",
    "Fagundes",
    "Jequitinhonha",
    "Franciscópolis",
    "Berilo",
    "Capelinha",
    "Diamantina",
    "Couto de Magalhães de Minas",
  ];

  const tituloLower = titulo.toLowerCase();

  for (const cidade of cidades) {
    if (tituloLower.includes(cidade.toLowerCase())) {
      return cidade;
    }
  }

  return null;
}
