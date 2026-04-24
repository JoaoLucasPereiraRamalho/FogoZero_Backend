const monitoramentoRepository = require("../repositories/monitoramento.repository");

const monitoramentoController = {
  // Adiciona uma nova cidade para monitorizar
  async store(req, res) {
    try {
      const { cidade, estado } = req.body;
      const usuarioId = req.user.userId;

      if (!cidade) {
        return res
          .status(400)
          .json({ error: "O nome da cidade é obrigatório." });
      }

      const novoMonitoramento = await monitoramentoRepository.criar({
        cidade,
        estado: estado || "MG",
        usuarioId,
      });

      return res.status(201).json(novoMonitoramento);
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(400).json({ error: "Já monitoriza esta cidade." });
      }
      return res.status(500).json({ error: "Erro ao salvar monitorização." });
    }
  },

  // Lista as cidades que o utilizador logado segue
  async index(req, res) {
    try {
      const usuarioId = req.user.userId;
      const cidades = await monitoramentoRepository.listarPorUsuario(usuarioId);
      return res.json(cidades);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao listar cidades." });
    }
  },

  // Remove uma cidade da monitorização
  async delete(req, res) {
    try {
      const { id } = req.params;
      await monitoramentoRepository.deletar(id);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: "Erro ao remover cidade." });
    }
  },
};

module.exports = monitoramentoController;
