import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_DESIGN_MODE,
  DESIGN_MODE_DEFINITIONS,
  DESIGN_MODE_LIST,
  KNOWN_CUTOUT_SOURCE_FILE_ID,
  isDesignMode,
  normalizeDesignMode,
  resolveEffectiveRouteDesignMode,
  shouldUsePreprocessedHeroCutout,
} from './designMode.ts';

test('isDesignMode recognizes only the two supported modes', () => {
  assert.equal(isDesignMode('minimalis_elegan'), true);
  assert.equal(isDesignMode('neo_brutalist'), true);
  assert.equal(isDesignMode('dark'), false);
  assert.equal(isDesignMode(''), false);
  assert.equal(isDesignMode(null), false);
  assert.equal(isDesignMode(undefined), false);
});

test('normalizeDesignMode preserves valid modes and falls back safely', () => {
  assert.equal(normalizeDesignMode('minimalis_elegan'), 'minimalis_elegan');
  assert.equal(normalizeDesignMode('neo_brutalist'), 'neo_brutalist');
  assert.equal(normalizeDesignMode(undefined), DEFAULT_DESIGN_MODE);
  assert.equal(normalizeDesignMode('unknown-mode'), DEFAULT_DESIGN_MODE);
});

test('resolveEffectiveRouteDesignMode applies global mode to public routes and protects /admin workspace', () => {
  assert.equal(resolveEffectiveRouteDesignMode('minimalis_elegan', false), 'minimalis_elegan');
  assert.equal(resolveEffectiveRouteDesignMode('neo_brutalist', false), 'neo_brutalist');
  assert.equal(resolveEffectiveRouteDesignMode('minimalis_elegan', true), 'neo_brutalist');
  assert.equal(resolveEffectiveRouteDesignMode('neo_brutalist', true), 'neo_brutalist');
});

test('shouldUsePreprocessedHeroCutout matches existing owner portrait and falls back for brand-new custom URLs', () => {
  assert.equal(
    shouldUsePreprocessedHeroCutout(
      `https://drive.google.com/thumbnail?id=${KNOWN_CUTOUT_SOURCE_FILE_ID}&sz=w1600`
    ),
    true
  );
  assert.equal(
    shouldUsePreprocessedHeroCutout(
      `https://drive.google.com/file/d/${KNOWN_CUTOUT_SOURCE_FILE_ID}/view`
    ),
    true
  );
  assert.equal(shouldUsePreprocessedHeroCutout(''), true);
  assert.equal(shouldUsePreprocessedHeroCutout(undefined), true);
  assert.equal(shouldUsePreprocessedHeroCutout('/assets/hero_osama_portrait_123.jpg'), true);
  assert.equal(
    shouldUsePreprocessedHeroCutout('https://drive.google.com/thumbnail?id=NEW_DIFFERENT_PHOTO_ID&sz=w1600'),
    false
  );
});

test('DESIGN_MODE_LIST exposes both Mode A and Mode B with non-empty metadata', () => {
  assert.equal(DESIGN_MODE_LIST.length, 2);
  assert.equal(DESIGN_MODE_LIST[0].id, 'minimalis_elegan');
  assert.equal(DESIGN_MODE_LIST[1].id, 'neo_brutalist');
  assert.ok(DESIGN_MODE_DEFINITIONS.minimalis_elegan.characteristics.length >= 3);
  assert.ok(DESIGN_MODE_DEFINITIONS.neo_brutalist.characteristics.length >= 3);
});
