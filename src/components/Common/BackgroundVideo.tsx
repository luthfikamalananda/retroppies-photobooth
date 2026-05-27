export function BackgroundVideo() {
  return (
    <video
      className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none"
      src="/assets/videos/vhs-background.mp4"
      autoPlay
      loop
      muted
      playsInline
    />
  )
}
