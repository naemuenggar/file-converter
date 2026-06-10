/**
 * Omni-Worker — OmniDoc OS multi-threaded conversion engine.
 *
 * A Comlink-exposed Web Worker that performs ALL heavy file processing off the
 * main thread. Inputs/outputs use ArrayBuffers so they can be passed as
 * Transferable objects (zero-copy) from the main thread.
 *
 * Engines used (all client-side / WASM):
 *  - pdf-lib      → create/modify PDFs
 *  - pdfjs-dist   → render & parse PDFs
 *  - mammoth      → DOCX → HTML/text
 *  - docx         → build DOCX documents
 *  - xlsx (sheetjs) → spreadsheets
 *  - pptxgenjs    → build PPTX
 *  - jspdf        → raster/text → PDF
 *  - tesseract.js → OCR
 */
import * as Comlink from 'comlink'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'

// pdf.js worker inside this worker context
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProgressFn = (progress: number, message?: string) => void

export interface ConvertResult {
  buffer: ArrayBuffer
  mime: string
  extension: string
}

export interface MultiImageResult {
  images: Array<{ index: number; buffer: ArrayBuffer; mime: string }>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function renderPdfPageToBlob(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale: number
): Promise<{ buffer: ArrayBuffer; width: number; height: number }> {
  const page = await pdf.getPage(pageNumber)
  const viewport = page.getViewport({ scale })
  const canvas = new OffscreenCanvas(viewport.width, viewport.height)
  const ctx = canvas.getContext('2d')!

  await page.render({
    canvasContext: ctx as unknown as CanvasRenderingContext2D,
    viewport,
    canvas: canvas as unknown as HTMLCanvasElement,
  }).promise

  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 })
  const buffer = await blob.arrayBuffer()
  page.cleanup()
  return { buffer, width: viewport.width, height: viewport.height }
}

function dpiToScale(dpi: number): number {
  // pdf.js default is 72 DPI at scale 1
  return dpi / 72
}

// ─── Worker API ──────────────────────────────────────────────────────────────

