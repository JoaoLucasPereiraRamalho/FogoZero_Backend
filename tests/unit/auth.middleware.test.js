"use strict";

// JWT_SECRET deve ser definido ANTES de importar o middleware
process.env.JWT_SECRET = "test-secret-fogozero";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const authMiddleware = require("../../src/middlewares/auth.middleware");

const SECRET = "test-secret-fogozero";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeReq(authorizationHeader) {
  return {
    headers: {
      authorization: authorizationHeader,
    },
  };
}

function captureNext() {
  const calls = [];
  const next = (arg) => calls.push(arg);
  next.calls = calls;
  next.lastArg = () => calls[calls.length - 1];
  next.calledWithError = () => {
    const last = calls[calls.length - 1];
    return last instanceof Error;
  };
  next.calledClean = () => {
    return calls.length > 0 && calls[calls.length - 1] === undefined;
  };
  return next;
}

function makeValidToken(payload = {}) {
  return jwt.sign(
    { userId: 10, email: "test@exemplo.com", tipo: "usuario", ...payload },
    SECRET,
    { expiresIn: "1h" },
  );
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------
describe("authMiddleware", () => {
  it("deve retornar 401 quando header Authorization esta ausente", () => {
    const req = makeReq(undefined);
    const next = captureNext();

    authMiddleware(req, {}, next);

    assert.ok(next.calledWithError());
    assert.equal(next.lastArg().statusCode, 401);
  });

  it("deve retornar 401 quando scheme nao e Bearer", () => {
    const req = makeReq("Basic dXNlcjpwYXNz");
    const next = captureNext();

    authMiddleware(req, {}, next);

    assert.ok(next.calledWithError());
    assert.equal(next.lastArg().statusCode, 401);
  });

  it("deve retornar 401 quando Bearer sem token", () => {
    const req = makeReq("Bearer ");
    const next = captureNext();

    authMiddleware(req, {}, next);

    assert.ok(next.calledWithError());
    assert.equal(next.lastArg().statusCode, 401);
  });

  it('deve retornar 401 com mensagem "Token expirado" para token expirado', () => {
    const expiredToken = jwt.sign(
      { userId: 1, email: "x@x.com", tipo: "usuario" },
      SECRET,
      { expiresIn: -1 }, // expirado imediatamente
    );
    const req = makeReq(`Bearer ${expiredToken}`);
    const next = captureNext();

    authMiddleware(req, {}, next);

    assert.ok(next.calledWithError());
    const err = next.lastArg();
    assert.equal(err.statusCode, 401);
    assert.match(err.message, /expirado/i);
  });

  it("deve retornar 401 para token malformado", () => {
    const req = makeReq("Bearer token.invalido.aqui");
    const next = captureNext();

    authMiddleware(req, {}, next);

    assert.ok(next.calledWithError());
    assert.equal(next.lastArg().statusCode, 401);
  });

  it("deve popular req.user corretamente para token valido", () => {
    const token = makeValidToken({
      userId: 7,
      email: "admin@test.com",
      tipo: "Administrador",
    });
    const req = makeReq(`Bearer ${token}`);
    const next = captureNext();

    authMiddleware(req, {}, next);

    assert.ok(next.calledClean(), "next() deveria ser chamado sem erro");
    assert.equal(req.user.userId, 7);
    assert.equal(req.user.email, "admin@test.com");
    assert.equal(req.user.tipo, "administrador");
  });

  it("deve normalizar tipo para lowercase", () => {
    const token = makeValidToken({ userId: 3, tipo: "USUARIO" });
    const req = makeReq(`Bearer ${token}`);
    const next = captureNext();

    authMiddleware(req, {}, next);

    assert.ok(next.calledClean());
    assert.equal(req.user.tipo, "usuario");
  });
});
