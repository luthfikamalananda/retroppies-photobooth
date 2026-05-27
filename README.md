# Retroppies Photobooth 📸🎬

Vintage-themed photobooth application designed for touchscreen kiosks in cafes. Captures 4 photos, applies filters, arranges them on custom templates, and prints on A4 paper.

## 🎯 Project Overview

**Target Market:** Vintage Cafes (Indonesia)
**Timeline:** 2 weeks
**Budget:** $0 (All open-source tools)
**Developer:** luthfikamalananda
**Monitor Sizes:** 15", 21", 22", 24" (100% landscape, fullscreen)

## 📋 Features

- ✅ 15-page user flow with admin login
- ✅ 4-photo capture with retake functionality
- ✅ 3-4 customizable template designs
- ✅ Drag-drop photo arrangement
- ✅ 8+ filter options (Vivid, Sepia, Grayscale, etc.)
- ✅ QRIS payment integration
- ✅ Video recording of entire session
- ✅ QR code generation for downloads
- ✅ Email invoice delivery
- ✅ Thermal/inkjet printer support
- ✅ Kiosk mode (fullscreen, no UI chrome)
- ✅ VHS glitch effect with looping MP4 backgrounds
- ✅ Touchscreen optimized (48x48px+ targets)
- ✅ Hardware detection (camera, printer)

## 🏗️ Technology Stack

```json
{
  "framework": "React 18 + TypeScript",
  "build": "Vite 5",
  "desktop": "Electron 27+",
  "state": "Zustand 4",
  "styling": "Tailwind CSS 3 + custom CSS",
  "canvas": "Fabric.js 5 (drag-drop, canvas manipulation)",
  "animations": "Framer Motion 10 (smooth animations, gestures)",
  "camera": "react-webcam 7",
  "qrcode": "qrcode 1.5.3",
  "http": "Axios 1.6",
  "video": "MediaRecorder API (native)",
  "print": "Electron IPC + native printer API"
}
```

## 📁 Project Structure

```
retroppies-photobooth/
├── .copilot-context/           # VS Code Copilot context
│   └── SESSION_CONTEXT.md      # Full session documentation
├── docs/                       # Documentation
│   ├── PRD.md                  # Product Requirements Document
│   ├── ARCHITECTURE.md         # Technical architecture
│   ├── API_SPECS.md            # API endpoints
│   └── DEVELOPMENT_GUIDE.md    # Week-by-week roadmap
├── public/
│   ├── assets/
│   │   ├── videos/             # VHS glitch MP4 backgrounds
│   │   ├── logos/              # Retroppies branding
│   │   └── templates/          # Template design images
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Auth/               # Admin login
│   │   ├── Onboarding/         # Landing, How To Use
│   │   ├── Product/            # Product selection pages
│   │   ├── Payment/            # QRIS payment
│   │   ├── PhotoSession/       # Photo capture flow
│   │   └── Common/             # Shared components
│   ├── hooks/                  # Custom React hooks
│   ├── services/               # Business logic, API calls
│   ├── store/                  # Zustand stores
│   ├── utils/                  # Canvas, filters, helpers
│   ├── types/                  # TypeScript interfaces
│   ├── styles/                 # Global CSS
│   ├── App.tsx
│   └── main.tsx
├── electron/
│   ├── main.ts                 # Electron main process
│   ├── preload.ts              # IPC handlers
│   └── handlers/               # Printer, camera handlers
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── electron-builder.json
├── package.json
├── .env.example
└── DEVELOPMENT.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Webcam connected
- Printer connected (optional for testing)

### Installation

```bash
# Clone repository
git clone https://github.com/luthfikamalananda/retroppies-photobooth.git
cd retroppies-photobooth

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your API endpoints
```

### Development

```bash
# Start Vite dev server (web only)
npm run dev

# Start Electron with hot reload
npm run electron:dev

