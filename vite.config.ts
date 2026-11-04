// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from 'path';
import Sitemap from 'vite-plugin-sitemap';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/', //change to '/' on paid domain
  plugins: [
    react(),

    Sitemap({
      hostname: 'https://myeliefoto.se', // Replace with your actual domain
      dynamicRoutes: [
        '/weddings',
        '/portraits',
        '/articles',
        '/about',
      ],
      exclude: ['/admin', '/sign-in', '/sign-up', '/404'],
      changefreq: 'monthly',
      priority: {
        '/': 1.0,
        '/weddings': 0.9,
        '/portraits': 0.9,
        '/about': 0.7,
        '/articles': 0.6,
      },
      generateRobotsTxt: true,
      robots: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/admin', '/sign-in', '/sign-up'],
        },
      ],
    }),
  ],

  css: {
    postcss: path.resolve(__dirname, 'postcss.config.cjs'),
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: 3000,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: true,
    sourcemap: false,
  },
});