/**
 * Tool Registry - Plugin-based system defining all iLovePDF-style tools.
 * Each tool has metadata, a category, an icon, and a lazy-loaded route component.
 */

export type ToolCategory = 'organize' | 'optimize' | 'convert-to' | 'convert-from' | 'edit-security'

export interface ToolDefinition {
  id: string
  name: string
  description: string
  category: ToolCategory
  /** Heroicon-style SVG path */
  icon: string
  /** Accent color for the tool card */
  color: string
  /** Route path */
  path: string
}

export const TOOL_CATEGORIES: Record<ToolCategory, string> = {
  organize: 'Organize PDF',
  optimize: 'Optimize PDF',
  'convert-to': 'Convert to PDF',
  'convert-from': 'Convert from PDF',
  'edit-security': 'Edit & Security',
}

export const TOOLS: ToolDefinition[] = [
  // ─── Organize ──────────────────────────────────────────────────────────────
  {
    id: 'merge',
    name: 'Merge PDF',
    description: 'Combine multiple PDFs into one document',
    category: 'organize',
    icon: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4',
    color: 'indigo',
    path: '/tools/merge',
  },
  {
    id: 'split',
    name: 'Split PDF',
    description: 'Separate one PDF into multiple files',
    category: 'organize',
    icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2',
    color: 'blue',
    path: '/tools/split',
  },
  {
    id: 'remove-pages',
    name: 'Remove Pages',
    description: 'Delete specific pages from your PDF',
    category: 'organize',
    icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    color: 'rose',
    path: '/tools/remove-pages',
  },
  {
    id: 'organize',
    name: 'Organize PDF',
    description: 'Reorder, rotate and manage pages visually',
    category: 'organize',
    icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
    color: 'violet',
    path: '/tools/organize',
  },
  {
    id: 'scan',
    name: 'Scan to PDF',
    description: 'Convert images from camera into a PDF',
    category: 'organize',
    icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z',
    color: 'teal',
    path: '/tools/scan',
  },

  // ─── Optimize ──────────────────────────────────────────────────────────────
  {
    id: 'compress',
    name: 'Compress PDF',
    description: 'Reduce file size while keeping quality',
    category: 'optimize',
    icon: 'M19 14l-7 7m0 0l-7-7m7 7V3',
    color: 'green',
    path: '/tools/compress',
  },
  {
    id: 'repair',
    name: 'Repair PDF',
    description: 'Recover data from a corrupt PDF',
    category: 'optimize',
    icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z',
    color: 'amber',
    path: '/tools/repair',
  },

  // ─── Convert to PDF ──────────────────────────────────────────────────────────
  {
    id: 'jpg-to-pdf',
    name: 'JPG to PDF',
    description: 'Convert images into a PDF document',
    category: 'convert-to',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    color: 'yellow',
    path: '/tools/jpg-to-pdf',
  },
  {
    id: 'word-to-pdf',
    name: 'Word to PDF',
    description: 'Convert DOCX documents to PDF',
    category: 'convert-to',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    color: 'blue',
    path: '/tools/word-to-pdf',
  },
  {
    id: 'ppt-to-pdf',
    name: 'PowerPoint to PDF',
    description: 'Convert presentations to PDF',
    category: 'convert-to',
    icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z',
    color: 'orange',
    path: '/tools/ppt-to-pdf',
  },
  {
    id: 'excel-to-pdf',
    name: 'Excel to PDF',
    description: 'Convert spreadsheets to PDF',
    category: 'convert-to',
    icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    color: 'green',
    path: '/tools/excel-to-pdf',
  },
  {
    id: 'html-to-pdf',
    name: 'HTML to PDF',
    description: 'Convert web pages to PDF',
    category: 'convert-to',
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    color: 'red',
    path: '/tools/html-to-pdf',
  },

  // ─── Convert from PDF ────────────────────────────────────────────────────────
  {
    id: 'pdf-to-jpg',
    name: 'PDF to JPG',
    description: 'Convert each PDF page to an image',
    category: 'convert-from',
    icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    color: 'yellow',
    path: '/tools/pdf-to-jpg',
  },
  {
    id: 'pdf-to-word',
    name: 'PDF to Word',
    description: 'Convert PDF to editable DOCX',
    category: 'convert-from',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    color: 'blue',
    path: '/tools/pdf-to-word',
  },
  {
    id: 'pdf-to-ppt',
    name: 'PDF to PowerPoint',
    description: 'Turn each PDF page into a slide',
    category: 'convert-from',
    icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z',
    color: 'orange',
    path: '/tools/pdf-to-ppt',
  },
  {
    id: 'pdf-to-excel',
    name: 'PDF to Excel',
    description: 'Extract tables into a spreadsheet',
    category: 'convert-from',
    icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    color: 'green',
    path: '/tools/pdf-to-excel',
  },
  {
    id: 'pdf-to-text',
    name: 'PDF to Text',
    description: 'Extract all text from a PDF',
    category: 'convert-from',
    icon: 'M4 6h16M4 12h16M4 18h7',
    color: 'slate',
    path: '/tools/pdf-to-text',
  },

  // ─── Edit & Security ─────────────────────────────────────────────────────────
  {
    id: 'edit',
    name: 'Edit PDF',
    description: 'Add text and images to your PDF',
    category: 'edit-security',
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    color: 'purple',
    path: '/tools/edit',
  },
  {
    id: 'sign',
    name: 'Sign PDF',
    description: 'Draw and apply your signature',
    category: 'edit-security',
    icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
    color: 'pink',
    path: '/tools/sign',
  },
  {
    id: 'watermark',
    name: 'Watermark',
    description: 'Stamp text or image over pages',
    category: 'edit-security',
    icon: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z',
    color: 'cyan',
    path: '/tools/watermark',
  },
  {
    id: 'page-numbers',
    name: 'Page Numbers',
    description: 'Add page numbers to your PDF',
    category: 'edit-security',
    icon: 'M7 20l4-16m2 16l4-16M6 9h14M4 15h14',
    color: 'fuchsia',
    path: '/tools/page-numbers',
  },
  {
    id: 'protect',
    name: 'Protect PDF',
    description: 'Encrypt with a password',
    category: 'edit-security',
    icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    color: 'red',
    path: '/tools/protect',
  },
  {
    id: 'unlock',
    name: 'Unlock PDF',
    description: 'Remove password protection',
    category: 'edit-security',
    icon: 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z',
    color: 'emerald',
    path: '/tools/unlock',
  },
]

/** Get tools grouped by category */
export function getToolsByCategory(): Record<ToolCategory, ToolDefinition[]> {
  const grouped = {} as Record<ToolCategory, ToolDefinition[]>
  for (const cat of Object.keys(TOOL_CATEGORIES) as ToolCategory[]) {
    grouped[cat] = TOOLS.filter((t) => t.category === cat)
  }
  return grouped
}

/** Find a tool by id */
export function getToolById(id: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.id === id)
}
