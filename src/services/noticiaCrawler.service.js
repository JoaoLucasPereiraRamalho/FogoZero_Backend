const Parser = require("rss-parser");
const axios = require("axios");
const alertaService = require("./alerta.service");

const palavrasChave = [
  "fogo",
  "incêndio",
  "queimada",
  "bombeiros",
  "fumaça",
  "clima seco",
  "defesa civil",
  "brigadistas",
];

const noticiaCrawler = {
  getParser() {
    return new Parser({
      timeout: 5000,
      customFields: {
        item: [
          ["content:encoded", "conteudo_completo"],
          ["description", "descricao"],
          ["media:content", "midia"],
        ],
      },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
  },

  obterDadosMock() {
    return [
      {
        titulo: "[MOCK] Focos de incêndio controlados em Lavras",
        descricao:
          "Equipes do corpo de bombeiros conseguiram conter as chamas que ameaçavam a vegetação nativa.",
        link: "https://example.com/noticia-mock-1",
        data_publicacao: new Date(),
        autor: "Sistema FogoZero",
      },
    ];
  },

  async capturarAgenciaMinas() {
    console.log(
      "🔍 Robô: Iniciando captura exploratória em fontes de Meio Ambiente...",
    );

    const urlsTentativas = [
      "https://g1.globo.com/dynamo/natureza/rss2.xml",
      "https://g1.globo.com/dynamo/mg/centro-oeste/rss2.xml",
      "https://www.agenciaminas.mg.gov.br/noticias/meio-ambiente/rss.xml",
      "https://noticias.uol.com.br/meio-ambiente/index.xml",
    ];

    for (const feedUrl of urlsTentativas) {
      try {
        console.log(`📡 Robô: Tentando conectar em ${feedUrl}...`);

        const response = await axios.get(feedUrl, {
          timeout: 10000,
          responseType: "text",
        });

        let xmlLimpo = response.data.trim();

        if (xmlLimpo.indexOf("<") !== 0) {
          xmlLimpo = xmlLimpo.substring(xmlLimpo.indexOf("<"));
        }

        const parser = this.getParser();
        const feed = await parser.parseString(xmlLimpo);

        if (feed && feed.items.length > 0) {
          console.log(
            `✅ Robô: Conectado! Analisando ${feed.items.length} notícias.`,
          );

          const noticiasFiltradas = feed.items.filter((item) => {
            const titulo = (item.title || "").toLowerCase();
            const descricao = (
              item.description ||
              item.contentSnippet ||
              ""
            ).toLowerCase();
            const textoParaAnalise = `${titulo} ${descricao}`;

            return palavrasChave.some((palavra) =>
              textoParaAnalise.includes(palavra.toLowerCase()),
            );
          });

          if (noticiasFiltradas.length > 0) {
            console.log(
              `🔥 Robô: ${noticiasFiltradas.length} notícias relevantes encontradas.`,
            );

            const noticiasMapeadas = noticiasFiltradas.map((item) => ({
              titulo: item.title,
              descricao:
                item.description ||
                item.conteudo_completo ||
                item.contentSnippet ||
                "",
              link: item.link,
              data_publicacao: item.pubDate
                ? new Date(item.pubDate)
                : new Date(),
              autor: item.author || "Fonte Externa",
              imagem_url: this.extrairImagemDoItem(item),
            }));

            noticiasMapeadas.forEach(async (noticia) => {
              const cidade = this.detectarCidadeNoTexto(
                `${noticia.titulo} ${noticia.descricao}`,
              );
              if (cidade) {
                console.log(
                  `🔔 Robô: Alerta detectado para a cidade de ${cidade}!`,
                );
                alertaService
                  .processarNovoEvento(cidade, "NOTÍCIA", noticia.titulo)
                  .catch((err) => {
                    console.error(`❌ Erro ao disparar alerta: ${err.message}`);
                  });
              }
            });

            return noticiasMapeadas;
          }

          console.log(
            "⚠️ Nenhuma notícia relevante neste feed. Tentando próximo...",
          );
        }
      } catch (error) {
        console.warn(
          `⚠️ Robô: Falha ao processar ${feedUrl}: ${error.message}`,
        );
      }
    }

    console.info("💡 Robô: Nenhuma notícia externa encontrada. Usando Mock.");
    return this.obterDadosMock();
  },

  extrairImagemDoItem(item) {
    if (item.enclosure?.url) return item.enclosure.url;
    if (item.midia) return item.midia;

    const conteudo = item.description || item["content:encoded"] || "";
    const match = conteudo.match(/<img[^>]+src=["']([^"']+)["']/);

    return match ? match[1] : null;
  },

  detectarCidadeNoTexto(texto) {
    const cidadesMonitoradas = [
      "Lavras",
      "Lagoa da Prata",
      "Divinópolis",
      "Belo Horizonte",
    ];
    const textoMinusculo = texto.toLowerCase();

    return (
      cidadesMonitoradas.find((cidade) =>
        textoMinusculo.includes(cidade.toLowerCase()),
      ) || null
    );
  },
};

module.exports = noticiaCrawler;
