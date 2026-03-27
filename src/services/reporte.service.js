const ReporteRepository = require("../repositories/reporte.repository");

class ReporteService {
  async registrarNovoReporte(dados) {
    const reporteParaSalvar = {
      ...dados,
      id_status_analise_ia: 1,
      id_status_analise_admin: 1,
    };

    return await ReporteRepository.criar(reporteParaSalvar);
  }

  async listarTodos() {
    return await ReporteRepository.buscarTodos();
  }
}

module.exports = new ReporteService();
