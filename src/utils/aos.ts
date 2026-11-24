import AOS, { type AosOptions } from 'aos';

export const AOS_CONFIG: Readonly<AosOptions> = {
  duration: 800,
  easing: 'ease-out-cubic',
  once: true,
  offset: 120,
  mirror: false,
  disable: false,
  anchorPlacement: 'top-bottom',
  disableMutationObserver: true,
};

/**
 * Immediately resets window scroll position to top (0, 0), explicitly bypassing
 * CSS `scroll-behavior: smooth` (e.g. `<html class="scroll-smooth">`) so SPA
 * route transitions never mount new `[data-aos]` elements at the previous
 * page's scroll offset.
 */
export function scrollToTopInstant(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const html = document.documentElement;
  const prevBehavior = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  html.scrollTop = 0;
  if (document.body) {
    document.body.scrollTop = 0;
  }
  html.style.scrollBehavior = prevBehavior;
}

/**
 * Computes a light, bounded stagger delay (in ms) for sibling cards/items
 * so adjacent cards enter sequentially without accumulating long delays
 * on tall lists.
 *
 * Snaps to multiples of 50ms because AOS v2.3.4 CSS only defines
 * `[data-aos-delay]` rules in 50ms increments (50, 100, 150, 200, ...).
 */
export function getAosStaggerDelay(
  index: number,
  stepMs = 100,
  columnsPerRow = 3
): number {
  const safeIndex = Math.max(0, Math.floor(index));
  const safeStep = Math.max(0, Math.floor(stepMs));
  const safeCols = Math.max(1, Math.floor(columnsPerRow));
  const raw = (safeIndex % safeCols) * safeStep;
  const snapped = Math.round(raw / 50) * 50;
  return Math.min(3000, Math.max(0, snapped));
}

/**
 * Computes an element's untransformed document top coordinate by walking
 * `offsetParent` (matching AOS v2.3.4's internal offset calculator) so initial
 * CSS `transform: translate3d(0, Y, 0)` never inflates fold checks on desktop
 * viewports such as 1366x768.
 */
export function getElementLayoutTop(el: HTMLElement): number {
  let top = 0;
  let current: HTMLElement | null = el;
  while (current && !Number.isNaN(current.offsetTop)) {
    top += current.offsetTop - (current.tagName !== 'BODY' ? current.scrollTop : 0);
    current = current.offsetParent as HTMLElement | null;
  }
  return top;
}

/**
 * Determines whether an element's untransformed layout top edge is strictly
 * below the AOS trigger fold for the current viewport and offset.
 */
export function isElementBelowViewportFold(
  layoutTop: number,
  viewportHeight: number,
  offset: number = AOS_CONFIG.offset ?? 120
): boolean {
  return layoutTop >= viewportHeight - offset;
}

/**
 * Checks whether the user/system reports reduced motion (utility helper;
 * AOS itself runs consistently across desktop & mobile with `disable: false`).
 */
export function isReducedMotionPreferred(
  matchMediaFn?: (query: string) => { matches: boolean }
): boolean {
  const resolver =
    matchMediaFn ??
    (typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? (q: string) => window.matchMedia(q)
      : null);
  if (!resolver) return false;
  try {
    return Boolean(resolver('(prefers-reduced-motion: reduce)').matches);
  } catch {
    return false;
  }
}

let aosInitialized = false;
let listenersAttached = false;
let pendingRaf1: number | null = null;
let pendingRaf2: number | null = null;
let pendingFollowupTimer: number | null = null;

/**
 * Pre-applies AOS duration/easing/delay attributes on `document.body` BEFORE
 * the browser paints frame 1 so newly mounted `[data-aos]` elements already
 * have `transition-duration: 0.8s`, `ease-out-cubic`, and `translate3d(0, 36px, 0)`
 * committed prior to `.aos-animate` being added on frame 2.
 */
export function syncBodyAosAttributes(): void {
  if (typeof document === 'undefined' || !document.body) return;
  document.body.setAttribute('data-aos-easing', String(AOS_CONFIG.easing ?? 'ease-out-cubic'));
  document.body.setAttribute('data-aos-duration', String(AOS_CONFIG.duration ?? 800));
  document.body.setAttribute('data-aos-delay', '0');
}

function cancelScheduledRefresh(): void {
  if (typeof window === 'undefined') return;
  if (pendingRaf1 !== null) {
    window.cancelAnimationFrame(pendingRaf1);
    pendingRaf1 = null;
  }
  if (pendingRaf2 !== null) {
    window.cancelAnimationFrame(pendingRaf2);
    pendingRaf2 = null;
  }
  if (pendingFollowupTimer !== null) {
    window.clearTimeout(pendingFollowupTimer);
    pendingFollowupTimer = null;
  }
}

/**
 * When the page is at scroll top (initial load, route change, or async Firestore
 * data shifting lower sections downward), strips any stale `.aos-animate` class
 * from elements whose untransformed layout top is strictly below the viewport fold
 * so they wait properly for user scrolling.
 */
