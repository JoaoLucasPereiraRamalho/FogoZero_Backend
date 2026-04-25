"use strict";

const { describe, it, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");

const {
  requireRole,
  requireSelf,
  requireSelfOrAdmin,
} = require("../../src/middlewares/authorize.middleware");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeReq({ user = undefined, params = {} } = {}) {
  return { user, params };
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
    const last = calls[calls.length - 1];
    return last === undefined;
  };
  return next;
}

// ---------------------------------------------------------------------------
// requireRole
// ---------------------------------------------------------------------------
describe("requireRole", () => {
  it("deve chamar next(AppError 401) quando req.user nao existe", () => {
    const middleware = requireRole(["administrador"]);
    const req = makeReq({ user: undefined });
    const next = captureNext();

    middleware(req, {}, next);

    assert.ok(next.calledWithError());
    assert.equal(next.lastArg().statusCode, 401);
  });

  it("deve chamar next(AppError 403) quando role nao corresponde", () => {
    const middleware = requireRole(["administrador"]);
    const req = makeReq({ user: { userId: 1, tipo: "usuario" } });
    const next = captureNext();

    middleware(req, {}, next);

    assert.ok(next.calledWithError());
    assert.equal(next.lastArg().statusCode, 403);
  });

  it("deve chamar next() sem erro quando role corresponde", () => {
    const middleware = requireRole(["administrador"]);
    const req = makeReq({ user: { userId: 1, tipo: "administrador" } });
    const next = captureNext();

    middleware(req, {}, next);

    assert.ok(next.calledClean());
  });

  it("deve ser case-insensitive para roles", () => {
    const middleware = requireRole(["Administrador"]);
    const req = makeReq({ user: { userId: 1, tipo: "ADMINISTRADOR" } });
    const next = captureNext();

    middleware(req, {}, next);

    assert.ok(next.calledClean());
  });

  it("deve aceitar array de roles multiplas", () => {
    const middleware = requireRole(["usuario", "administrador"]);
    const req = makeReq({ user: { userId: 1, tipo: "usuario" } });
    const next = captureNext();

    middleware(req, {}, next);

    assert.ok(next.calledClean());
  });
});

// ---------------------------------------------------------------------------
// requireSelf
// ---------------------------------------------------------------------------
describe("requireSelf", () => {
  it("deve chamar next(401) quando req.user nao existe", () => {
    const middleware = requireSelf("id");
    const req = makeReq({ user: undefined, params: { id: "10" } });
    const next = captureNext();

    middleware(req, {}, next);

    assert.ok(next.calledWithError());
    assert.equal(next.lastArg().statusCode, 401);
  });

  it("deve chamar next(403) quando userId diferente do param", () => {
    const middleware = requireSelf("id");
    const req = makeReq({ user: { userId: 1 }, params: { id: "99" } });
    const next = captureNext();

    middleware(req, {}, next);

    assert.ok(next.calledWithError());
    assert.equal(next.lastArg().statusCode, 403);
  });

  it("deve chamar next() sem erro quando userId igual ao param", () => {
    const middleware = requireSelf("id");
    const req = makeReq({ user: { userId: 42 }, params: { id: "42" } });
    const next = captureNext();

    middleware(req, {}, next);

    assert.ok(next.calledClean());
  });

  it("NAO deve permitir bypass de admin (requireSelf e estrito)", () => {
    const middleware = requireSelf("id");
    const req = makeReq({
      user: { userId: 1, tipo: "administrador" },
      params: { id: "99" },
    });
    const next = captureNext();

    middleware(req, {}, next);

    // Admin TAMBEM é bloqueado se userId != param (comportamento intencional de requireSelf)
    assert.ok(next.calledWithError());
    assert.equal(next.lastArg().statusCode, 403);
  });
});

// ---------------------------------------------------------------------------
// requireSelfOrAdmin
// ---------------------------------------------------------------------------
describe("requireSelfOrAdmin", () => {
  it("deve chamar next(401) quando req.user nao existe", () => {
    const middleware = requireSelfOrAdmin("id");
    const req = makeReq({ user: undefined, params: { id: "10" } });
    const next = captureNext();

    middleware(req, {}, next);

    assert.ok(next.calledWithError());
    assert.equal(next.lastArg().statusCode, 401);
  });

  it("deve chamar next(403) quando nao e admin e userId diferente do param", () => {
    const middleware = requireSelfOrAdmin("id");
    const req = makeReq({
      user: { userId: 1, tipo: "usuario" },
      params: { id: "99" },
    });
    const next = captureNext();

    middleware(req, {}, next);

    assert.ok(next.calledWithError());
    assert.equal(next.lastArg().statusCode, 403);
  });

  it("deve chamar next() sem erro quando userId igual ao param (nao-admin)", () => {
    const middleware = requireSelfOrAdmin("id");
    const req = makeReq({
      user: { userId: 42, tipo: "usuario" },
      params: { id: "42" },
    });
    const next = captureNext();

    middleware(req, {}, next);

    assert.ok(next.calledClean());
  });

  it("deve chamar next() sem erro quando e admin (mesmo userId diferente)", () => {
    const middleware = requireSelfOrAdmin("id");
    const req = makeReq({
      user: { userId: 1, tipo: "administrador" },
      params: { id: "99" },
    });
    const next = captureNext();

    middleware(req, {}, next);

    assert.ok(next.calledClean());
  });

  it("deve chamar next(400) quando param nao e um numero valido", () => {
    const middleware = requireSelfOrAdmin("id");
    const req = makeReq({
      user: { userId: 1, tipo: "administrador" },
      params: { id: "abc" },
    });
    const next = captureNext();

    middleware(req, {}, next);

    assert.ok(next.calledWithError());
    assert.equal(next.lastArg().statusCode, 400);
  });
});
