import { useCallback, useEffect, useState } from 'react';
import type { PublicRoute } from '../types/portfolio';
import { scrollToTopInstant } from './aos';

const VALID_ROUTES: PublicRoute[] = [
  '/',
  '/about',
  '/experience',
  '/education',
  '/certificates',
  '/skills',
  '/projects',
  '/contact',
  '/admin',
];

export function normalizeRoute(pathname: string): PublicRoute {
  const cleaned = pathname.replace(/\/+$/, '') || '/';
  if ((VALID_ROUTES as string[]).includes(cleaned)) {
    return cleaned as PublicRoute;
  }
  return '/';
}

export function useRouter() {
  const [route, setRoute] = useState<PublicRoute>(() =>
    typeof window !== 'undefined' ? normalizeRoute(window.location.pathname) : '/'
  );

  useEffect(() => {
    const onPopState = () => {
      scrollToTopInstant();
      setRoute(normalizeRoute(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((nextRoute: PublicRoute) => {
    const target = normalizeRoute(nextRoute);
    if (window.location.pathname !== target) {
      window.history.pushState({}, '', target);
    }
    scrollToTopInstant();
    setRoute(target);
  }, []);

  return { route, navigate };
}
