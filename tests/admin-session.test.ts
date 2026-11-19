import assert from "node:assert/strict";
import { after, test } from "node:test";

import {
  createAdminSessionToken,
  createSessionToken,
  verifyAdminSessionToken,
  verifySessionToken,
} from "../src/lib/session";

const oldSecret = process.env.SESSION_SECRET;
process.env.SESSION_SECRET = "test-secret-for-admin-session";
after(() => {
  if (oldSecret === undefined) delete process.env.SESSION_SECRET;
  else process.env.SESSION_SECRET = oldSecret;
});

test("a sessão comum não autoriza o painel", () => {
  const regular = createSessionToken();
  const admin = createAdminSessionToken();

  assert.equal(verifySessionToken(regular), true);
  assert.equal(verifyAdminSessionToken(regular), false);
  assert.equal(verifyAdminSessionToken(admin), true);
  assert.equal(verifySessionToken(admin), false);
});

test("a sessão administrativa expira e rejeita alterações", () => {
  const now = Date.now;
  const createdAt = now();
  try {
    Date.now = () => createdAt;
    const admin = createAdminSessionToken();
    assert.equal(verifyAdminSessionToken(`${admin}x`), false);
    Date.now = () => createdAt + 60 * 60 * 1000;
    assert.equal(verifyAdminSessionToken(admin), false);
  } finally {
    Date.now = now;
  }
});
