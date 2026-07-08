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

  /**
   * Peta id templat → object URL thumbnail WebP kecil untuk preview carousel.
   * `displayUrl` full-res TIDAK diganti (masih dipakai composite di DragDropPage).
   */
  thumbs: Record<number, string>

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

// Tinggi thumbnail (px). Carousel menampilkan h-80 (320px), dikali ~2x untuk
// layar hi-dpi. Cukup tajam tapi jauh lebih ringan dari full-res 2000px.
const THUMB_HEIGHT = 700

/**
 * Buat thumbnail WebP kecil dari sebuah displayUrl full-res.
 * Efek samping: fetch-nya sekaligus menghangatkan HTTP cache untuk full-res
 * (dipakai composite di DragDropPage). Mengembalikan object URL, atau null
 * bila lingkungan tidak mendukung (fallback ke full-res di UI).
 */
async function makeThumb(url: string): Promise<string | null> {
  try {
    const blob = await (await fetch(url)).blob()
    // Decode untuk tahu rasio aslinya.
    const probe = await createImageBitmap(blob)
    const scale = THUMB_HEIGHT / probe.height
    const w = Math.max(1, Math.round(probe.width * scale))
    const h = THUMB_HEIGHT
    probe.close?.()

    const bmp = await createImageBitmap(blob, {
      resizeWidth: w,
      resizeHeight: h,
      resizeQuality: 'high',
    })
    const canvas = new OffscreenCanvas(w, h)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(bmp, 0, 0)
    bmp.close?.()

    const out = await canvas.convertToBlob({ type: 'image/webp', quality: 0.85 })
    return URL.createObjectURL(out)
  } catch (e) {
    console.warn('makeThumb gagal, fallback ke full-res:', e)
    return null
  }
}

/**
 * Hasilkan thumbnail untuk semua templat dengan konkurensi terbatas (agar
 * decode full-res tidak menyerbu sekaligus). Progresif — tiap thumb yang
 * selesai langsung masuk state. Berhenti menulis bila tenant sudah berganti.
 */
async function warmThumbs(
  tenantId: number,
  templates: Template[],
  set: (partial: Partial<TemplateState>) => void,
  get: () => TemplateState,
) {
  const CONCURRENCY = 3
  const queue = templates.filter((t) => t.displayUrl)
  let i = 0

  async function worker() {
    while (i < queue.length) {
      const t = queue[i++]
      const objUrl = await makeThumb(t.displayUrl)
      // Tenant berganti / cache dibersihkan selama proses → buang hasil.
      if (get().loadedTenantId !== tenantId) {
        if (objUrl) URL.revokeObjectURL(objUrl)
        return
      }
      if (objUrl) set({ thumbs: { ...get().thumbs, [t.id]: objUrl } })
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker),
  )
}

function revokeThumbs(thumbs: Record<number, string>) {
  for (const url of Object.values(thumbs)) URL.revokeObjectURL(url)
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],
  selectedTemplate: null,
  loading: false,
  error: null,
  thumbs: {},
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

    // Tenant berganti / muat ulang → buang thumbnail lama.
    revokeThumbs(get().thumbs)
    set({ loading: true, error: null, thumbs: {} })

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

          // Bikin thumbnail ringan untuk carousel (sekaligus menghangatkan
          // HTTP cache full-res untuk composite). Jalan di latar belakang.
          void warmThumbs(tenantId, sorted, set, get)
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
    revokeThumbs(get().thumbs)
    set({
      templates: [],
      selectedTemplate: null,
      loading: false,
      error: null,
      thumbs: {},
      loadedTenantId: null,
    })
  },
}))
