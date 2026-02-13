import test from 'node:test';
import assert from 'node:assert/strict';
import { placeOrder } from '../src/store.mjs';

test('placeOrder returns expected shape', () => {
  const result = placeOrder({ userId: 'u1', mode: 'pickup', payWithPoints: false, items: [{ id: 'latte-oat', qty: 1 }] });
  assert.match(result.order.id, /ARK-/);
  assert.equal(result.etaMinutes, '8-12');
  assert.ok(result.pointsEarned > 0);
});
