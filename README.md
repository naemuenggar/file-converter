# OmniDoc OS

The ultimate **100% client-side** document & file conversion suite. Convert, edit, sign, and OCR any file (PDF, Word, PPT, Excel, TXT, Images) — entirely in your browser using WebAssembly and Web Workers. **Your files never leave your device.**

## Features

- **PDF Suite** — Merge, Split, Organize, Rotate, Compress, Watermark, Page Numbers, Protect/Unlock
- **Omni Converter** — Any-to-any: Word/PPT/Excel/TXT/HTML/Images ⇄ PDF
- **OCR Studio** — Extract text from images & scanned PDFs (tesseract.js), export to Word/TXT
- **Sign PDF** — Draw a signature and place it visually
- **Cloud (optional)** — Supabase auth, conversion history, shareable signed links

## Tech Stack

Vue 3 (`<script setup>`) · Vite · TypeScript · Pinia · Vue Router · Tailwind CSS
`pdf-lib` · `pdfjs-dist` · `mammoth` · `docx` · `pptxgenjs` · `xlsx` · `tesseract.js` · `Comlink` · `localforage` · `@supabase/supabase-js`

## Local Development

```bash
npm install
npm run dev      # start dev server
npm run build    # type-check + production build to /dist
npm run preview  # preview the production build
```

### Environment (optional — for cloud features)

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The app works fully without these — cloud features simply stay disabled.

## Deploy to Vercel (Free Hobby Tier) — 3 Steps

1. **Push to GitHub** — Commit this project and push it to a GitHub repository.
2. **Import to Vercel** — Go to [vercel.com/new](https://vercel.com/new), click **Import** on your repo. Vercel auto-detects Vite (Build: `npm run build`, Output: `dist`). The included `vercel.json` handles SPA routing so deep links like `/ocr` don't 404 on refresh.
3. **Deploy** — Click **Deploy**. (Optional: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under **Settings → Environment Variables**, then redeploy.)

That's it — your app goes live at `https://<your-project>.vercel.app`.

## Privacy

All file processing runs locally in your browser via WebAssembly. No documents are ever uploaded to a server. Cloud features (history, sharing) are strictly opt-in and only activate when you sign in.
