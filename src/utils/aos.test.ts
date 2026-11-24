import test from 'node:test';
import assert from 'node:assert/strict';
import { AOS_CONFIG, getAosStaggerDelay, isReducedMotionPreferred } from './aos';

test('AOS_CONFIG uses smooth once-only fade-up settings', () => {
  assert.equal(AOS_CONFIG.once, true);
  assert.equal(AOS_CONFIG.duration, 700);
  assert.equal(AOS_CONFIG.easing, 'ease-out-cubic');
  assert.equal(typeof AOS_CONFIG.offset, 'number');
  assert.ok((AOS_CONFIG.offset ?? 0) >= 24 && (AOS_CONFIG.offset ?? 0) <= 100);
});

test('getAosStaggerDelay wraps cleanly per row and clamps negative values', () => {
  assert.equal(getAosStaggerDelay(0, 70, 3), 0);
  assert.equal(getAosStaggerDelay(1, 70, 3), 70);
  assert.equal(getAosStaggerDelay(2, 70, 3), 140);
  assert.equal(getAosStaggerDelay(3, 70, 3), 0);
  assert.equal(getAosStaggerDelay(5, 60, 4), 60);
  assert.equal(getAosStaggerDelay(-2, 70, 3), 0);
});

test('isReducedMotionPreferred respects prefers-reduced-motion media query', () => {
  assert.equal(isReducedMotionPreferred(() => ({ matches: true })), true);
  assert.equal(isReducedMotionPreferred(() => ({ matches: false })), false);
  assert.equal(
    isReducedMotionPreferred(() => {
      throw new Error('unsupported');
    }),
    false
  );
});
