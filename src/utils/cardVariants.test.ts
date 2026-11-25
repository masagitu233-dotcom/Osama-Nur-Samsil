import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getSectionCardTone,
  getToneConfig,
  SECTION_CARD_TONE_MAP,
  type PortfolioSectionKey,
} from './cardVariants';

test('SECTION_CARD_TONE_MAP assigns strict 6-color tones per section category', () => {
  assert.equal(SECTION_CARD_TONE_MAP.experience, 'bordo');
  assert.equal(SECTION_CARD_TONE_MAP.education, 'navy');
  assert.equal(SECTION_CARD_TONE_MAP.projects, 'green');
  assert.equal(SECTION_CARD_TONE_MAP.skills, 'gold');
  assert.equal(SECTION_CARD_TONE_MAP.certificates, 'green');
  assert.equal(SECTION_CARD_TONE_MAP.profile, 'navy');
  assert.equal(SECTION_CARD_TONE_MAP.contact, 'bordo');
});

test('all section card tones use strictly official classes with zero legacy blue or pastel cards', () => {
  const sections: PortfolioSectionKey[] = [
    'experience',
    'education',
    'projects',
    'skills',
    'certificates',
    'profile',
    'contact',
  ];

  const forbiddenClasses = new Set([
    'card-blue',
    'card-beige',
    'card-midnight',
    'card-soft-gold',
    'card-pale-green',
    'card-soft-sage',
    'card-pale-rose',
  ]);

  for (const section of sections) {
    const config = getSectionCardTone(section);
    assert.equal(
      forbiddenClasses.has(config.cardClass),
      false,
      `Forbidden legacy/pastel card class "${config.cardClass}" on ${section}`
    );
    assert.equal(config.buttonClass, `brutal-btn-frame-${config.tone}`);
    assert.equal(config.isDark, config.tone !== 'gold');
  }
});

test('skills gold tone enforces Deep Midnight Ink borders and gold frame button', () => {
  const skills = getSectionCardTone('skills');
  const gold = getToneConfig('gold');

  assert.deepEqual(skills, gold);
  assert.equal(gold.cardClass, 'card-gold');
  assert.equal(gold.frameClass, 'frame-gold');
  assert.equal(gold.mediaBorderClass, 'border-[#001F24]');
  assert.equal(gold.badgeClass, 'brutal-badge-navy');
  assert.equal(gold.buttonClass, 'brutal-btn-frame-gold');
  assert.equal(gold.isDark, false);
});

test('bordo, navy, and green section tones enforce frame-matched buttons and Gold media borders', () => {
  const experience = getSectionCardTone('experience');
  const education = getSectionCardTone('education');
  const projects = getSectionCardTone('projects');
  const certificates = getSectionCardTone('certificates');
  const contact = getSectionCardTone('contact');

  assert.equal(experience.cardClass, 'card-bordo');
  assert.equal(experience.buttonClass, 'brutal-btn-frame-bordo');
  assert.equal(experience.mediaBorderClass, 'border-[#D9B44A]');

  assert.equal(education.cardClass, 'card-navy');
  assert.equal(education.buttonClass, 'brutal-btn-frame-navy');

  assert.equal(projects.cardClass, 'card-green');
  assert.equal(projects.buttonClass, 'brutal-btn-frame-green');
  assert.deepEqual(certificates, projects);
  assert.deepEqual(contact, experience);
});
