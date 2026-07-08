import { create } from 'zustand'
import { getTemplates, Template } from '@/services/templateService'

/**
 * templateStore
 *
 * Cache templat per-tenant untuk seluruh masa hidup sesi kiosk.
 * Dipakai agar TemplatePage tidak perlu fetch + download ulang setiap
 * kali dibuka. Diisi lebih awal (prefetch) dari TakePhotoPage sementara
 * user masih mengambil foto, lalu SEMUA gambar displayUrl "dihangatkan"
 * (warm) ke HTTP cache lewat `new Image()`.
 *
 * Lihat: docs/adr/0002-prefetch-dan-warm-template-di-halaman-sebelumnya.md
 */

interface TemplateState {
  templates: Template[]
  selectedTemplate: Template | null
  loading: boolean
  error: string | null

  /** tenantId yang datanya sedang tersimpan; null = belum pernah dimuat. */
  loadedTenantId: number | null

  setSelectedTemplate: (t: Template | null) => void
  /**
   * Memuat templat sekali saja per-tenant. Idempoten:
   * - jika data untuk tenant ini sudah ada → no-op
   * - jika ada fetch yang sedang berjalan → tempel ke promise itu
   * - jika tenant berganti → refetch
   */
  ensureTemplatesLoaded: (tenantId: number) => Promise<void>
  clear: () => void
}

// Fetch yang sedang berjalan (dedupe panggilan bersamaan). Disimpan di modul,
// bukan di state, agar tidak memicu re-render.
let inflight: { tenantId: number; promise: Promise<void> } | null = null

// Menahan referensi Image sampai selesai load supaya download tidak di-GC
// sebelum sempat masuk HTTP cache.
const warming = new Set<HTMLImageElement>()

function warmImages(templates: Template[]) {
  for (const t of templates) {
    if (!t.displayUrl) continue
    const img = new Image()
    img.decoding = 'async'
    const done = () => warming.delete(img)
    img.onload = done
    img.onerror = done
    img.src = t.displayUrl
    warming.add(img)
  }
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],
  selectedTemplate: null,
  loading: false,
  error: null,
  loadedTenantId: null,

  setSelectedTemplate: (t) => set({ selectedTemplate: t }),

  ensureTemplatesLoaded: (tenantId) => {
    const state = get()

    // Sudah ada data untuk tenant ini → tidak perlu apa-apa.
    if (state.loadedTenantId === tenantId && state.templates.length > 0) {
      return Promise.resolve()
    }

    // Fetch untuk tenant yang sama sedang berjalan → ikut promise itu.
    if (inflight && inflight.tenantId === tenantId) {
      return inflight.promise
    }

    set({ loading: true, error: null })

    const promise = getTemplates({
      tenantId,
      keyword: '',
      page: 1,
      limit: 999,
    })
      .then((res) => {
        if (res.result.total > 0) {
          const sorted = [...res.result.templates].sort(
            (a, b) => a.layoutId - b.layoutId,
          )
          const defaultTemplate =
            sorted.find((t) => t.isDefault === true) ?? sorted[0]

          set({
            templates: sorted,
            selectedTemplate: defaultTemplate,
            loadedTenantId: tenantId,
          })

          // Hangatkan semua gambar ke HTTP cache di latar belakang.
          warmImages(sorted)
        } else {
          set({ templates: [], selectedTemplate: null, loadedTenantId: tenantId })
        }
      })
      .catch((error) => {
        console.error(error)
        set({ error: 'Gagal memuat template. Silakan coba lagi.' })
      })
      .finally(() => {
        set({ loading: false })
        if (inflight && inflight.tenantId === tenantId) inflight = null
      })

    inflight = { tenantId, promise }
    return promise
  },

  clear: () => {
    inflight = null
    warming.clear()
    set({
      templates: [],
      selectedTemplate: null,
      loading: false,
      error: null,
      loadedTenantId: null,
    })
  },
}))
