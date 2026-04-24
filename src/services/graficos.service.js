const AppError = require("../utils/appError");

function normalizarNomeArquivo(nome) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[-\s]+/g, "_")
    .replace(/[^\w]/g, "");
}

function buscarAssetsPorMunicipio(nomeMunicipio) {
  if (!nomeMunicipio) {
    throw new AppError("Nome do municipio e obrigatorio.", 400);
  }

  const baseUrl = process.env.SUPABASE_URL;
  if (!baseUrl) {
    throw new AppError("SUPABASE_URL nao configurada no ambiente.", 500);
  }

  const nomeArquivo = normalizarNomeArquivo(nomeMunicipio);

  return {
    municipio: nomeMunicipio,
    nome_arquivo: nomeArquivo,
    grafico_mes_url: `${baseUrl}/storage/v1/object/public/mapas/focosMes/grafico_mes_${nomeArquivo}.png`,
    grafico_taxa_url: `${baseUrl}/storage/v1/object/public/mapas/focosTaxa/grafico_taxa_${nomeArquivo}.png`,
    mapa_url: `${baseUrl}/storage/v1/object/public/mapas/mapasFocos/mapa_focos_${nomeArquivo}.html`,
  };
}

module.exports = {
  buscarAssetsPorMunicipio,
};
