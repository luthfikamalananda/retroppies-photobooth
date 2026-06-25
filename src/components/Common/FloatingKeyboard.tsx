import { useMotionValue, motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useKeyboardStore } from '@/store/keyboardStore'

// ─── Types ────────────────────────────────────────────────────────────────────

type KeyboardMode = 'normal' | 'shift' | 'symbol'
type KeyboardSize = 'besar' | 'medium'

// ─── Keyboard layouts ─────────────────────────────────────────────────────────

const LAYOUTS: Record<KeyboardMode, {
    numbers: string[]
    row1: string[]
    row2: string[]
    row3: string[]
}> = {
    normal: {
        numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        row1: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
        row2: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
        row3: ['z', 'x', 'c', 'v', 'b', 'n', 'm', '-', '_'],
    },
    shift: {
        numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        row1: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        row2: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        row3: ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '-', '_'],
    },
    symbol: {
        numbers: ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'],
        row1: ['~', '`', '|', '\\', '/', '<', '>', '?', '=', '+'],
        row2: ['[', ']', '{', '}', ':', ';', '"', "'", '€'],
        row3: [',', '.', '!', '?', '/', ';', ':', '"', "'"],
    },
}

// ─── Size config ──────────────────────────────────────────────────────────────

const SIZE_CFG = {
    besar: {
        width: 760,
        keyH: 56,
        keyMinW: 54,
        fontSize: 20,
        gap: 8,
        pad: 16,
        headerPad: '12px 16px',
        logoSize: 24,
    },
    medium: {
        width: 540,
        keyH: 42,
        keyMinW: 40,
        fontSize: 15,
        gap: 6,
        pad: 12,
        headerPad: '8px 12px',
        logoSize: 16,
    },
}

// ─── Key sub-component ────────────────────────────────────────────────────────

type KeyVariant = 'default' | 'danger' | 'active' | 'ok' | 'space'

interface KeyProps {
    label: string
    onPress: () => void
    cfg: (typeof SIZE_CFG)['besar']
    variant?: KeyVariant
    grow?: boolean
    wide?: boolean
}

