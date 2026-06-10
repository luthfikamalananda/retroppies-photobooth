import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePhotoStore } from '@/store/photoStore'

/**
 * DEVELOPMENT ONLY - Temporary component to preview captured videos
 * Remove this component before production build
 */
export function VideoPreviewModal() {
    const { capturesVideo } = usePhotoStore()
    const [isOpen, setIsOpen] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null)

    // Create object URLs for video blobs
    const videoUrls = capturesVideo.reduce(
        (acc, video) => {
            acc[video.slotIndex] = URL.createObjectURL(video.videoBlob)
            return acc
        },
        {} as Record<number, string>
    )

    return (
        <>
            {/* Dev Toggle Button */}
            <motion.button
                className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 touch-target"
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="[DEV] Toggle Video Preview"
            >
                🎥 Videos ({capturesVideo.length})
            </motion.button>

            {/* Modal Backdrop & Content */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                                <h2 className="text-xl font-semibold text-white">[DEV] Video Preview</h2>
                                <button
                                    className="text-gray-400 hover:text-white text-2xl"
                                    onClick={() => setIsOpen(false)}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {capturesVideo.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400">
                                        No videos captured yet
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-6">
                                        {capturesVideo.map((video) => (
                                            <motion.div
                                                key={video.slotIndex}
                                                className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all"
                                                onClick={() =>
                                                    setSelectedSlot(
                                                        selectedSlot === video.slotIndex ? null : video.slotIndex
                                                    )
                                                }
                                                whileHover={{ scale: 1.02 }}
                                            >
                                                <div className="aspect-video bg-black flex items-center justify-center">
                                                    <div className="text-center">
                                                        <div className="text-3xl mb-2">🎬</div>
                                                        <div className="text-sm text-gray-400">Slot {video.slotIndex}</div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {(video.videoBlob.size / 1024 / 1024).toFixed(2)} MB
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Video Player Modal */}
                            <AnimatePresence>
                                {selectedSlot !== null && (
                                    <motion.div
                                        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setSelectedSlot(null)}
                                    >
                                        <motion.div
                                            className="bg-gray-900 rounded-xl overflow-hidden max-w-2xl w-full"
                                            initial={{ scale: 0.9 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0.9 }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="bg-gray-800 px-6 py-3 flex justify-between items-center">
                                                <h3 className="text-lg font-semibold text-white">
                                                    Video - Slot {selectedSlot}
                                                </h3>
                                                <button
                                                    className="text-gray-400 hover:text-white"
                                                    onClick={() => setSelectedSlot(null)}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            <div className="aspect-video bg-black">
                                                <video
                                                    src={videoUrls[selectedSlot]}
                                                    controls
                                                    autoPlay
                                                    className="w-full h-full"
                                                />
                                            </div>
                                            <div className="px-6 py-3 bg-gray-800 text-sm text-gray-400">
                                                <p>Size: {((capturesVideo.find(v => v.slotIndex === selectedSlot)?.videoBlob.size || 0) / 1024 / 1024).toFixed(2)} MB</p>
                                                <p>Recorded at: {new Date(capturesVideo.find(v => v.slotIndex === selectedSlot)?.recordedAt || 0).toLocaleTimeString()}</p>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
