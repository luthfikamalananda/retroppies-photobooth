/**
 * Global mock mode flag.
 * Toggle via VITE_USE_MOCK=true in your .env file.
 * When true, all service calls return local dummy data instead of hitting the real API.
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

/** Simulates realistic network latency in mock mode */
export function mockDelay(ms = 600): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
