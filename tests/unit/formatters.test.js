"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { formatarDataBR } = require("../../src/utils/formatters");

describe("formatarDataBR", () => {
  it("deve retornar data no formato DD/MM/AAAA", () => {
    const resultado = formatarDataBR("2024-06-15T12:00:00.000Z");
    // Formato esperado: 15/06/2024 (pode variar 1 dia dependendo do UTC offset local)
    assert.match(resultado, /^\d{2}\/\d{2}\/\d{4}$/);
  });

  it("deve aceitar instância de Date", () => {
    const data = new Date(2023, 0, 1);
    const resultado = formatarDataBR(data);
    assert.match(resultado, /^\d{2}\/\d{2}\/\d{4}$/);
    assert.ok(resultado.endsWith("/2023"));
  });

  it("deve aceitar string ISO completa", () => {
    const resultado = formatarDataBR("2020-12-31T00:00:00");
    assert.match(resultado, /^\d{2}\/\d{2}\/\d{4}$/);
  });

  it("deve rejeitar datas invalidas lançando erro", () => {
    assert.throws(() => formatarDataBR("nao-e-uma-data"), Error);
  });
});
