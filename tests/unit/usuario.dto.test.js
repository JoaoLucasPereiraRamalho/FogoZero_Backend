"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  usuarioIdParamSchema,
  updateUsuarioSchema,
  adminUpdateUsuarioSchema,
} = require("../../src/dtos/usuario.dto");

// ---------------------------------------------------------------------------
// usuarioIdParamSchema
// ---------------------------------------------------------------------------
describe("usuarioIdParamSchema", () => {
  it("deve coercear string numerica para number", () => {
    const resultado = usuarioIdParamSchema.safeParse({ id: "42" });
    assert.equal(resultado.success, true);
    assert.equal(resultado.data.id, 42);
  });

  it("deve aceitar number diretamente", () => {
    const resultado = usuarioIdParamSchema.safeParse({ id: 7 });
    assert.equal(resultado.success, true);
    assert.equal(resultado.data.id, 7);
  });

  it("deve rejeitar id zero", () => {
    const resultado = usuarioIdParamSchema.safeParse({ id: 0 });
    assert.equal(resultado.success, false);
  });

  it("deve rejeitar id negativo", () => {
    const resultado = usuarioIdParamSchema.safeParse({ id: -5 });
    assert.equal(resultado.success, false);
  });

  it("deve rejeitar string nao-numerica", () => {
    const resultado = usuarioIdParamSchema.safeParse({ id: "abc" });
    assert.equal(resultado.success, false);
  });
});

// ---------------------------------------------------------------------------
// updateUsuarioSchema
// ---------------------------------------------------------------------------
describe("updateUsuarioSchema", () => {
  it("deve aceitar objeto vazio (todos os campos sao opcionais)", () => {
    const resultado = updateUsuarioSchema.safeParse({});
    assert.equal(resultado.success, true);
  });

  it("happy path: todos os campos preenchidos", () => {
    const resultado = updateUsuarioSchema.safeParse({
      nome: "João Silva",
      telefone: "31988887777",
      id_regiao: 3,
    });
    assert.equal(resultado.success, true);
  });

  it("deve rejeitar nome muito curto (< 2 chars)", () => {
    const resultado = updateUsuarioSchema.safeParse({ nome: "X" });
    assert.equal(resultado.success, false);
    const campos = resultado.error.issues.map((i) => i.path.join("."));
    assert.ok(campos.includes("nome"));
  });

  it("deve rejeitar telefone muito curto (< 8 chars)", () => {
    const resultado = updateUsuarioSchema.safeParse({ telefone: "3188" });
    assert.equal(resultado.success, false);
    const campos = resultado.error.issues.map((i) => i.path.join("."));
    assert.ok(campos.includes("telefone"));
  });

  it("nao deve aceitar campo tipo (campo exclusivo de admin)", () => {
    const resultado = updateUsuarioSchema.safeParse({ tipo: "administrador" });
    if (resultado.success) {
      assert.equal("tipo" in resultado.data, false);
    }
  });
});

// ---------------------------------------------------------------------------
// adminUpdateUsuarioSchema
// ---------------------------------------------------------------------------
describe("adminUpdateUsuarioSchema", () => {
  it('deve aceitar tipo "administrador"', () => {
    const resultado = adminUpdateUsuarioSchema.safeParse({
      tipo: "administrador",
    });
    assert.equal(resultado.success, true);
    assert.equal(resultado.data.tipo, "administrador");
  });

  it('deve aceitar tipo "usuario"', () => {
    const resultado = adminUpdateUsuarioSchema.safeParse({ tipo: "usuario" });
    assert.equal(resultado.success, true);
    assert.equal(resultado.data.tipo, "usuario");
  });

  it("deve rejeitar tipo invalido", () => {
    const resultado = adminUpdateUsuarioSchema.safeParse({
      tipo: "superadmin",
    });
    assert.equal(resultado.success, false);
    const campos = resultado.error.issues.map((i) => i.path.join("."));
    assert.ok(campos.includes("tipo"));
  });

  it("deve herdar validacao de nome do schema base", () => {
    const resultado = adminUpdateUsuarioSchema.safeParse({ nome: "A" });
    assert.equal(resultado.success, false);
    const campos = resultado.error.issues.map((i) => i.path.join("."));
    assert.ok(campos.includes("nome"));
  });
});