const api = {
  /**
   * Run Tesseract OCR on an image buffer. Returns extracted plain text.
   * Tesseract is imported dynamically so it only loads when OCR is requested.
   */
  async runOCR(
    imageBuffer: ArrayBuffer,
    mime: string,
    lang: string = 'eng',
    onProgress?: ProgressFn
  ): Promise<string> {
    const { createWorker } = await import('tesseract.js')
    const worker = await createWorker(lang, 1, {
      logger: (m: { status: string; progress: number }) => {
        if (onProgress && m.status === 'recognizing text') {
          onProgress(Math.round(m.progress * 100), 'Recognizing text...')
        }
      },
    })

    try {
      const blob = new Blob([imageBuffer], { type: mime })
      const { data } = await worker.recognize(blob)
      return data.text
    } finally {
      await worker.terminate()
    }
  },

  /**
   * OCR an entire scanned PDF: render each page to an image then OCR it.
   */
  async ocrPdf(
    pdfBuffer: ArrayBuffer,
    lang: string = 'eng',
    onProgress?: ProgressFn
  ): Promise<string> {
    const { createWorker } = await import('tesseract.js')
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) }).promise
    const total = pdf.numPages
    const worker = await createWorker(lang)
    const chunks: string[] = []

    try {
      for (let i = 1; i <= total; i++) {
        const { buffer } = await renderPdfPageToBlob(pdf, i, dpiToScale(200))
        const blob = new Blob([buffer], { type: 'image/jpeg' })
        const { data } = await worker.recognize(blob)
        chunks.push(data.text)
        if (onProgress) {
          onProgress(Math.round((i / total) * 100), `OCR page ${i}/${total}`)
        }
      }
    } finally {
      await worker.terminate()
      pdf.cleanup()
    }

    return chunks.join('\n\n--- Page Break ---\n\n')
  },

  /**
   * Unified "to PDF" converter. Detects source format and routes to the right engine.
   */
  async convertToPdf(
    buffer: ArrayBuffer,
    sourceFormat: string,
    onProgress?: ProgressFn
  ): Promise<ConvertResult> {
    onProgress?.(10, 'Preparing...')

    switch (sourceFormat) {
      case 'txt': {
        const text = new TextDecoder().decode(buffer)
        return this._textToPdf(text, onProgress)
      }
      case 'docx': {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ arrayBuffer: buffer })
        return this._textToPdf(result.value, onProgress)
      }
      case 'xlsx':
      case 'csv': {
        const XLSX = await import('xlsx')
        const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_csv(sheet)
        return this._textToPdf(rows, onProgress)
      }
      case 'html': {
        const html = new TextDecoder().decode(buffer)
        // Strip tags for a simple text-based PDF (full layout would need a DOM)
        const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        return this._textToPdf(text, onProgress)
      }
      case 'jpg':
      case 'png': {
        return this._imageToPdf(buffer, sourceFormat, onProgress)
      }
      default:
        throw new Error(`Unsupported source format for PDF conversion: ${sourceFormat}`)
    }
  },

  /**
   * Unified "from PDF" converter.
   */
  async convertFromPdf(
    buffer: ArrayBuffer,
    targetFormat: string,
    onProgress?: ProgressFn
  ): Promise<ConvertResult> {
    switch (targetFormat) {
      case 'txt':
        return this._pdfToText(buffer, onProgress)
      case 'docx':
        return this._pdfToDocx(buffer, onProgress)
      case 'pptx':
        return this._pdfToPptx(buffer, onProgress)
      case 'jpg':
      case 'png':
        // Returns a single combined result is not ideal; use pdfToImages instead
        throw new Error('Use pdfToImages for image extraction')
      default:
        throw new Error(`Unsupported target format: ${targetFormat}`)
    }
  },

  /**
   * Render all PDF pages to image buffers (for galleries / slide extraction).
   */
  async pdfToImages(
    buffer: ArrayBuffer,
    dpi: number = 150,
    onProgress?: ProgressFn
  ): Promise<MultiImageResult> {
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
    const total = pdf.numPages
    const images: MultiImageResult['images'] = []

    for (let i = 1; i <= total; i++) {
      const { buffer: imgBuffer } = await renderPdfPageToBlob(pdf, i, dpiToScale(dpi))
      images.push({ index: i - 1, buffer: imgBuffer, mime: 'image/jpeg' })
      onProgress?.(Math.round((i / total) * 100), `Rendering page ${i}/${total}`)
    }

    pdf.cleanup()
    return { images }
  },

  /**
   * PDF → PPTX: render each page at high DPI and place as a full-slide image.
   */
  async _pdfToPptx(buffer: ArrayBuffer, onProgress?: ProgressFn): Promise<ConvertResult> {
    const PptxGenJS = (await import('pptxgenjs')).default
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
    const total = pdf.numPages
    const pptx = new PptxGenJS()
    pptx.defineLayout({ name: 'A4', width: 10, height: 7.5 })
    pptx.layout = 'A4'

    for (let i = 1; i <= total; i++) {
      const { buffer: imgBuffer } = await renderPdfPageToBlob(pdf, i, dpiToScale(300))
      const base64 = arrayBufferToBase64(imgBuffer)
      const slide = pptx.addSlide()
      slide.addImage({
        data: `image/jpeg;base64,${base64}`,
        x: 0, y: 0, w: '100%', h: '100%',
      })
      onProgress?.(Math.round((i / total) * 100), `Building slide ${i}/${total}`)
    }

    pdf.cleanup()
    const out = (await pptx.write({ outputType: 'arraybuffer' })) as ArrayBuffer
    return {
      buffer: out,
      mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      extension: 'pptx',
    }
  },

  /**
   * PDF → DOCX: extract text per page and rebuild as a Word document.
   */
  async _pdfToDocx(buffer: ArrayBuffer, onProgress?: ProgressFn): Promise<ConvertResult> {
    const { Document, Packer, Paragraph, TextRun } = await import('docx')
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
    const total = pdf.numPages
    const paragraphs: InstanceType<typeof Paragraph>[] = []

    for (let i = 1; i <= total; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const text = content.items
        .map((it) => ('str' in it ? it.str : ''))
        .join(' ')
      paragraphs.push(new Paragraph({ children: [new TextRun(text)] }))
      page.cleanup()
      onProgress?.(Math.round((i / total) * 100), `Extracting page ${i}/${total}`)
    }

    pdf.cleanup()
    const doc = new Document({ sections: [{ children: paragraphs }] })
    const blob = await Packer.toBlob(doc)
    const out = await blob.arrayBuffer()
    return {
      buffer: out,
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx',
    }
  },

  /**
   * PDF → TXT: concatenate text from all pages.
   */
  async _pdfToText(buffer: ArrayBuffer, onProgress?: ProgressFn): Promise<ConvertResult> {
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
    const total = pdf.numPages
    const chunks: string[] = []

    for (let i = 1; i <= total; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      chunks.push(content.items.map((it) => ('str' in it ? it.str : '')).join(' '))
      page.cleanup()
      onProgress?.(Math.round((i / total) * 100), `Extracting page ${i}/${total}`)
    }

    pdf.cleanup()
    const text = chunks.join('\n\n')
    return {
      buffer: new TextEncoder().encode(text).buffer as ArrayBuffer,
      mime: 'text/plain',
      extension: 'txt',
    }
  },

  /**
   * Build a text-based DOCX from raw text (used by OCR → Word).
   */
  async textToDocx(text: string): Promise<ConvertResult> {
    const { Document, Packer, Paragraph, TextRun } = await import('docx')
    const paragraphs = text
      .split('\n')
      .map((line) => new Paragraph({ children: [new TextRun(line)] }))
    const doc = new Document({ sections: [{ children: paragraphs }] })
    const blob = await Packer.toBlob(doc)
    const out = await blob.arrayBuffer()
    return {
      buffer: out,
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      extension: 'docx',
    }
  },

  // ─── Internal builders ──────────────────────────────────────────────────────

  /** Wrap plain text into a multi-page PDF using pdf-lib */
  async _textToPdf(text: string, onProgress?: ProgressFn): Promise<ConvertResult> {
    onProgress?.(40, 'Laying out text...')
    const doc = await PDFDocument.create()
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const fontSize = 11
    const margin = 50
    const pageWidth = 595 // A4 in points
    const pageHeight = 842
    const maxWidth = pageWidth - margin * 2
    const lineHeight = fontSize * 1.4

    // Word-wrap the text
    const words = text.replace(/\r/g, '').split(/(\s+)/)
    const lines: string[] = []
    let current = ''

    for (const word of words) {
      const test = current + word
      const width = font.widthOfTextAtSize(test.replace(/\n/g, ''), fontSize)
      if (word.includes('\n')) {
        const parts = (current + word).split('\n')
        for (let p = 0; p < parts.length - 1; p++) lines.push(parts[p])
        current = parts[parts.length - 1]
      } else if (width > maxWidth) {
        lines.push(current)
        current = word
      } else {
        current = test
      }
    }
    if (current) lines.push(current)

    let page = doc.addPage([pageWidth, pageHeight])
    let y = pageHeight - margin

    for (const line of lines) {
      if (y < margin) {
        page = doc.addPage([pageWidth, pageHeight])
        y = pageHeight - margin
      }
      page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) })
      y -= lineHeight
    }

    onProgress?.(90, 'Saving PDF...')
    const bytes = await doc.save()
    return { buffer: bytes.buffer as ArrayBuffer, mime: 'application/pdf', extension: 'pdf' }
  },

  /** Embed a single image into a PDF page sized to the image */
  async _imageToPdf(
    buffer: ArrayBuffer,
    format: string,
    onProgress?: ProgressFn
  ): Promise<ConvertResult> {
    onProgress?.(40, 'Embedding image...')
    const doc = await PDFDocument.create()
    const image = format === 'png'
      ? await doc.embedPng(buffer)
      : await doc.embedJpg(buffer)

    const page = doc.addPage([image.width, image.height])
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })

    onProgress?.(90, 'Saving PDF...')
    const bytes = await doc.save()
    return { buffer: bytes.buffer as ArrayBuffer, mime: 'application/pdf', extension: 'pdf' }
  },

  /**
   * Apply a drawn signature image onto a specific PDF page at given coordinates.
   * coords are normalized 0..1 relative to page dimensions.
   */
  async signPdf(
    pdfBuffer: ArrayBuffer,
    signaturePng: ArrayBuffer,
    placement: { pageIndex: number; x: number; y: number; width: number; height: number }
  ): Promise<ArrayBuffer> {
    const doc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true })
    const png = await doc.embedPng(signaturePng)
    const pages = doc.getPages()
    const page = pages[placement.pageIndex] ?? pages[0]
    const { width: pw, height: ph } = page.getSize()

    page.drawImage(png, {
      x: placement.x * pw,
      // PDF origin is bottom-left; convert from top-left normalized coords
      y: ph - placement.y * ph - placement.height * ph,
      width: placement.width * pw,
      height: placement.height * ph,
    })

    const bytes = await doc.save()
    return bytes.buffer as ArrayBuffer
  },
}

/** Convert ArrayBuffer to base64 (used for pptxgenjs image embedding) */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

export type OmniWorkerApi = typeof api

Comlink.expose(api)
