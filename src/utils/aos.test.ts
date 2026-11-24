import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AOS_CONFIG,
  getAosStaggerDelay,
  isElementBelowViewportFold,
  isReducedMotionPreferred,
} from './aos';

test('AOS_CONFIG defines consistent fade-up animation settings within spec', () => {
  assert.equal(AOS_CONFIG.once, true);
  assert.equal(AOS_CONFIG.easing, 'ease-out-cubic');
  assert.equal(AOS_CONFIG.mirror, false);
  assert.equal(AOS_CONFIG.disable, false);
  assert.equal(AOS_CONFIG.disableMutationObserver, true);
  assert.ok(
    typeof AOS_CONFIG.duration === 'number' &&
      AOS_CONFIG.duration >= 700 &&
      AOS_CONFIG.duration <= 900
  );
  assert.ok(
    typeof AOS_CONFIG.offset === 'number' &&
      AOS_CONFIG.offset >= 100 &&
      AOS_CONFIG.offset <= 150
  );
});

test('getAosStaggerDelay snaps to valid AOS 50ms increments and resets per row', () => {
  assert.equal(getAosStaggerDelay(0, 100, 3), 0);
  assert.equal(getAosStaggerDelay(1, 100, 3), 100);
  assert.equal(getAosStaggerDelay(2, 100, 3), 200);
  assert.equal(getAosStaggerDelay(3, 100, 3), 0);
  assert.equal(getAosStaggerDelay(4, 100, 3), 100);

  // Non-50ms inputs are safely snapped to AOS-supported 50ms multiples
  assert.equal(getAosStaggerDelay(1, 70, 3) % 50, 0);
  assert.equal(getAosStaggerDelay(2, 80, 3) % 50, 0);

  // Negative or invalid indices clamp cleanly
  assert.equal(getAosStaggerDelay(-2, 100, 3), 0);
  assert.equal(getAosStaggerDelay(5, 100, 0), 0);
});

test('isElementBelowViewportFold accurately detects elements waiting below the trigger line across desktop & mobile heights', () => {
  // Desktop 1366x768: KPI cards at layoutTop 561 are above fold (768 - 120 = 648)
  assert.equal(isElementBelowViewportFold(561, 768, 120), false);
  assert.equal(isElementBelowViewportFold(648, 768, 120), true);

  // Desktop 1440x900 & 1920x1080
  assert.equal(isElementBelowViewportFold(200, 900, 120), false);
  assert.equal(isElementBelowViewportFold(779, 900, 120), false);
  assert.equal(isElementBelowViewportFold(780, 900, 120), true);
  assert.equal(isElementBelowViewportFold(959, 1080, 120), false);
  assert.equal(isElementBelowViewportFold(960, 1080, 120), true);
});

test('isReducedMotionPreferred respects matchMedia prefers-reduced-motion', () => {
  assert.equal(isReducedMotionPreferred(() => ({ matches: true })), true);
  assert.equal(isReducedMotionPreferred(() => ({ matches: false })), false);
  assert.equal(
    isReducedMotionPreferred(() => {
      throw new Error('unavailable');
    }),
    false
  );
});
