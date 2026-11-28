import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  areLayoutSizingEqual,
  buildPresetModeConfig,
  buildResponsiveSizingStyleSheet,
  buildSizingCssVariables,
  createDefaultLayoutSizingSettings,
  normalizeLayoutSizingSettings,
  normalizeModeSizingConfig,
  resetSizingGroup,
} from './layoutSizing';

describe('layoutSizing presets and normalization', () => {
  it('uses Normal as default preset for both design modes while preserving distinct mode radii & borders', () => {
    const defaults = createDefaultLayoutSizingSettings();
    assert.equal(defaults.minimalis_elegan.preset, 'normal');
    assert.equal(defaults.neo_brutalist.preset, 'normal');

    // Minimalis Elegan uses soft rounded geometry & 1px border
    assert.ok(defaults.minimalis_elegan.layout.frameRadius > 0);
    assert.ok(defaults.minimalis_elegan.cards.cardRadius > 0);
    assert.equal(defaults.minimalis_elegan.cards.borderWidth, 1);

    // Neo-Brutalist preserves sharp 0px geometry & 2px border
    assert.equal(defaults.neo_brutalist.layout.frameRadius, 0);
    assert.equal(defaults.neo_brutalist.cards.cardRadius, 0);
    assert.equal(defaults.neo_brutalist.cards.borderWidth, 2);
  });

  it('orders Compact < Normal < Spacious proportionally across layout, cards, images, typography, buttons, and spacing', () => {
    const compact = buildPresetModeConfig('minimalis_elegan', 'compact');
    const normal = buildPresetModeConfig('minimalis_elegan', 'normal');
    const spacious = buildPresetModeConfig('minimalis_elegan', 'spacious');

    assert.ok(compact.layout.sectionGap < normal.layout.sectionGap);
    assert.ok(normal.layout.sectionGap < spacious.layout.sectionGap);

    assert.ok(compact.cards.cardPadding < normal.cards.cardPadding);
    assert.ok(normal.cards.cardPadding < spacious.cards.cardPadding);

    assert.ok(compact.typography.heroTitleSize < normal.typography.heroTitleSize);
    assert.ok(normal.typography.heroTitleSize < spacious.typography.heroTitleSize);

    assert.ok(compact.buttons.buttonHeight < normal.buttons.buttonHeight);
    assert.ok(normal.buttons.buttonHeight < spacious.buttons.buttonHeight);

    assert.ok(compact.components.hero.portraitHeight < normal.components.hero.portraitHeight);
    assert.ok(normal.components.hero.portraitHeight < spacious.components.hero.portraitHeight);
  });

  it('clamps out-of-range values and sanitizes invalid enum strings safely', () => {
    const sanitized = normalizeModeSizingConfig('minimalis_elegan', {
      preset: 'unknown_preset',
      layout: { contentMaxWidth: 99999, paddingX: -50, frameRadius: 120 },
      cards: { cardPadding: 2, borderWidth: 99 },
      images: { imageRatio: 'invalid', imagePosition: 'diagonal', imageWidthPct: 10 },
      typography: { heroTitleSize: 500, lineHeight: 9.9 },
      buttons: { buttonHeight: 2, iconSize: 100 },
      components: {
        education: { photoMaxHeight: 9999 },
        projects: { imageRatio: 'bad' },
      },
      responsive: {
        mobile: { scaleFactor: 0.1, paddingX: 500 },
      },
    });

    assert.equal(sanitized.preset, 'normal');
    assert.equal(sanitized.layout.contentMaxWidth, 1280);
    assert.equal(sanitized.layout.paddingX, 12);
    assert.equal(sanitized.layout.frameRadius, 28);
    assert.equal(sanitized.cards.cardPadding, 12);
    assert.equal(sanitized.cards.borderWidth, 4);
    assert.equal(sanitized.images.imageRatio, '16/9');
    assert.equal(sanitized.images.imagePosition, 'upper');
    assert.equal(sanitized.images.imageWidthPct, 60);
    assert.equal(sanitized.typography.heroTitleSize, 52);
    assert.equal(sanitized.typography.lineHeight, 1.9);
    assert.equal(sanitized.components.education.photoMaxHeight, 360);
    assert.equal(sanitized.components.projects.imageRatio, '16/9');
    assert.equal(sanitized.responsive.mobile.scaleFactor, 0.78);
    assert.equal(sanitized.responsive.mobile.paddingX, 44);
  });

  it('resets a single group without disturbing edits in other groups or the other design mode', () => {
    const store = createDefaultLayoutSizingSettings();
    const editedMinimal = {
      ...store.minimalis_elegan,
      cards: { ...store.minimalis_elegan.cards, cardPadding: 27 },
      typography: { ...store.minimalis_elegan.typography, heroTitleSize: 45 },
    };

    const afterResetCards = resetSizingGroup('minimalis_elegan', editedMinimal, 'cards');
    assert.equal(afterResetCards.cards.cardPadding, store.minimalis_elegan.cards.cardPadding);
    assert.equal(afterResetCards.typography.heroTitleSize, 45);
    assert.equal(store.neo_brutalist.cards.cardPadding, 18);
  });

  it('produces real CSS variables per breakpoint without transform: scale() and keeps mobile smaller than desktop', () => {
    const cfg = buildPresetModeConfig('minimalis_elegan', 'normal');
    const desktopVars = buildSizingCssVariables(cfg, 'desktop');
    const tabletVars = buildSizingCssVariables(cfg, 'tablet');
    const mobileVars = buildSizingCssVariables(cfg, 'mobile');

    assert.ok(parseFloat(mobileVars['--sz-hero-title']) < parseFloat(desktopVars['--sz-hero-title']));
    assert.ok(parseFloat(mobileVars['--sz-pad-x']) < parseFloat(desktopVars['--sz-pad-x']));
    assert.ok(parseFloat(tabletVars['--sz-card-pad']) <= parseFloat(desktopVars['--sz-card-pad']));

    const css = buildResponsiveSizingStyleSheet(cfg);
    assert.ok(css.includes('@media (max-width: 1024px)'));
    assert.ok(css.includes('@media (max-width: 640px)'));
    assert.ok(!css.includes('transform:'));
    assert.ok(!css.includes('scale('));
  });

  it('preserves independent mode customizations inside LayoutSizingSettings', () => {
    const normalized = normalizeLayoutSizingSettings({
      minimalis_elegan: { preset: 'compact', cards: { cardPadding: 15 } },
      neo_brutalist: { preset: 'spacious', cards: { cardPadding: 26 } },
    });

    assert.equal(normalized.minimalis_elegan.preset, 'compact');
    assert.equal(normalized.minimalis_elegan.cards.cardPadding, 15);
    assert.equal(normalized.neo_brutalist.preset, 'spacious');
    assert.equal(normalized.neo_brutalist.cards.cardPadding, 26);
    assert.equal(areLayoutSizingEqual(normalized, normalizeLayoutSizingSettings(normalized)), true);
  });
});
