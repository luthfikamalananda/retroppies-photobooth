// Shared TypeScript types across the app

export interface AdminProfile {
  id: string
  name: string
}

export interface SessionSettings {
  sessionDurationSec: number
  currency: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  type: 'bundle' | 'addon'
  imageUrl?: string
}

export interface Template {
  id: string
  name: string
  slotCount: number
  thumbnailUrl: string
}

export interface Transaction {
  transactionId: string
  amount: number
  qrisPayload: string
  qrisImageUrl: string
  expiresAt: string
}

export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED'
