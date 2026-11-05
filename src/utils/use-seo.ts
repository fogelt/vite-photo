import { useEffect } from 'react';

interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noindex?: boolean;
}

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

export const useSEO = (config: SEOConfig) => {
  useEffect(() => {
    document.title = config.title;

    setMeta('name', 'description', config.description);
    if (config.keywords) setMeta('name', 'keywords', config.keywords);

    const canonicalUrl = config.canonical || window.location.href;
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);
    const absoluteCanonical = canonical.href;

    // Admin is never indexed; every public route resets this to index,follow.
    setMeta('name', 'robots', config.noindex ? 'noindex,nofollow' : 'index,follow');

    setMeta('property', 'og:title', config.title);
    setMeta('property', 'og:description', config.description);
    setMeta('property', 'og:url', absoluteCanonical);
    setMeta('property', 'og:type', config.ogType || 'website');
    if (config.ogImage) setMeta('property', 'og:image', config.ogImage);

    setMeta('name', 'twitter:title', config.title);
    setMeta('name', 'twitter:description', config.description);
    if (config.ogImage) setMeta('name', 'twitter:image', config.ogImage);
  }, [config]);
};