# Build for production
npm run build
npm run electron:build
```

## 📖 Documentation

- **[PRD.md](./docs/PRD.md)** - Complete 15-page user flow specification
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Technical decisions and architecture
- **[API_SPECS.md](./docs/API_SPECS.md)** - API integration endpoints
- **[DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md)** - Week-by-week development roadmap
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Setup and development instructions

## 🎬 15-Page User Flow

1. **Halaman 0:** Admin Login
2. **Halaman 1:** Landing Page (Press Start)
3. **Halaman 2:** How To Use (Skip instructions)
4. **Halaman 3:** Choose Product (Select bundle)
5. **Halaman 4:** Extra Print (Add extra prints)
6. **Halaman 5:** Add Ons (Select merchandise)
7. **Halaman 6:** Voucher (Apply discount code)
8. **Halaman 7:** Payment (Scan QRIS)
9. **Halaman 8:** Payment Success (Auto-transition)
10. **Halaman 9:** Start Photo (Show time limit)
11. **Halaman 10:** Take Photo (Capture 4 photos)
12. **Halaman 11:** Choose Template (Select frame design)
13. **Halaman 12:** Drag & Drop (Arrange photos)
14. **Halaman 13:** Choose Filter (Select filter)
15. **Halaman 14:** Finished Photo (Print & email)

→ **Auto-return to Halaman 1** (not login)

## 🛠️ Development Timeline

### Week 1
- **Day 1-2:** Project setup + folder structure
- **Day 3:** Halaman 0-2 (Auth + Onboarding)
- **Day 4:** Halaman 3-6 (Products + Voucher) + API integration
- **Day 5:** Halaman 7-9 (Payment flow) + Payment API

### Week 2
- **Day 1-2:** Halaman 10-12 (Photo capture + Drag-drop)
- **Day 3:** Halaman 13-14 (Filters + Final composition)
- **Day 4:** Print, Email, Video recording, QR codes
- **Day 5:** Testing, Bug fixes, Deployment prep

## 📝 Key Implementation Notes

### VHS Glitch Background
- All pages use looping MP4 video with VHS effect
- Provided by Figma (video asset)
- CSS: `video { position: fixed; z-index: -1; }`

### Session Timer
- Starts at Halaman 9
- Counts down through Halaman 10-14
- Uses Zustand store with Framer Motion for smooth animation
- Configured via API at login

### Filter Processing
- Client-side Canvas API + WebGL
- Real-time preview as user selects
- 8 filters: Original, Vivid, Sepia, Grayscale, Warm, Cold, Polaroid, Vignette

### Drag-Drop
- Fabric.js for cross-browser compatibility
- Touch gestures enabled
- Real-time preview as photos dragged

### Video Recording
- Starts at Halaman 8 (Payment Success)
- Records through Halaman 14
- Uses MediaRecorder API (native)
- Saved as MP4 to backend VPS with transaction ID

### Print Integration
- Electron IPC → Native printer API (Windows/Mac/Linux)
- A4 poster size
- Includes Retroppies branding + QR code
- Fallback to browser print API if Electron unavailable

## 🔗 API Integration

All endpoints return JSON and are consumed from existing backend:

```
POST   /auth/login                      # Admin authentication
GET    /products                        # Product list (filter by type)
POST   /vouchers/validate              # Voucher validation
POST   /transactions/create            # Create transaction + get QRIS
GET    /transactions/{id}/status       # Poll payment status
POST   /transactions/{id}/finalize     # Save photo + video
GET    /templates                      # Template list
POST   /email/send-invoice             # Send email with QR
```

See [API_SPECS.md](./docs/API_SPECS.md) for detailed specifications.

## 🎮 Touchscreen Optimization

- **Touch targets:** Minimum 48x48px
- **Fullscreen:** 100% landscape
- **No scroll:** Fixed layouts for each page
- **Large text:** 16px+ for readability
- **Haptic feedback:** Vibration API on interactions
- **Gesture support:** Swipe for horizontal scroll (Framer Motion)

## ⚙️ Hardware Requirements

### Required
- **Webcam/USB Camera:** 1080p+ recommended
- **Printer:** Thermal (58mm) or Inkjet (A4)
- **Touchscreen Monitor:** 15"-24", 1920x1080+

### Optional
- **QR Scanner:** For admin/testing
- **Receipt Printer:** For thermal printing

## 🔐 Security & Compliance

- ✅ Admin login required for setup
- ✅ HTTPS for API calls (production)
- ✅ JWT token in localStorage
- ✅ Photo permission modal (for marketing use)
- ✅ Auto-delete old photos (privacy)
- ✅ Video only accessible via transaction QR

## 📊 State Management

Using Zustand with the following stores:

- **sessionStore:** Session duration, timer, user permission
- **photoStore:** Captured photos, dimensions
- **layoutStore:** Selected template, photo-to-slot mapping, selected filter
- **cartStore:** Selected products, quantities, prices, discounts
- **authStore:** Login token, admin info
- **uiStore:** Loading states, modals, snackbars

## 🧪 Testing Strategy

- Unit tests for filters, canvas composition
- Integration tests for API calls
- E2E tests for complete user flow
- Hardware mocking for CI/CD

## 📱 Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+ (limited Electron features)
- Electron: Latest 2 versions

## 📄 License

Private project for Retroppies Cafe Project

## 🔄 Context/Documentation Task Status

Status update (2026-05-27):

- ✅ Context & documentation task sudah **merged ke `main`**:
  - PR: https://github.com/luthfikamalananda/retroppies-photobooth/pull/1
  - Pipeline: https://github.com/luthfikamalananda/retroppies-photobooth/actions/runs/26505368379
- ⏳ Jika task terkait masih berstatus **Draft/WIP** pada PR lain, anggap file belum siap full untuk di-pull dan tunggu notifikasi merge.
- ℹ️ Copilot **tidak bisa menjalankan `git pull` di local machine user**. Pull harus dilakukan manual oleh user via Git CLI atau VS Code.

Setelah status merged, update lokal dengan:

```bash
git pull origin main
```

## 📞 Contact

**Developer:** luthfikamalananda
**Project:** Retroppies Photobooth Kiosk Application

---

**Status:** 🚀 In Development (Week 1-2)
**Last Updated:** 2025-05-27
