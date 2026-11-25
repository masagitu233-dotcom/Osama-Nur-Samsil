import React, { useEffect } from 'react';
import type { PortfolioBundle, PublicRoute } from '../../types/portfolio';
import {
  buildRouteSeoMeta,
  buildStructuredDataGraph,
  resolveCanonicalOrigin,
} from '../../utils/seo';

declare const __NETLIFY_SITE_URL__: string | undefined;

interface RouteSeoHeadProps {
  route: PublicRoute;
  bundle: PortfolioBundle;
}

function upsertMetaTag(attrName: 'name' | 'property', attrValue: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function removeMetaTag(attrName: 'name' | 'property', attrValue: string): void {
  const el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (el) el.remove();
}

function syncCanonicalLink(href: string | null): void {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!href) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function syncJsonLdScript(data: Record<string, unknown> | null): void {
  let el = document.getElementById('portfolio-jsonld') as HTMLScriptElement | null;
  if (!data) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.id = 'portfolio-jsonld';
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export const RouteSeoHead: React.FC<RouteSeoHeadProps> = ({ route, bundle }) => {
  useEffect(() => {
    const configuredSiteUrl =
      (import.meta.env.VITE_SITE_URL as string | undefined) ||
      (typeof __NETLIFY_SITE_URL__ !== 'undefined' ? __NETLIFY_SITE_URL__ : '');
    const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const siteOrigin = resolveCanonicalOrigin(configuredSiteUrl, runtimeOrigin);

    const meta = buildRouteSeoMeta(route, bundle, siteOrigin);

    document.title = meta.title;
    upsertMetaTag('name', 'description', meta.description);
    upsertMetaTag('name', 'robots', meta.robots);
    syncCanonicalLink(meta.canonicalUrl);

    upsertMetaTag('property', 'og:type', meta.ogType);
    upsertMetaTag('property', 'og:locale', meta.ogLocale);
    upsertMetaTag('property', 'og:site_name', meta.ogSiteName);
    upsertMetaTag('property', 'og:title', meta.ogTitle);
    upsertMetaTag('property', 'og:description', meta.ogDescription);
    if (meta.ogUrl) {
      upsertMetaTag('property', 'og:url', meta.ogUrl);
    } else {
      removeMetaTag('property', 'og:url');
    }
    upsertMetaTag('property', 'og:image', meta.ogImage);
    upsertMetaTag('property', 'og:image:alt', meta.ogImageAlt);

    upsertMetaTag('name', 'twitter:card', meta.twitterCard);
    upsertMetaTag('name', 'twitter:title', meta.twitterTitle);
    upsertMetaTag('name', 'twitter:description', meta.twitterDescription);
    upsertMetaTag('name', 'twitter:image', meta.twitterImage);

    if (route === '/admin') {
      syncJsonLdScript(null);
    } else {
      const graph = buildStructuredDataGraph(route, bundle, siteOrigin);
      syncJsonLdScript(graph);
    }
  }, [
    route,
    bundle.profile.fullName,
    bundle.siteSettings.ogImageUrl,
    bundle.contacts.websiteUrl,
    bundle.contacts.linkedinUrl,
    bundle.contacts.githubUrl,
    bundle.contacts.instagramUrl,
  ]);

  return null;
};
