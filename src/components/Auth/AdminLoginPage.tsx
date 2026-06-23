import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { logoRetroppies } from '@/assets'
import { useSessionStore } from '@/store/sessionStore'
import { useUIStore } from '@/store/uiStore'
import { login } from '@/services/authService'
import { checkHardware } from '@/services/hardwareService'
import { USE_MOCK } from '@/mocks/mockFlag'

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

type HardwareStatus = { cameraAvailable: boolean; printerAvailable: boolean }

// ---------------------------------------------------------------------------
// Shared hook — all login logic lives here once
// ---------------------------------------------------------------------------

function useAdminLogin(options?: {
    /** Called right after a successful login, before any navigation */
    onSuccess?: () => void
    /** Whether to navigate to page 1 after login (default: true) */
    navigateOnSuccess?: boolean
}) {
    const { navigateOnSuccess = true, onSuccess } = options ?? {}

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [hardwareStatus, setHardwareStatus] = useState<HardwareStatus | null>(null)

    const { setUser } = useAuthStore()
    const { goTo, resetSession } = useSessionStore()
    const { setLoading, loading } = useUIStore()
    const isLoading = loading['login'] ?? false

    const fetchHardware = async () => {
        const hw = await checkHardware()
        setHardwareStatus(hw)
    }

    const handleLogin = async () => {
        if (!username || !password) {
            setError('Username dan password wajib diisi.')
            return
        }
        setError(null)
        setLoading('login', true)
        try {
            const res = await login({ username, password })
            if (res.result && res.success) {
                setUser(res.result)
                const hw = await checkHardware()
                setHardwareStatus(hw)
                onSuccess?.()
                if (navigateOnSuccess) {
                    setTimeout(() => goTo(1), 800)
                }
            } else {
                setError('Login gagal. Periksa username dan password.')
            }
        } catch {
            setError('Login gagal. Periksa username dan password.')
        } finally {
            setLoading('login', false)
        }
    }

    const reset = () => {
        setUsername('')
        setPassword('')
        setError(null)
    }

    return {
        username, setUsername,
        password, setPassword,
        error,
        hardwareStatus,
        isLoading,
        fetchHardware,
        handleLogin,
        reset,
        resetSession,
    }
}

// ---------------------------------------------------------------------------
// Badge sub-component (shared)
// ---------------------------------------------------------------------------

function Badge({ ok, label }: { ok: boolean; label: string }) {
    return (
        <span className={`px-3 py-1 rounded-full font-body text-xs font-semibold ${ok ? 'bg-green-700 text-white' : 'bg-red-700 text-white'}`}>
            {label}: {ok ? '✓' : '✗'}
        </span>
    )
}

// ---------------------------------------------------------------------------
// LoginFormContent — shared visual form, rendered inside page or modal
// ---------------------------------------------------------------------------

interface LoginFormContentProps {
    username: string
    setUsername: (v: string) => void
    password: string
    setPassword: (v: string) => void
    error: string | null
    isLoading: boolean
    handleLogin: () => void
    hardwareStatus: HardwareStatus | null
    /** Controls size; 'page' uses large inputs (py-6 text-xl), 'modal' uses compact ones (py-4) */
    variant?: 'page' | 'modal'
}

