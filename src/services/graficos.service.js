class GraficosService {
  normalizarNomeArquivo(nome) {
    return nome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[-\s]+/g, '_')
      .replace(/[^\w]/g, '');
  }

  buscarAssetsPorMunicipio(nomeMunicipio) {
    if (!nomeMunicipio) {
      throw new Error('Nome do município é obrigatório.');
    }

    const nomeArquivo = this.normalizarNomeArquivo(nomeMunicipio);
    const baseUrl = process.env.SUPABASE_URL;

    if (!baseUrl) {
      throw new Error('SUPABASE_URL não configurada no ambiente.');
    }

    return {
      municipio: nomeMunicipio,
      nome_arquivo: nomeArquivo,
      grafico_mes_url: `${baseUrl}/storage/v1/object/public/mapas/focosMes/grafico_mes_${nomeArquivo}.png`,
      grafico_taxa_url: `${baseUrl}/storage/v1/object/public/mapas/focosTaxa/grafico_taxa_${nomeArquivo}.png`,
      mapa_url: `${baseUrl}/storage/v1/object/public/mapas/mapasFocos/mapa_focos_${nomeArquivo}.html`,
    };
  }
}

module.exports = new GraficosService();