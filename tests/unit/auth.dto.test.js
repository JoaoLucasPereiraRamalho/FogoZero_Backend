"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
} = require("../../src/dtos/auth.dto");

// ---------------------------------------------------------------------------
// registerSchema
// ---------------------------------------------------------------------------
describe("registerSchema", () => {
  const BASE = {
    nome: "Ana Souza",
    email: "ana@exemplo.com",
    telefone: "31999990000",
    senha: "segura123",
    id_regiao: 1,
  };

  it("happy path: dados validos devem passar", () => {
    const resultado = registerSchema.safeParse(BASE);
    assert.equal(resultado.success, true);
  });

  it("deve rejeitar email invalido", () => {
    const resultado = registerSchema.safeParse({
      ...BASE,
      email: "nao-e-email",
    });
    assert.equal(resultado.success, false);
    const campos = resultado.error.issues.map((i) => i.path.join("."));
    assert.ok(campos.includes("email"));
  });

  it("deve rejeitar nome muito curto (< 2 chars)", () => {
    const resultado = registerSchema.safeParse({ ...BASE, nome: "A" });
    assert.equal(resultado.success, false);
    const campos = resultado.error.issues.map((i) => i.path.join("."));
    assert.ok(campos.includes("nome"));
  });

  it("deve rejeitar telefone curto demais (< 10 chars)", () => {
    const resultado = registerSchema.safeParse({ ...BASE, telefone: "31999" });
    assert.equal(resultado.success, false);
    const campos = resultado.error.issues.map((i) => i.path.join("."));
    assert.ok(campos.includes("telefone"));
  });

  it("deve rejeitar senha curta (< 6 chars)", () => {
    const resultado = registerSchema.safeParse({ ...BASE, senha: "123" });
    assert.equal(resultado.success, false);
    const campos = resultado.error.issues.map((i) => i.path.join("."));
    assert.ok(campos.includes("senha"));
  });

  it("deve rejeitar id_regiao zero ou negativo", () => {
    for (const id of [0, -1]) {
      const resultado = registerSchema.safeParse({ ...BASE, id_regiao: id });
      assert.equal(resultado.success, false, `id_regiao=${id} deveria falhar`);
    }
  });

  it("deve coercear id_regiao de string para numero", () => {
    const resultado = registerSchema.safeParse({ ...BASE, id_regiao: "5" });
    assert.equal(resultado.success, true);
    assert.equal(resultado.data.id_regiao, 5);
  });
});

// ---------------------------------------------------------------------------
// loginSchema
// ---------------------------------------------------------------------------
describe("loginSchema", () => {
  const BASE = { email: "user@exemplo.com", senha: "minhasenha" };

  it("happy path: dados validos devem passar", () => {
    const resultado = loginSchema.safeParse(BASE);
    assert.equal(resultado.success, true);
  });

  it("deve rejeitar email invalido", () => {
    const resultado = loginSchema.safeParse({ ...BASE, email: "invalido" });
    assert.equal(resultado.success, false);
    const campos = resultado.error.issues.map((i) => i.path.join("."));
    assert.ok(campos.includes("email"));
  });

  it("deve rejeitar senha vazia", () => {
    const resultado = loginSchema.safeParse({ ...BASE, senha: "" });
    assert.equal(resultado.success, false);
    const campos = resultado.error.issues.map((i) => i.path.join("."));
    assert.ok(campos.includes("senha"));
  });
});

// ---------------------------------------------------------------------------
// resetPasswordSchema
// ---------------------------------------------------------------------------
describe("resetPasswordSchema", () => {
  const BASE = { token: "tok123", senha: "novasenha" };

  it("happy path: dados validos devem passar", () => {
    const resultado = resetPasswordSchema.safeParse(BASE);
    assert.equal(resultado.success, true);
  });

  it("deve rejeitar token ausente/vazio", () => {
    const resultado = resetPasswordSchema.safeParse({ ...BASE, token: "" });
    assert.equal(resultado.success, false);
    const campos = resultado.error.issues.map((i) => i.path.join("."));
    assert.ok(campos.includes("token"));
  });

  it("deve rejeitar senha curta (< 6 chars)", () => {
    const resultado = resetPasswordSchema.safeParse({ ...BASE, senha: "12" });
    assert.equal(resultado.success, false);
    const campos = resultado.error.issues.map((i) => i.path.join("."));
    assert.ok(campos.includes("senha"));
  });
});
