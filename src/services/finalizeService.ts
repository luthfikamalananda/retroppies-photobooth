import { apiClient, BaseResponse } from './apiClient'
import { USE_MOCK } from '@/mocks/mockFlag'
import { mockFinalizeTransaction } from '@/mocks/data/finalize.mock'

// formdata
interface createSessionRequest {
  invoiceNumber: string;
  tenantId: number;
  isPublish: boolean;
  photo1: string;
  photo2: string;
  photo3: string;
  photo4: string;
  photo5: string;
  gif: Blob;
  video: Blob;
}

interface createSessionResult {
  sessionCode: string;
  resultUrl: string;
  qrCodeBase64: string;
  isPublish: boolean;
}

export async function createSessions(req: createSessionRequest): Promise<BaseResponse<createSessionResult>> {
  try {
    const form = new FormData();
    form.append('invoiceNumber', req.invoiceNumber);
    form.append('tenantId', req.tenantId.toString());
    form.append('isPublish', req.isPublish.toString());
    form.append('photo1', req.photo1);
    form.append('photo2', req.photo2);
    form.append('photo3', req.photo3);
    form.append('photo4', req.photo4);
    form.append('photo5', req.photo5);
    // ← Pastikan Blob punya type yang benar + filename wajib ada
    const gifBlob = req.gif.type
      ? req.gif
      : new Blob([req.gif], { type: 'image/gif' })  // fallback jika type kosong

    const videoBlob = req.video.type
      ? req.video
      : new Blob([req.video], { type: 'video/webm' }) // fallback jika type kosong

    form.append('gif', gifBlob, 'result.gif')      // ← filename wajib untuk Blob
    form.append('video', videoBlob, 'result.webm') // ← filename wajib untuk Blob
    const res = await apiClient.post<BaseResponse<createSessionResult>>(`/photobooth/sessions`, form, {
      headers: {
        'Content-Type': 'multipart/form-data', // ← Pastikan header ini ada
      },
    })
    return res.data
  } catch (error) {
    throw error
  }
}
