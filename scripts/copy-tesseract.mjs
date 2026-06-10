/**
 * copy-tesseract.mjs
 *
 * Copies the Tesseract.js worker script and WASM core into public/tesseract so
 * they are served SAME-ORIGIN. Under a strict Cross-Origin-Embedder-Policy,
 * loading these from a CDN is blocked; serving them locally fixes OCR in prod.
 *
 * Runs as a prebuild step (see package.json). Language traineddata still loads
 * from jsDelivr (valid CORS, works under COEP `credentialless`); drop files into
 * public/tesseract/lang and point langPath there for a fully offline setup.
 */
import { cpSync, mkdirSync, copyFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const outDir = resolve(root, 'public/tesseract')
const coreOutDir = resolve(outDir, 'core')
mkdirSync(coreOutDir, { recursive: true })

// 1) Worker script
const workerSrc = resolve(root, 'node_modules/tesseract.js/dist/worker.min.js')
if (existsSync(workerSrc)) {
  copyFileSync(workerSrc, resolve(outDir, 'worker.min.js'))
}

// 2) WASM core (all variants — tesseract picks SIMD/relaxed at runtime)
const coreSrc = resolve(root, 'node_modules/tesseract.js-core')
if (existsSync(coreSrc)) {
  cpSync(coreSrc, coreOutDir, { recursive: true })
}

console.log('[tesseract] copied worker + core into public/tesseract')
