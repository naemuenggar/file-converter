/**
 * Shared file-size limits and guards.
 *
 * Browsers cannot safely buffer arbitrarily large files in memory. We enforce a
 * hard 500MB ceiling at the very start of every upload flow so a too-large file
 * fails with a clean message instead of a silent OOM tab crash.
 */
export const MAX_FILE_BYTES = 500 * 1024 * 1024 // 500MB

/**
 * Returns a user-friendly error string if the file is too large, else null.
 */
export function checkFileSize(file: File): string | null {
  if (file.size > MAX_FILE_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(0)
    return `"${file.name}" is ${mb}MB, which exceeds the 500MB limit for in-browser processing. Try splitting the file first.`
  }
  return null
}
