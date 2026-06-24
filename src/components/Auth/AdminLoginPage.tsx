import { logoRetroppies } from '@/assets'
import { login } from '@/services/authService'
import { checkHardware } from '@/services/hardwareService'
import { useAuthStore } from '@/store/authStore'
import { useSessionStore } from '@/store/sessionStore'
import { useUIStore } from '@/store/uiStore'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useKeyboardInput } from '../Common/FloatingKeyboard'

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

// Ganti jadi type alias sederhana:
export type PaperSize = 'A4' | 'A6'

type HardwareStatus = { cameraAvailable: boolean; printerAvailable: boolean }

// ---------------------------------------------------------------------------
// Shared hook — all login logic lives here once
// ---------------------------------------------------------------------------

function useAdminLogin(options?: {
    withoutSetAuth?: boolean
    /** Called right after a successful login, before any navigation */
    onSuccess?: () => void
    /** Whether to navigate to page 1 after login (default: true) */
    navigateOnSuccess?: boolean
    /** Initial paper type (only relevant for page variant) */
    initialPaperType?: 'A4' | 'A6'
}) {
    const { navigateOnSuccess = true, onSuccess, initialPaperType = 'A4', withoutSetAuth = false } = options ?? {}

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [hardwareStatus, setHardwareStatus] = useState<HardwareStatus | null>(null)
    const [selectedPaper, setSelectedPaper] = useState<'A4' | 'A6'>(initialPaperType)

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
                if (!withoutSetAuth) {
                    setUser({ ...res.result, paperType: selectedPaper })
                }
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
        paperType: selectedPaper, setPaperType: setSelectedPaper,
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
    kbUsername: ReturnType<typeof useKeyboardInput>
    password: string
    setPassword: (v: string) => void
    kbPassword: ReturnType<typeof useKeyboardInput>
    error: string | null
    isLoading: boolean
    handleLogin: () => void
    hardwareStatus: HardwareStatus | null
    /** Controls size; 'page' uses large inputs (py-6 text-xl), 'modal' uses compact ones (py-4) */
    variant?: 'page' | 'modal'
    /** Paper type selection — only rendered when variant === 'page' */
    paperType?: PaperSize
    setPaperType?: (v: PaperSize) => void
}

function LoginFormContent({
    username, setUsername,
    kbUsername,
    password, setPassword,
    kbPassword,
    error,
    isLoading,
    handleLogin,
    hardwareStatus,
    variant = 'page',
    paperType,
    setPaperType,
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

            <input
                {...kbUsername}
                className={inputCls}
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoComplete="off"
            />

            <input
                {...kbPassword}
                className={inputCls}
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoComplete="current-password"
            />

            {/* Paper type selector — only on login page, not modal */}
            {variant === 'page' && paperType !== undefined && setPaperType && (
                <div className="flex flex-col gap-3">
                    <p className="font-body text-retro-cream/70 text-sm text-center uppercase tracking-widest">Pilih Ukuran Kertas</p>
                    <div className="flex gap-4">
                        {(['A4', 'A6'] as const).map((size) => (
                            <button
                                key={size}
                                type="button"
                                onClick={() => setPaperType(size)}  // ← langsung string, tanpa wrap object
                                className={[
                                    'flex-1 py-5 rounded-xl border-2 font-gaming text-lg transition-all duration-150',
                                    paperType === size  // ← compare langsung, tanpa .paperType
                                        ? 'border-retro-amber bg-retro-amber text-retro-brown scale-[1.03] shadow-lg'
                                        : 'border-retro-amber/40 bg-black/30 text-retro-cream/70 hover:border-retro-amber/70',
                                ].join(' ')}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            )}

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
        paperType, setPaperType,
    } = useAdminLogin({ navigateOnSuccess: true })

    // Hook menerima getter dan setter
    const kbUsername = useKeyboardInput(setUsername)
    const kbPassword = useKeyboardInput(setPassword)


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
                kbUsername={kbUsername}
                password={password} setPassword={setPassword}
                kbPassword={kbPassword}
                error={error}
                isLoading={isLoading}
                handleLogin={handleLogin}
                hardwareStatus={hardwareStatus}
                variant="page"
                paperType={paperType}
                setPaperType={setPaperType}
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
        withoutSetAuth: true,
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

    // Hook menerima getter dan setter
    const kbUsername = useKeyboardInput(setUsername)
    const kbPassword = useKeyboardInput(setPassword)


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
                            kbUsername={kbUsername}
                            password={password} setPassword={setPassword}
                            kbPassword={kbPassword}
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
