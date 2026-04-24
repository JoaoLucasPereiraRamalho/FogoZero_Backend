const QueimadaRepository = require("../repositories/queimada.repository");
const RegiaoRepository = require("../repositories/regiao.repository"); // Necessário para pegar o nome da cidade
const AlertaService = require("./alerta.service");

class QueimadaService {
  async consultar(filtros) {
    const registros = await QueimadaRepository.buscarPorFiltros(filtros);

    // Aqui você poderia, por exemplo, calcular o total de focos
    // const totalFocos = registros.reduce((acc, curr) => acc + (curr.quantidade_focos || 0), 0);

    return registros;
  }

  async registrarFocos(dados) {
    // 1. Salva o registro de queimada no banco
    const novoRegistro = await QueimadaRepository.criar(dados);

    // 2. Busca os detalhes da região para saber o nome da cidade
    const regiao = await RegiaoRepository.findById(dados.id_regiao);

    // 3. Se houver focos e a região for encontrada, dispara o alerta
    if (novoRegistro.quantidade_focos > 0 && regiao) {
      const detalhes = `${novoRegistro.quantidade_focos} focos de incêndio detectados via satélite (${novoRegistro.fonte_dados || "INPE"}).`;

      // Dispara o alerta de forma assíncrona (não trava a resposta da requisição)
      AlertaService.processarNovoEvento(regiao.nome, "QUEIMADA", detalhes);
    }

    return novoRegistro;
  }
}

module.exports = new QueimadaService();
