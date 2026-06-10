/**
 * useCloudSync Composable
 * 
 * Handles cloud synchronization of file metadata to Supabase PostgreSQL
 * and file uploads to Supabase Storage with progress tracking.
 */
import { ref } from 'vue'
import { getSupabaseClient, isSupabaseConfigured } from '@/core/supabaseClient'

export interface CloudFileRecord {
  id?: string
  user_id?: string
  filename: string
  page_count: number
  file_size: number
  operation: string
  created_at?: string
}

export function useCloudSync() {
  const uploading = ref(false)
  const uploadProgress = ref(0)
  const syncError = ref<string | null>(null)
  const shareUrl = ref<string | null>(null)

  /**
   * Save file processing metadata to Supabase `pdf_operations` table.
   * Uses RLS — only the authenticated user can read their own rows.
   */
  async function syncMetadata(record: CloudFileRecord): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      syncError.value = 'Supabase not configured'
      return false
    }

    syncError.value = null

    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.from('pdf_operations').insert(record)
      if (error) throw error
      return true
    } catch (err) {
      syncError.value = err instanceof Error ? err.message : 'Sync failed'
      return false
    }
  }

  /**
   * Upload a processed file blob to Supabase Storage.
   * Returns a temporary signed URL for sharing.
   */
  async function uploadToCloud(
    blob: Blob,
    filename: string,
    bucket: string = 'pdf-outputs'
  ): Promise<string | null> {
    if (!isSupabaseConfigured()) {
      syncError.value = 'Supabase not configured'
      return null
    }

    uploading.value = true
    uploadProgress.value = 0
    syncError.value = null
    shareUrl.value = null

    try {
      const supabase = getSupabaseClient()

      // Get current user for path scoping
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const filePath = `${user.id}/${Date.now()}_${filename}`

      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, blob, {
          contentType: 'application/pdf',
          upsert: false,
        })

      if (uploadError) throw uploadError

      uploadProgress.value = 100

      // Create a signed URL (valid for 1 hour)
      const { data: signedData, error: signedError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 3600)

      if (signedError) throw signedError

      shareUrl.value = signedData.signedUrl
      return signedData.signedUrl
    } catch (err) {
      syncError.value = err instanceof Error ? err.message : 'Upload failed'
      return null
    } finally {
      uploading.value = false
    }
  }

  /**
   * Fetch user's operation history from Supabase.
   */
  async function fetchHistory(): Promise<CloudFileRecord[]> {
    if (!isSupabaseConfigured()) return []

    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('pdf_operations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data ?? []
    } catch (err) {
      syncError.value = err instanceof Error ? err.message : 'Fetch failed'
      return []
    }
  }

  return {
    uploading,
    uploadProgress,
    syncError,
    shareUrl,
    syncMetadata,
    uploadToCloud,
    fetchHistory,
  }
}
