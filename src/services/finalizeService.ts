import { apiClient, BaseResponse } from './apiClient';

// formdata
interface createSessionRequest {
  invoiceNumber: string;
  tenantId: number;
  isPublish: boolean;
  photo1: File;
  photo2: File;
  photo3: File;
  photo4: File;
  photo5: File;
  gif: Blob;
  video: Blob;
}

interface createSessionResult {
  sessionCode: string;
  resultUrl: string;
  qrCodeBase64: string;
  isPublish: boolean;
}

export interface getSessionResult {
  sessionCode: string
  invoiceNumber: string
  photo1Url: string
  photo2Url: string
  photo3Url: string
  photo4Url: string
  photo5Url: string
  gifUrl: string
  videoUrl: string
  isPublish: boolean
  createdAt: string
  qrCodePath: string
  QrCinta: string
}

interface sendEmailRequest {
  invoiceNumber: string;
  customerEmail: string;
}

export async function createSessions(req: createSessionRequest): Promise<BaseResponse<createSessionResult>> {
  try {
    const form = new FormData();
    form.append('invoiceNumber', req.invoiceNumber);
    form.append('tenantId', req.tenantId.toString());
    form.append('isPublish', req.isPublish.toString());
    form.append('photo1', req.photo1, req.photo1.name);
    form.append('photo2', req.photo2, req.photo2.name);
    form.append('photo3', req.photo3, req.photo3.name);
    form.append('photo4', req.photo4, req.photo4.name);
    form.append('photo5', req.photo5, req.photo5.name);
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

export async function getSesssions(session: string): Promise<BaseResponse<getSessionResult>> {
  try {
    const res = await apiClient.get<BaseResponse<getSessionResult>>(`/photobooth/sessions/${session}`)
    return res.data
  } catch (error) {
    throw error
  }
}

export async function sendEmail(req: sendEmailRequest): Promise<BaseResponse<any>> {
  try {
    const res = await apiClient.post<BaseResponse<any>>(`/invoices/send-email`, req)
    return res.data
  } catch (error) {
    throw error
  }
}