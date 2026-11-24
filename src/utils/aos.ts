import AOS, { type AosOptions } from 'aos';

export const AOS_CONFIG: Readonly<AosOptions> = {
  duration: 800,
  easing: 'ease-out-cubic',
  once: true,
  offset: 120,
  mirror: false,
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
 * Determines whether an element's top edge is strictly below the AOS
 * trigger fold for the current viewport and offset.
 */
export function isElementBelowViewportFold(
  rectTop: number,
  viewportHeight: number,
  offset: number = AOS_CONFIG.offset ?? 120
): boolean {
  return rectTop >= viewportHeight - offset;
}

/**
 * Checks whether the user/system prefers reduced motion.
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
 * from elements that are now strictly below the viewport fold so they wait
 * properly for user scrolling.
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

    const rect = el.getBoundingClientRect();
    if (isElementBelowViewportFold(rect.top, vh, effectiveOffset)) {
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
    const rect = el.getBoundingClientRect();
    if (rect.top < vh && rect.bottom > 0) {
      el.classList.add('aos-animate');
    }
  });
}

function attachGlobalAosListeners(): void {
  if (typeof window === 'undefined' || listenersAttached) return;
  listenersAttached = true;

  window.addEventListener('scroll', revealVisibleElementsAtDocumentBottom, { passive: true });
  window.addEventListener('load', () => {
    if (aosInitialized && !isReducedMotionPreferred()) {
      stripStaleBelowFoldAnimations();
      AOS.refresh();
    }
  });
}

/**
 * Guarantees `AOS.init()` executes exactly once, only when invoked inside
 * a post-paint tick (so it can never be cancelled by a sibling effect's
 * scheduled refresh in the same React commit).
 */
function ensureAosInitialized(): void {
  if (typeof window === 'undefined' || aosInitialized) return;
  AOS.init({
    ...AOS_CONFIG,
    disable: () => isReducedMotionPreferred(),
  });
  aosInitialized = true;
  attachGlobalAosListeners();
}

/**
 * Schedules a double-RAF callback so the browser paints at least one frame of
 * newly mounted `[data-aos]` elements in their initial hidden/offset CSS state
 * before AOS adds `.aos-animate` to elements inside the viewport.
 */
function runAfterNextPaint(task: () => void): void {
  if (typeof window === 'undefined') return;
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
 * Uses `disableMutationObserver: true` so AOS never stamps `.aos-animate`
 * prematurely during SPA route switches or async Firestore layout shifts.
 */
export function initAosOnce(): void {
  if (typeof window === 'undefined' || aosInitialized) return;

  runAfterNextPaint(() => {
    ensureAosInitialized();
    if (isReducedMotionPreferred()) return;
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
    if (isReducedMotionPreferred()) return;
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
 * Synchronizes AOS after SPA route transitions or Admin tab switches.
 * Assumes scroll has already been reset to top before paint, waits for the
 * initial frame of the new route's DOM, then triggers AOS cleanly.
 */
export function refreshAosAfterTransition(): void {
  if (typeof window === 'undefined') return;

  runAfterNextPaint(() => {
    ensureAosInitialized();
    if (isReducedMotionPreferred()) return;
    stripStaleBelowFoldAnimations();
    AOS.refreshHard();
    stripStaleBelowFoldAnimations();
    revealVisibleElementsAtDocumentBottom();

    // Follow-up position recalculation after async images/fonts settle
    pendingFollowupTimer = window.setTimeout(() => {
      pendingFollowupTimer = null;
      if (!aosInitialized || isReducedMotionPreferred()) return;
      stripStaleBelowFoldAnimations();
      AOS.refresh();
      stripStaleBelowFoldAnimations();
      revealVisibleElementsAtDocumentBottom();
    }, 350);
  });
}
