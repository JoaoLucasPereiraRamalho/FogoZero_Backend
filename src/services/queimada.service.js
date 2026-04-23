const QueimadaRepository = require("../repositories/queimada.repository");

class QueimadaService {
  async consultar(filtros) {
    const registros = await QueimadaRepository.buscarPorFiltros(filtros);

    // Aqui você poderia, por exemplo, calcular o total de focos
    // const totalFocos = registros.reduce((acc, curr) => acc + (curr.quantidade_focos || 0), 0);

    return registros;
  }
}

module.exports = new QueimadaService();
