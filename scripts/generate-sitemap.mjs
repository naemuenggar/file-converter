/**
 * generate-sitemap.mjs
 *
 * Build-time SEO generator for the OmniDoc OS SPA. Reads every tool route from
 * src/core/toolRegistry.ts (single source of truth) and writes sitemap.xml +
 * robots.txt into public/, which Vite copies verbatim into dist/.
 *
 * Dependency-free and toolchain-independent (runs as a prebuild npm step), so
 * it doesn't rely on Vite/Rolldown plugin hooks.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')

// Update if the production domain changes.
const SITE_HOSTNAME = 'https://omnidoc-os.vercel.app'

// Static, non-registry routes.
const STATIC_ROUTES = ['/', '/convert', '/ocr', '/sign']

// Extract every `path: '...'` from the tool registry.
const registrySrc = readFileSync(
  resolve(projectRoot, 'src/core/toolRegistry.ts'),
  'utf8'
)
const toolRoutes = [...registrySrc.matchAll(/path:\s*'([^']+)'/g)].map((m) => m[1])

// De-duplicate while preserving order.
const routes = [...new Set([...STATIC_ROUTES, ...toolRoutes])]

const today = new Date().toISOString().split('T')[0]

const body = routes
  .map((route) => {
    const loc = `${SITE_HOSTNAME}${route === '/' ? '' : route}`
    const priority = route === '/' ? '1.0' : '0.8'
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`
  })
  .join('\n')

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`

const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_HOSTNAME}/sitemap.xml
`

writeFileSync(resolve(projectRoot, 'public/sitemap.xml'), sitemap)
writeFileSync(resolve(projectRoot, 'public/robots.txt'), robots)

console.log(`[sitemap] wrote ${routes.length} routes to public/sitemap.xml + robots.txt`)