function stripStaleBelowFoldAnimations(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.scrollY > 10) return;

  const vh = window.innerHeight;
  const defaultOffset = AOS_CONFIG.offset ?? 120;
  const animatedEls = document.querySelectorAll<HTMLElement>('[data-aos].aos-animate');

  animatedEls.forEach((el) => {
    if (el.closest('[role="dialog"]')) return;
    const rawOffset = el.getAttribute('data-aos-offset');
    const parsedOffset = rawOffset !== null ? Number(rawOffset) : defaultOffset;
    const effectiveOffset = Number.isFinite(parsedOffset) ? parsedOffset : defaultOffset;
    if (effectiveOffset < 0) return;

    const layoutTop = getElementLayoutTop(el);
    if (isElementBelowViewportFold(layoutTop, vh, effectiveOffset)) {
      el.classList.remove('aos-animate');
    }
  });
}

/**
 * Ensures elements near the very bottom of a page (within `offset` px of
 * document bottom) still animate in cleanly once the user scrolls to the bottom.
 */
function revealVisibleElementsAtDocumentBottom(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const vh = window.innerHeight;
  const docHeight = document.documentElement.scrollHeight;
  if (window.scrollY + vh < docHeight - 12) return;

  const pendingEls = document.querySelectorAll<HTMLElement>('[data-aos].aos-init:not(.aos-animate)');
  pendingEls.forEach((el) => {
    const layoutTop = getElementLayoutTop(el);
    const topInViewport = layoutTop - window.scrollY;
    if (topInViewport < vh && topInViewport + el.offsetHeight > 0) {
      el.classList.add('aos-animate');
    }
  });
}

function attachGlobalAosListeners(): void {
  if (typeof window === 'undefined' || listenersAttached) return;
  listenersAttached = true;

  window.addEventListener('scroll', revealVisibleElementsAtDocumentBottom, { passive: true });
  window.addEventListener('resize', () => {
    if (aosInitialized) {
      AOS.refresh();
      revealVisibleElementsAtDocumentBottom();
    }
  });
  window.addEventListener('load', () => {
    if (aosInitialized) {
      stripStaleBelowFoldAnimations();
      AOS.refresh();
      revealVisibleElementsAtDocumentBottom();
    }
  });
}

/**
 * Guarantees `AOS.init()` executes exactly once across all viewports (desktop
 * and mobile) without ever disabling or stripping `data-aos` attributes.
 */
function ensureAosInitialized(): void {
  if (typeof window === 'undefined' || aosInitialized) return;
  syncBodyAosAttributes();
  AOS.init({
    ...AOS_CONFIG,
    disable: false,
  });
  aosInitialized = true;
  attachGlobalAosListeners();
}

/**
 * Schedules a double-RAF callback after ensuring `body` AOS transition attributes
 * are already committed, so the browser paints frame 1 in the exact initial
 * hidden/offset CSS state (`opacity: 0`, `translate3d(0, 36px, 0)`, `800ms`)
 * before AOS adds `.aos-animate` to elements inside the viewport on frame 2.
 */
function runAfterNextPaint(task: () => void): void {
  if (typeof window === 'undefined') return;
  syncBodyAosAttributes();
  cancelScheduledRefresh();
  pendingRaf1 = window.requestAnimationFrame(() => {
    pendingRaf1 = null;
    pendingRaf2 = window.requestAnimationFrame(() => {
      pendingRaf2 = null;
      task();
    });
  });
}

/**
 * Initializes AOS once globally at application level.
 * Uses `disableMutationObserver: true` and `disable: false` so AOS works
 * consistently on every desktop and mobile screen without prematurely stamping
 * `.aos-animate` during SPA route switches or async Firestore layout shifts.
 */
export function initAosOnce(): void {
  if (typeof window === 'undefined' || aosInitialized) return;

  runAfterNextPaint(() => {
    ensureAosInitialized();
    stripStaleBelowFoldAnimations();
    AOS.refreshHard();
    stripStaleBelowFoldAnimations();
    revealVisibleElementsAtDocumentBottom();
  });
}

/**
 * Re-scans newly mounted DOM elements (e.g., filter switches, modals,
 * paginated articles, Firestore snapshots) after the browser paints their
 * initial AOS state.
 */
export function refreshAos(hard = true): void {
  if (typeof window === 'undefined') return;

  runAfterNextPaint(() => {
    ensureAosInitialized();
    stripStaleBelowFoldAnimations();
    if (hard) {
      AOS.refreshHard();
    } else {
      AOS.refresh();
    }
    stripStaleBelowFoldAnimations();
    revealVisibleElementsAtDocumentBottom();
  });
}

/**
 * Synchronizes AOS after initial mount, SPA route transitions, Firestore updates,
 * or Admin tab switches. Waits for frame 1 paint with `body` AOS attributes
 * already applied, then initializes/scans cleanly and recalculates once images
 * and fonts settle.
 */
export function refreshAosAfterTransition(): void {
  if (typeof window === 'undefined') return;

  runAfterNextPaint(() => {
    ensureAosInitialized();
    stripStaleBelowFoldAnimations();
    AOS.refreshHard();
    stripStaleBelowFoldAnimations();
    revealVisibleElementsAtDocumentBottom();

    // Follow-up position recalculation after async images/fonts settle
    pendingFollowupTimer = window.setTimeout(() => {
      pendingFollowupTimer = null;
      if (!aosInitialized) return;
      stripStaleBelowFoldAnimations();
      AOS.refresh();
      stripStaleBelowFoldAnimations();
      revealVisibleElementsAtDocumentBottom();
    }, 350);
  });
}
