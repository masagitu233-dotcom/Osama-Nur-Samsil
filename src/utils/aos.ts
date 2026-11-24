import AOS, { type AosOptions } from 'aos';

export const AOS_CONFIG: Readonly<AosOptions> = {
  duration: 700,
  easing: 'ease-out-cubic',
  once: true,
  offset: 48,
  mirror: false,
  anchorPlacement: 'top-bottom',
};

/**
 * Computes a light, bounded stagger delay (in ms) for sibling cards/items
 * so adjacent cards enter harmoniously without accumulating long delays
 * on tall lists.
 */
export function getAosStaggerDelay(
  index: number,
  stepMs = 70,
  columnsPerRow = 3
): number {
  const safeIndex = Math.max(0, Math.floor(index));
  const safeStep = Math.max(0, Math.floor(stepMs));
  const safeCols = Math.max(1, Math.floor(columnsPerRow));
  return (safeIndex % safeCols) * safeStep;
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
let mutationObserver: MutationObserver | null = null;
let pendingRafId: number | null = null;
let pendingTimerId: number | null = null;

function nodeContainsAos(node: Node): boolean {
  if (node.nodeType !== 1) return false;
  const el = node as Element;
  if (el.hasAttribute('data-aos')) return true;
  return Boolean(el.querySelector?.('[data-aos]'));
}

export function refreshAos(hard = true): void {
  if (typeof window === 'undefined' || !aosInitialized) return;
  if (isReducedMotionPreferred()) return;

  if (pendingRafId !== null) {
    window.cancelAnimationFrame(pendingRafId);
  }
  pendingRafId = window.requestAnimationFrame(() => {
    pendingRafId = null;
    if (hard) {
      AOS.refreshHard();
    } else {
      AOS.refresh();
    }
  });
}

export function refreshAosAfterTransition(): void {
  refreshAos(true);
  if (typeof window === 'undefined' || !aosInitialized) return;
  if (pendingTimerId !== null) {
    window.clearTimeout(pendingTimerId);
  }
  pendingTimerId = window.setTimeout(() => {
    pendingTimerId = null;
    refreshAos(true);
  }, 240);
}

/**
 * Initializes AOS once globally and observes dynamic DOM additions
 * (Firestore snapshots, async Dars articles, route changes, admin tabs, modals)
 * so newly mounted [data-aos] elements animate reliably without getting stuck hidden.
 */
export function initAosOnce(): void {
  if (typeof window === 'undefined' || aosInitialized) return;

  AOS.init({
    ...AOS_CONFIG,
    disable: () => isReducedMotionPreferred(),
  });
  aosInitialized = true;

  if (typeof MutationObserver !== 'undefined' && document.body && !mutationObserver) {
    mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type !== 'childList' || mutation.addedNodes.length === 0) continue;
        for (const added of Array.from(mutation.addedNodes)) {
          if (nodeContainsAos(added)) {
            refreshAos(true);
            return;
          }
        }
      }
    });
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  refreshAosAfterTransition();
}
