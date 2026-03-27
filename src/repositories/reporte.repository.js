const prisma = require("../config/database");

class ReporteRepository {
  async criar(dados) {
    return await prisma.reporte.create({
      data: dados,
    });
  }

  async buscarTodos() {
    return await prisma.reporte.findMany({
      include: {
        usuario: {
          select: { nome: true, email: true },
        },
      },
    });
  }
}

module.exports = new ReporteRepository();
