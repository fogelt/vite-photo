export const paths = {
  home: { path: '/' },
  about: { path: '/about' },
  portraits: { path: '/portraits' },
  weddings: { path: '/weddings' },
  articles: { path: '/articles' },
  reportage: {
    path: '/reportage/:slug',
    getHref: (slug: string) => `/reportage/${slug}`
  },
  admin: { path: '/admin' }
} as const;