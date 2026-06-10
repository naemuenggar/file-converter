/**
 * Maps low-level engine exceptions (pdf.js, pdf-lib, tesseract, allocator) into
 * clean, human-readable messages for the UI. Prevents cryptic stack-trace text
 * from ever reaching the user.
 */
export function friendlyError(err: unknown): string {
  const name = (err as { name?: string })?.name ?? ''
  const msg = (err as { message?: string })?.message ?? ''

  // Password-protected PDFs (pdf.js throws PasswordException)
  if (name === 'PasswordException' || /password/i.test(msg)) {
    return 'This PDF is password-protected. Please remove the password first (Tools → Unlock PDF), then try again.'
  }

  // Corrupt / invalid PDFs
  if (name === 'InvalidPDFException' || /invalid pdf|malformed|corrupt/i.test(msg)) {
    return 'This file appears to be corrupted or is not a valid PDF.'
  }

  // Out-of-memory / allocation failures
  if (/allocation failed|out of memory|maximum call stack/i.test(msg)) {
    return 'The file is too large or complex to process in-browser. Try a smaller file.'
  }

  // Encoding limits (e.g. WinAnsi standard font cannot encode a glyph)
  if (/cannot encode|WinAnsi|encode the text/i.test(msg)) {
    return 'This document contains characters the basic font cannot render. Some characters may be substituted.'
  }

  return msg || 'Something went wrong during processing. Please try again.'
}
