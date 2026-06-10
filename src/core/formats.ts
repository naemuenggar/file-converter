/**
 * Format detection + conversion target matrix for OmniDoc OS.
 * Shared between the UI (UniversalConverter) and the Omni-Worker.
 */

export type FileFormat =
  | 'pdf'
  | 'docx'
  | 'pptx'
  | 'xlsx'
  | 'csv'
  | 'txt'
  | 'html'
  | 'jpg'
  | 'png'
  | 'unknown'

export interface ConversionTarget {
  format: FileFormat
  label: string
}

/** Detect a file's logical format from name + MIME type */
export function detectFormat(name: string, mime: string = ''): FileFormat {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''

  if (ext === 'pdf' || mime === 'application/pdf') return 'pdf'
  if (ext === 'docx' || ext === 'doc') return 'docx'
  if (ext === 'pptx' || ext === 'ppt') return 'pptx'
  if (ext === 'xlsx' || ext === 'xls') return 'xlsx'
  if (ext === 'csv') return 'csv'
  if (ext === 'txt') return 'txt'
  if (ext === 'html' || ext === 'htm') return 'html'
  if (ext === 'jpg' || ext === 'jpeg' || mime === 'image/jpeg') return 'jpg'
  if (ext === 'png' || mime === 'image/png') return 'png'
  return 'unknown'
}

/** Available conversion targets given a source format */
export const CONVERSION_MATRIX: Record<FileFormat, ConversionTarget[]> = {
  pdf: [
    { format: 'jpg', label: 'PDF to JPG' },
    { format: 'png', label: 'PDF to PNG' },
    { format: 'txt', label: 'PDF to Text' },
    { format: 'docx', label: 'PDF to Word' },
    { format: 'pptx', label: 'PDF to PowerPoint' },
    { format: 'xlsx', label: 'PDF to Excel' },
  ],
  docx: [
    { format: 'pdf', label: 'Word to PDF' },
    { format: 'txt', label: 'Word to Text' },
    { format: 'html', label: 'Word to HTML' },
  ],
  pptx: [
    { format: 'pdf', label: 'PowerPoint to PDF' },
    { format: 'jpg', label: 'Slides to Images' },
  ],
  xlsx: [
    { format: 'pdf', label: 'Excel to PDF' },
    { format: 'csv', label: 'Excel to CSV' },
    { format: 'html', label: 'Excel to HTML' },
  ],
  csv: [
    { format: 'xlsx', label: 'CSV to Excel' },
    { format: 'pdf', label: 'CSV to PDF' },
  ],
  txt: [
    { format: 'pdf', label: 'Text to PDF' },
    { format: 'docx', label: 'Text to Word' },
  ],
  html: [
    { format: 'pdf', label: 'HTML to PDF' },
  ],
  jpg: [
    { format: 'pdf', label: 'JPG to PDF' },
    { format: 'txt', label: 'Image to Text (OCR)' },
    { format: 'docx', label: 'Image to Word (OCR)' },
  ],
  png: [
    { format: 'pdf', label: 'PNG to PDF' },
    { format: 'txt', label: 'Image to Text (OCR)' },
    { format: 'docx', label: 'Image to Word (OCR)' },
  ],
  unknown: [],
}

export function getTargets(format: FileFormat): ConversionTarget[] {
  return CONVERSION_MATRIX[format] ?? []
}

const LABELS: Record<FileFormat, string> = {
  pdf: 'PDF', docx: 'Word', pptx: 'PowerPoint', xlsx: 'Excel',
  csv: 'CSV', txt: 'Text', html: 'HTML', jpg: 'JPG', png: 'PNG', unknown: 'Unknown',
}

export function formatLabel(format: FileFormat): string {
  return LABELS[format]
}