function Key({ label, onPress, cfg, variant = 'default', grow, wide }: KeyProps) {
    const colors: Record<KeyVariant, { bg: string; hover: string; text: string; border: string }> = {
        default: { bg: '#3A1200', hover: '#4D1A00', text: '#D4A030', border: '#5C2800' },
        danger: { bg: '#8B1A1A', hover: '#A02020', text: '#FFFFFF', border: '#6B0A0A' },
        active: { bg: '#D4A030', hover: '#E5B840', text: '#1C0800', border: '#B08020' },
        ok: { bg: '#D4A030', hover: '#E5B840', text: '#1C0800', border: '#B08020' },
        space: { bg: '#3A1200', hover: '#4D1A00', text: '#D4A030', border: '#5C2800' },
    }
    const c = colors[variant]

    return (
        <motion.button
            className='font-gaming'
            whileTap={{ scale: 0.88, opacity: 0.8 }}
            onPointerDown={(e) => { e.preventDefault(); onPress() }}
            style={{
                height: cfg.keyH,
                minWidth: wide ? cfg.keyH * 1.4 : cfg.keyMinW,
                fontSize: cfg.fontSize,
                flex: grow ? 1 : undefined,
                background: c.bg,
                color: c.text,
                border: `1.5px solid ${c.border}`,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: `0 3px 0 ${c.border}`,
                userSelect: 'none',
                letterSpacing: label === 'SPACE' ? '0.15em' : undefined,
                paddingLeft: wide || grow ? cfg.pad : undefined,
                paddingRight: wide || grow ? cfg.pad : undefined,
                WebkitUserSelect: 'none',
                transition: 'background 0.07s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = c.hover }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = c.bg }}
        >
            {label}
        </motion.button>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function FloatingKeyboard() {
    const { isOpen, onKeyPress, close, position, setPosition } = useKeyboardStore()
    const [mode, setMode] = useState<KeyboardMode>('normal')
    const [size, setSize] = useState<KeyboardSize>('besar')

    const cfg = SIZE_CFG[size]
    const layout = LAYOUTS[mode]

    // Position: start centred near bottom of screen
    const x = useMotionValue(200)
    const y = useMotionValue(400)

    useEffect(() => {
        if (isOpen) {
            x.set((window.innerWidth - cfg.width) / 2)
            y.set(window.innerHeight - (size === 'besar' ? 440 : 360))
        }
    }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

    // Reset mode when closed
    useEffect(() => {
        if (!isOpen) setMode('normal')
    }, [isOpen])

    const handleKey = (char: string) => {
        onKeyPress?.(char)
        // Auto-revert shift after a single key press
        if (mode === 'shift') setMode('normal')
    }

    const toggleSize = () => {
        const next: KeyboardSize = size === 'besar' ? 'medium' : 'besar'
        setSize(next)
        // Re-centre after resize
        const nextCfg = SIZE_CFG[next]
        x.set((window.innerWidth - nextCfg.width) / 2)
    }

    const gap = cfg.gap

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    drag
                    dragMomentum={false}
                    style={{
                        x,
                        y,
                        position: 'fixed',
                        // top: -200,
                        // left: -500,
                        top: position.x,
                        left: position.y,
                        zIndex: 9999,
                        width: cfg.width,
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                    }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                >
                    {/* ── Container ── */}
                    <div style={{
                        background: '#1A0700',
                        border: '1.5px solid #5C2800',
                        borderRadius: 14,
                        overflow: 'hidden',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 2px 0 #5C2800',
                    }}>
                        {/* ── Header / drag handle ── */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: cfg.headerPad,
                                borderBottom: '1.5px solid #3A1200',
                                cursor: 'grab',
                                background: '#1C0800',
                            }}
                        >
                            {/* Drag dots */}
                            <span style={{ color: '#5C3500', fontSize: 11, letterSpacing: 3 }}>
                                ············
                            </span>

                            {/* Title */}
                            <span className='font-gaming ' style={{
                                color: '#D4A030',
                                fontSize: size === 'besar' ? cfg.logoSize : cfg.logoSize,
                                fontWeight: 700,
                                letterSpacing: '0.35em',
                                textTransform: 'uppercase',
                            }}>
                                RETROPPIES
                            </span>

                            {/* Controls */}
                            <div style={{ display: 'flex', gap: 6 }}>
                                {/* Size toggle */}
                                <button
                                    onPointerDown={(e) => { e.stopPropagation(); toggleSize() }}
                                    style={headerBtnStyle}
                                >
                                    Size: {size === 'besar' ? 'Big' : 'Medium'}
                                </button>

                                {/* Close */}
                                <button
                                    onPointerDown={(e) => { e.stopPropagation(); close() }}
                                    style={{ ...headerBtnStyle, background: '#8B1A1A', borderColor: '#6B0A0A', color: '#fff' }}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* ── Keys area ── */}
                        <div style={{ padding: cfg.pad, display: 'flex', flexDirection: 'column', gap }}>
                            {/* Row: Numbers + Backspace */}
                            <div style={{ display: 'flex', gap }}>
                                {layout.numbers.map((k) => (
                                    <Key key={k} label={k} cfg={cfg} onPress={() => handleKey(k)} />
                                ))}
                                <Key label="⌫" cfg={cfg} variant="danger" grow onPress={() => handleKey('BACKSPACE')} />
                            </div>

                            {/* Row 1: qwerty */}
                            <div style={{ display: 'flex', gap, justifyContent: 'center' }}>
                                {layout.row1.map((k) => (
                                    <Key key={k} label={k} cfg={cfg} onPress={() => handleKey(k)} />
                                ))}
                            </div>

                            {/* Row 2: asdf */}
                            <div style={{ display: 'flex', gap, justifyContent: 'center' }}>
                                {layout.row2.map((k) => (
                                    <Key key={k} label={k} cfg={cfg} onPress={() => handleKey(k)} />
                                ))}
                            </div>

                            {/* Row 3: shift + zxcv */}
                            <div style={{ display: 'flex', gap, justifyContent: 'center' }}>
                                <Key
                                    label="↑"
                                    cfg={cfg}
                                    variant={mode === 'shift' ? 'active' : 'default'}
                                    wide
                                    onPress={() => setMode(m => m === 'shift' ? 'normal' : 'shift')}
                                />
                                {layout.row3.map((k) => (
                                    <Key key={k} label={k} cfg={cfg} onPress={() => handleKey(k)} />
                                ))}
                            </div>

                            {/* Row 4: bottom action row */}
                            <div style={{ display: 'flex', gap }}>
                                <Key
                                    label="!#$"
                                    cfg={cfg}
                                    variant={mode === 'symbol' ? 'active' : 'default'}
                                    onPress={() => setMode(m => m === 'symbol' ? 'normal' : 'symbol')}
                                />
                                <Key label="@" cfg={cfg} onPress={() => handleKey('@')} />
                                <Key label="." cfg={cfg} onPress={() => handleKey('.')} />
                                <Key label="SPACE" cfg={cfg} grow variant="space" onPress={() => handleKey(' ')} />
                            </div>
                        </div>

                        {/* Bottom-right corner accent (matches design) */}
                        <div style={{
                            position: 'absolute',
                            bottom: 6,
                            right: 10,
                            color: '#5C2800',
                            fontSize: 11,
                            fontStyle: 'italic',
                        }}>
                            //
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

// ─── Shared header button style ───────────────────────────────────────────────

const headerBtnStyle: React.CSSProperties = {
    background: '#3A1200',
    border: '1px solid #5C2800',
    borderRadius: 6,
    color: '#D4A030',
    fontSize: 20,
    fontFamily: 'inherit',
    fontWeight: 700,
    padding: '4px 12px',
    cursor: 'pointer',
    letterSpacing: '0.05em',
}

// ─── Hook — easy integration with controlled inputs ───────────────────────────

/**
 * Returns an `onFocus` handler that opens the floating keyboard and wires it
 * to update a React-controlled input value.
 *
 * Usage:
 * ```tsx
 * const bindKb = useKeyboardInput(setValue)
 * <input {...bindKb} value={value} onChange={e => setValue(e.target.value)} />
 * ```
 */
export function useKeyboardInput(
    setValue: (updater: (prev: string) => string) => void,
    position?: { x: number; y: number },
) {
    const { open, setPosition } = useKeyboardStore()

    const onFocus = () => {
        setPosition(position ?? { x: 0, y: 0 })
        open((char) => {
            if (char === 'BACKSPACE') {
                setValue(prev => prev.slice(0, -1))
            } else {
                setValue(prev => prev + char)
            }
        })
    }

    return { onFocus }
}