function LoginFormContent({
    username, setUsername,
    password, setPassword,
    error,
    isLoading,
    handleLogin,
    hardwareStatus,
    variant = 'page',
}: LoginFormContentProps) {
    const inputCls = variant === 'page'
        ? 'touch-target w-full bg-black/40 border border-retro-amber/40 rounded-lg px-4 py-6 text-retro-cream font-body text-xl outline-none focus:border-retro-amber'
        : 'touch-target w-full bg-black/40 border border-retro-amber/40 rounded-lg px-4 py-4 text-retro-cream font-body text-xl outline-none focus:border-retro-amber'
    const btnCls = variant === 'page'
        ? 'touch-target w-full bg-retro-amber hover:bg-retro-amber/80 text-retro-brown font-gaming font-semibold text-xl rounded-lg py-6 transition-colors disabled:opacity-50'
        : 'touch-target w-full bg-retro-amber hover:bg-retro-amber/80 text-retro-brown font-gaming font-semibold text-xl rounded-lg py-4 transition-colors disabled:opacity-50'

    return (
        <div className="bg-black/60 backdrop-blur-md border border-retro-amber/40 rounded-2xl p-10 w-full max-w-3xl h-max flex flex-col gap-6 relative">
            {/* Hardware badges */}
            {hardwareStatus && (
                <div className="absolute top-4 right-4 flex gap-2">
                    <Badge ok={hardwareStatus.cameraAvailable} label="Camera" />
                    <Badge ok={hardwareStatus.printerAvailable} label="Printer" />
                </div>
            )}

            {/* Logo */}
            <div className="flex flex-col items-center gap-2">
                <img
                    src={logoRetroppies}
                    alt="Retroppies"
                    className={`${variant === 'page' ? 'w-[500px]' : 'w-[300px]'} h-max select-none pointer-events-none`}
                    draggable={false}
                />
            </div>

            {/* Mock mode credential hint */}
            {USE_MOCK && (
                <div className="bg-yellow-400/10 border border-yellow-400/40 rounded-lg px-4 py-2 text-center">
                    <p className="font-body text-yellow-300 text-xs font-semibold mb-0.5">🟡 MOCK MODE — Gunakan kredensial berikut:</p>
                    <p className="font-body text-yellow-200 text-xs">admin / admin123 &nbsp;|&nbsp; operator / pass1234</p>
                </div>
            )}

            <input
                className={inputCls}
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoComplete="off"
            />

            <input
                className={inputCls}
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
                className={btnCls}
                onClick={handleLogin}
                disabled={isLoading}
            >
                {isLoading ? 'Masuk...' : 'MASUK'}
            </button>
        </div>
    )
}

// ---------------------------------------------------------------------------
// AdminLoginPage — full-page, same behaviour as before
// ---------------------------------------------------------------------------

export function AdminLoginPage() {
    const {
        username, setUsername,
        password, setPassword,
        error,
        hardwareStatus,
        isLoading,
        fetchHardware,
        handleLogin,
        resetSession,
    } = useAdminLogin({ navigateOnSuccess: true })

    const isInitialized = useRef(false)
    useEffect(() => {
        if (isInitialized.current) return
        isInitialized.current = true
        resetSession()
    }, [])

    useEffect(() => {
        fetchHardware()
    }, [])

    return (
        <motion.div
            className="relative z-10 flex items-center justify-center w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <LoginFormContent
                username={username} setUsername={setUsername}
                password={password} setPassword={setPassword}
                error={error}
                isLoading={isLoading}
                handleLogin={handleLogin}
                hardwareStatus={hardwareStatus}
                variant="page"
            />
        </motion.div>
    )
}

// ---------------------------------------------------------------------------
// AdminLoginModal — modal overlay, same form, no automatic navigation
// ---------------------------------------------------------------------------

export interface AdminLoginModalProps {
    /** Whether the modal is visible */
    isOpen: boolean
    /** Callback to close the modal */
    onClose: () => void
    /** Optional: called right after a successful login */
    onSuccess?: () => void
}

export function AdminLoginModal({ isOpen, onClose, onSuccess }: AdminLoginModalProps) {
    const {
        username, setUsername,
        password, setPassword,
        error,
        hardwareStatus,
        isLoading,
        fetchHardware,
        handleLogin: baseHandleLogin,
        reset,
    } = useAdminLogin({
        navigateOnSuccess: false, // modal does NOT redirect automatically
        onSuccess: () => {
            onSuccess?.()
            onClose()
        },
    })

    // Load hardware on first open
    useEffect(() => {
        if (isOpen) {
            fetchHardware()
        } else {
            // Clean up form when modal closes
            reset()
        }
    }, [isOpen])

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="w-full max-w-xl"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={e => e.stopPropagation()}
                    >
                        <LoginFormContent
                            username={username} setUsername={setUsername}
                            password={password} setPassword={setPassword}
                            error={error}
                            isLoading={isLoading}
                            handleLogin={baseHandleLogin}
                            hardwareStatus={hardwareStatus}
                            variant="modal"
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
