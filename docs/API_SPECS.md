# API Integration Specifications

## Base Rules
- Base URL from environment (`VITE_API_BASE_URL`).
- JSON request/response.
- Authorization header is required after login for protected endpoints.

## Authentication Flow
### POST /auth/login
**Request**
```json
{ "username": "admin", "password": "***" }
```
**Response**
```json
{
  "token": "jwt-token",
  "admin": { "id": "a1", "name": "Operator" },
  "settings": { "sessionDurationSec": 180, "currency": "IDR" }
}
```

## Product & Voucher
### GET /products
Query: `type` optional (`bundle`, `addon`)

### POST /vouchers/validate
**Request**
```json
{ "code": "PROMO10", "subtotal": 50000 }
```
**Response**
```json
{ "valid": true, "discountType": "percent", "discountValue": 10, "discountAmount": 5000 }
```

## Payment Integration
### POST /transactions/create
**Request**
```json
{
  "items": [{ "productId": "p1", "qty": 1 }],
  "extraPrintQty": 1,
  "voucherCode": "PROMO10",
  "totalAmount": 75000
}
```
**Response**
```json
{
  "transactionId": "trx_123",
  "amount": 75000,
  "qrisPayload": "000201...",
  "qrisImageUrl": "https://.../qris.png",
  "expiresAt": "2026-05-27T11:00:00Z"
}
```

### GET /transactions/{id}/status
**Response**
```json
{ "transactionId": "trx_123", "status": "PENDING|PAID|EXPIRED|FAILED", "paidAt": null }
```

## Template & Finalization
### GET /templates
**Response**
```json
[
  { "id": "tpl_1", "name": "Lana Style", "slotCount": 4, "thumbnailUrl": "https://..." }
]
```

### POST /transactions/{id}/finalize
Uploads final composed output + metadata.
**Request (multipart or signed upload reference)**
- `finalImage`
- `rawPhotos[]`
- `templateId`
- `filter`
- `videoUrl` or `videoBlob`

**Response**
```json
{ "saved": true, "printToken": "prt_abc", "downloadQrUrl": "https://.../qr.png" }
```

## Email Service
### POST /email/send-invoice
**Request**
```json
{ "transactionId": "trx_123", "email": "user@example.com" }
```
**Response**
```json
{ "queued": true, "messageId": "msg_001" }
```

## Video Recording Specs
- Start trigger: halaman 8 entry.
- Stop trigger: after halaman 14 print finalize.
- Preferred codec: `video/webm;codecs=vp8` (fallback browser default).
- Target: 720p or 1080p with adaptive bitrate.
- Upload via finalize endpoint or dedicated signed URL path.

## Error Handling
Standard error envelope:
```json
{
  "error": {
    "code": "VOUCHER_INVALID",
    "message": "Voucher code is invalid",
    "details": {}
  }
}
```
HTTP mapping:
- `400` validation errors
- `401` unauthorized/expired token
- `409` state conflict (already paid/finalized)
- `422` business rule failures
- `500` server/internal errors

Client behavior:
- Retry-safe polling for status endpoint.
- Toast + actionable CTA on failure (retry/back/contact staff).
- Auto-reset session on unrecoverable failures.
