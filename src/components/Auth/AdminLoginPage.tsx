import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useSessionStore } from '@/store/sessionStore'
import { useUIStore } from '@/store/uiStore'
import { login } from '@/services/authService'
import { checkHardware } from '@/services/hardwareService'
import { USE_MOCK } from '@/mocks/mockFlag'

export function AdminLoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [hardwareStatus, setHardwareStatus] = useState<{ cameraAvailable: boolean; printerAvailable: boolean } | null>(null)

    const setAuth = useAuthStore(s => s.setAuth)
    const goTo = useSessionStore(s => s.goTo)
    const { setLoading, loading } = useUIStore()
    const isLoading = loading['login'] ?? false

    const handleLogin = async () => {
        if (!username || !password) {
            setError('Username dan password wajib diisi.')
            return
        }
        setError(null)
        setLoading('login', true)
        try {
            const res = await login({ username, password })
            setAuth(res.token, res.admin, res.settings)
            const hw = await checkHardware()
            setHardwareStatus(hw)
            setTimeout(() => goTo(1), 800)
        } catch {
            setError('Login gagal. Periksa username dan password.')
        } finally {
            setLoading('login', false)
        }
    }

    return (
        <motion.div
            className="relative z-10 flex items-center justify-center w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Hardware badges */}
            {hardwareStatus && (
                <div className="absolute top-4 right-4 flex gap-2">
                    <Badge ok={hardwareStatus.cameraAvailable} label="Camera" />
                    <Badge ok={hardwareStatus.printerAvailable} label="Printer" />
                </div>
            )}

            <div className="bg-black/60 backdrop-blur-md border border-retro-amber/40 rounded-2xl p-10 w-full max-w-md flex flex-col gap-6">
                <h1 className="font-display text-retro-cream text-4xl text-center">RETROPPIES</h1>
                <p className="font-body text-retro-cream/60 text-center text-sm">Admin Login</p>

                {/* Mock mode credential hint */}
                {USE_MOCK && (
                    <div className="bg-yellow-400/10 border border-yellow-400/40 rounded-lg px-4 py-2 text-center">
                        <p className="font-body text-yellow-300 text-xs font-semibold mb-0.5">🟡 MOCK MODE — Gunakan kredensial berikut:</p>
                        <p className="font-body text-yellow-200 text-xs">admin / admin123 &nbsp;|&nbsp; operator / pass1234</p>
                    </div>
                )}

                <input
                    className="touch-target w-full bg-black/40 border border-retro-amber/40 rounded-lg px-4 py-3 text-retro-cream font-body text-base outline-none focus:border-retro-amber"
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    autoComplete="off"
                />

                <input
                    className="touch-target w-full bg-black/40 border border-retro-amber/40 rounded-lg px-4 py-3 text-retro-cream font-body text-base outline-none focus:border-retro-amber"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    autoComplete="current-password"
                />

                {error && (
                    <p className="text-red-400 font-body text-sm text-center">{error}</p>
                )}

                <button
                    className="touch-target w-full bg-retro-amber hover:bg-retro-amber/80 text-retro-brown font-body font-semibold text-lg rounded-lg py-3 transition-colors disabled:opacity-50"
                    onClick={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? 'Masuk...' : 'Masuk'}
                </button>
            </div>
        </motion.div>
    )
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
    return (
        <span className={`px-3 py-1 rounded-full font-body text-xs font-semibold ${ok ? 'bg-green-700 text-white' : 'bg-red-700 text-white'}`}>
            {label}: {ok ? '✓' : '✗'}
        </span>
    )
}
