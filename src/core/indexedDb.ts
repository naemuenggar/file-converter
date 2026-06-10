/**
 * IndexedDB layer using localforage.
 * Stores session state, file metadata, and workspace layouts for offline persistence.
 */
import localforage from 'localforage'

// Configure the main store for PDFCraft sessions
export const sessionStore = localforage.createInstance({
  name: 'pdfcraft-enterprise',
  storeName: 'sessions',
  description: 'User session and workspace persistence',
})

// Store for cached page thumbnails (blob references only)
export const thumbnailStore = localforage.createInstance({
  name: 'pdfcraft-enterprise',
  storeName: 'thumbnails',
  description: 'Cached page thumbnail blobs',
})

// Store for file metadata
export const metadataStore = localforage.createInstance({
  name: 'pdfcraft-enterprise',
  storeName: 'metadata',
  description: 'PDF file metadata',
})

/** Schema for persisted workspace state */
export interface WorkspaceState {
  id: string
  pages: PageEntry[]
  createdAt: number
  updatedAt: number
}

export interface PageEntry {
  id: string
  sourceFileId: string
  sourceFileName: string
  pageIndex: number
  rotation: number // 0, 90, 180, 270
  thumbnailKey?: string
}

export interface FileMetadata {
  id: string
  name: string
  size: number
  pageCount: number
  addedAt: number
}

/** Save workspace state */
export async function saveWorkspace(state: WorkspaceState): Promise<void> {
  await sessionStore.setItem(`workspace:${state.id}`, state)
}

/** Load workspace state */
export async function loadWorkspace(id: string): Promise<WorkspaceState | null> {
  return sessionStore.getItem<WorkspaceState>(`workspace:${id}`)
}

/** Save file metadata */
export async function saveFileMetadata(meta: FileMetadata): Promise<void> {
  await metadataStore.setItem(`file:${meta.id}`, meta)
}

/** Load all file metadata */
export async function loadAllFileMetadata(): Promise<FileMetadata[]> {
  const items: FileMetadata[] = []
  await metadataStore.iterate<FileMetadata, void>((value) => {
    items.push(value)
  })
  return items
}
