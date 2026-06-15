import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePhotoStore } from '@/store/photoStore'

type PreviewType = 'photo' | 'video' | 'gif'

interface VideoPreviewModalProps {
    type: 'capture' | 'template'
}

export function VideoPreviewModal({ type }: VideoPreviewModalProps) {
    const { capturesVideo, templateWithVideo, templateWithPhoto, capturesToGIF, captures } = usePhotoStore()

    const [isOpen, setIsOpen] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
    const [activePreview, setActivePreview] = useState<PreviewType>('photo')

    const captureUrlsRef = useRef<Record<number, string>>({})
    const templateVideoUrlRef = useRef<string | null>(null)
    const gifUrlRef = useRef<string | null>(null)

    // Sync capture video URLs
    useEffect(() => {
        Object.values(captureUrlsRef.current).forEach(url => URL.revokeObjectURL(url))
        const urls: Record<number, string> = {}
        capturesVideo.forEach(video => {
            urls[video.slotIndex] = URL.createObjectURL(video.videoBlob)
        })
        captureUrlsRef.current = urls
        return () => {
            Object.values(captureUrlsRef.current).forEach(url => URL.revokeObjectURL(url))
        }
    }, [capturesVideo])

    // Sync template video URL
    useEffect(() => {
        if (templateVideoUrlRef.current) URL.revokeObjectURL(templateVideoUrlRef.current)
        if (templateWithVideo) templateVideoUrlRef.current = URL.createObjectURL(templateWithVideo)
        return () => {
            if (templateVideoUrlRef.current) URL.revokeObjectURL(templateVideoUrlRef.current)
        }
    }, [templateWithVideo])

    // Sync GIF URL
    useEffect(() => {
        if (gifUrlRef.current) URL.revokeObjectURL(gifUrlRef.current)
        if (capturesToGIF) gifUrlRef.current = URL.createObjectURL(capturesToGIF)
        return () => {
            if (gifUrlRef.current) URL.revokeObjectURL(gifUrlRef.current)
        }
    }, [capturesToGIF])

    const TAB_OPTIONS: { key: PreviewType; label: string; emoji: string; available: boolean }[] = [
        { key: 'photo', label: 'Template Photo', emoji: '🖼️', available: !!templateWithPhoto },
        { key: 'video', label: 'Template Video', emoji: '🎬', available: !!templateWithVideo },
        { key: 'gif', label: 'GIF', emoji: '✨', available: !!capturesToGIF },
    ]

    return (
        <>
            <motion.button
                className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold"
                onClick={() => setIsOpen(true)}
                whileTap={{ scale: 0.95 }}
            >
                {type === 'capture' ? `🎥 Captures (${capturesVideo.length})` : '🎨 Preview Results'}
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            className="bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90dvh] flex flex-col overflow-hidden"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                                <h2 className="text-white text-xl font-semibold">
                                    {type === 'capture' ? '[DEV] Capture Videos' : '[DEV] Preview Results'}
                                </h2>
                                <button className="text-gray-400 hover:text-white text-2xl" onClick={() => setIsOpen(false)}>✕</button>
                            </div>

                            {/* Tab selector — hanya untuk type template */}
                            {type === 'template' && (
                                <div className="flex gap-2 p-4 border-b border-gray-700 flex-shrink-0">
                                    {TAB_OPTIONS.map(tab => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setActivePreview(tab.key)}
                                            disabled={!tab.available}
                                            className={[
                                                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                                                activePreview === tab.key
                                                    ? 'bg-purple-600 text-white'
                                                    : tab.available
                                                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                        : 'bg-gray-800 text-gray-600 cursor-not-allowed opacity-50',
                                            ].join(' ')}
                                        >
                                            <span>{tab.emoji}</span>
                                            <span>{tab.label}</span>
                                            {!tab.available && <span className="text-xs">(belum ada)</span>}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">

                                {/* ── Capture type ── */}
                                {type === 'capture' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        {capturesVideo.length === 0 && (
                                            <p className="text-gray-400 col-span-2 text-center py-8">No capture videos yet</p>
                                        )}
                                        {capturesVideo.map(video => (
                                            <motion.div
                                                key={video.slotIndex}
                                                className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-500"
                                                onClick={() => setSelectedSlot(video.slotIndex)}
                                                whileHover={{ scale: 1.02 }}
                                            >
                                                <div className="aspect-video bg-black flex items-center justify-center">
                                                    <div className="text-center text-white">
                                                        <div className="text-3xl mb-1">🎬</div>
                                                        <div className="text-sm text-gray-400">Slot {video.slotIndex}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {(video.videoBlob.size / 1024 / 1024).toFixed(2)} MB
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                {/* ── Template: Photo ── */}
                                {type === 'template' && activePreview === 'photo' && (
                                    <>
                                        {!templateWithPhoto ? (
                                            <p className="text-center text-gray-400 py-8">Belum ada template photo. Tekan NEXT pada DragDrop page dulu.</p>
                                        ) : (
                                            <img
                                                src={templateWithPhoto}
                                                alt="Template with photo"
                                                className="w-full rounded-lg object-contain max-h-[65dvh]"
                                            />
                                        )}
                                    </>
                                )}

                                {/* ── Template: Video ── */}
                                {type === 'template' && activePreview === 'video' && (
                                    <>
                                        {!templateWithVideo || !templateVideoUrlRef.current ? (
                                            <p className="text-center text-gray-400 py-8">Belum ada template video.</p>
                                        ) : (
                                            <video
                                                key={templateVideoUrlRef.current}
                                                src={templateVideoUrlRef.current}
                                                controls
                                                autoPlay
                                                className="w-full rounded-lg max-h-[65dvh]"
                                            />
                                        )}
                                    </>
                                )}

                                {/* ── Template: GIF ── */}
                                {type === 'template' && activePreview === 'gif' && (
                                    <>
                                        {!capturesToGIF || !gifUrlRef.current ? (
                                            <p className="text-center text-gray-400 py-8">Belum ada GIF.</p>
                                        ) : (
                                            <img
                                                key={gifUrlRef.current}
                                                src={gifUrlRef.current}
                                                alt="GIF preview"
                                                className="w-full rounded-lg object-contain max-h-[65dvh]"
                                            />
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Capture video player modal */}
            {type === 'capture' && (
                <AnimatePresence>
                    {selectedSlot !== null && captureUrlsRef.current[selectedSlot] && (
                        <motion.div
                            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedSlot(null)}
                        >
                            <motion.div
                                className="bg-gray-900 rounded-xl overflow-hidden max-w-3xl w-full"
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.9 }}
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="bg-gray-800 px-4 py-3 flex justify-between items-center">
                                    <h3 className="text-white font-semibold">Capture — Slot {selectedSlot}</h3>
                                    <button className="text-gray-400 hover:text-white" onClick={() => setSelectedSlot(null)}>✕</button>
                                </div>
                                <video
                                    key={selectedSlot}
                                    src={captureUrlsRef.current[selectedSlot]}
                                    controls
                                    autoPlay
                                    className="w-full"
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </>
    )
}