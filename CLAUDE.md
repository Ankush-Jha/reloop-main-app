# CLAUDE.md - ReLoop Project Guide

> **For Claude Code Agent**: This file contains all context you need to understand and work on this project.

---

## 🎯 PROJECT OVERVIEW

**ReLoop** is a **gamified sustainable trading platform** for college campuses with **two applications**:
1. **Main App** (`reloop-nextjs`) - Student-facing mobile web app (port 3000)
2. **Worker App** (`reloop-worker-app`) - Staff collection app (port 3001)

Students can:
- **Scan items** with AI to get upcycle ideas & earn coins
- **Trade/swap items** in a campus marketplace
- **Track environmental impact** (CO2 saved, items recycled)
- **Compete on leaderboards** and complete missions

---

## 🏗️ ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                        FIREBASE (Shared Backend)                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐  │
│  │  Firestore  │ │    Auth     │ │   Storage   │ │    FCM    │  │
└─────────────────────────────────────────────────────────────────┘
              │                              │
              ▼                              ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│     MAIN APP (3000)      │    │    WORKER APP (3001)     │
│     reloop-nextjs/       │    │   reloop-worker-app/     │
│                          │    │                          │
│  • User auth + profiles  │    │  • Worker auth           │
│  • Marketplace           │    │  • QR bag scanning       │
│  • AI Scanner            │    │  • Weight estimation     │
│  • Smart Bags            │    │  • Batch collection      │
│  • Leaderboard/Missions  │    │  • Stats dashboard       │
│  • Rewards               │    │                          │
└──────────────────────────┘    └──────────────────────────┘
```

### Tech Stack
```
Frontend:      Next.js 14 (App Router), TypeScript, TailwindCSS
State:         React Context + Zustand
Backend:       Firebase (Firestore, Auth, Storage, FCM)
AI:            Google Gemini API (item scanning)
Styling:       Neo-brutalism design system
```

---

## 📁 PROJECT STRUCTURE

### Main App (`reloop-nextjs/`)
```
src/
├── app/                    # Pages
│   ├── login/, register/   # Auth
│   ├── marketplace/        # Trading
│   ├── scanner/            # AI scan
│   ├── smart-bags/         # Bag tracking
│   ├── leaderboard/, missions/, rewards/
│   ├── profile/, settings/
│   ├── messages/, notifications/
│   ├── sell/, my-listings/
│   └── forgot-password/    # TO IMPLEMENT
├── components/
│   ├── ui/                 # Reusable components
│   └── modals/
├── lib/
│   ├── firebase/
│   │   ├── client.ts       # Firebase init
│   │   ├── auth.ts         # AuthService
│   │   ├── db.ts           # DBService (all Firestore ops)
│   │   ├── storage.ts      # StorageService
│   │   └── messaging.ts    # TO IMPLEMENT - FCM
│   ├── contexts/AuthContext.tsx
│   └── demo-manager.ts     # Mock data fallback
└── types/
```

### Worker App (`reloop-worker-app/`)
```
src/
├── app/
│   ├── page.tsx            # QR Scanner
│   ├── login/              # Worker login
│   ├── estimate/           # Weight estimation
│   └── cart/               # Batch collection
├── lib/store.ts            # Zustand store
└── types/
```

---

## 🔧 BACKEND SERVICES

### Existing DBService Functions (`lib/firebase/db.ts`)

```typescript
// Users
createUserProfile(), getUserProfile(), updateUserProfile()
addCoinsToUser(), subscribeToUserProfile()

// Listings
createListing(), getListings(), getListingById()
getUserListings(), updateListingStatus()

// Smart Bags
createSmartBag(), getUserSmartBags(), updateSmartBagStatus()
getSmartBagByQR()

// Messages
getConversations(), getMessages(), sendMessage()
findOrCreateConversation()

// Trades
createTrade(), getUserTrades(), updateTradeStatus(), transferCoins()

// Notifications
getNotifications(), createNotification(), markNotificationRead()

// Rewards & Missions
getRewards(), redeemReward(), getLeaderboard()
getUserMissions(), updateMissionProgress(), claimMissionReward()

// Locations
getReloopPoints(), getRecycleZones()
dropItemAtPoint(), sendToRecycling()

// Expired
getExpiredListings(), handleEquityChoice()
```

### TO IMPLEMENT

```typescript
// FCM Token Management
updateUserFCMToken(uid, token)
removeUserFCMToken(uid)

// Worker Sessions
createWorkerSession(workerId, workerName, zone)
endWorkerSession(sessionId, stats)
processCollectionBatch(workerId, bags[])

// Analytics
getWorkerStats(workerId, dateRange)
getCampusStats()
```

---

## 🔨 PRIORITY 1: WHAT TO IMPLEMENT

### 1. PASSWORD RESET

**Files:**
- `src/lib/firebase/auth.ts` - Add `sendPasswordResetEmail(email)`
- `src/app/login/page.tsx` - Line 156: Replace alert with `router.push('/forgot-password')`
- `src/app/forgot-password/page.tsx` - NEW FILE

### 2. FIREBASE STORAGE FIX

**File:** `src/components/ui/CreateListingWizard.tsx`

**Problem:** Camera sets `imagePreviews` but NOT `formData.images`

**Fix in `capturePhoto`:**
```typescript
// AFTER: setImagePreviews([imageSrc]);
const blob = await fetch(imageSrc).then(r => r.blob());
const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
setFormData(prev => ({ ...prev, images: [file] }));
```

**Fix in `handleFileUpload`:**
```typescript
// AFTER: setImagePreviews(previews);
setFormData(prev => ({ ...prev, images: [...files] }));
```

### 3. PUSH NOTIFICATIONS (FCM)

**New files:**
- `src/lib/firebase/messaging.ts`
- `public/firebase-messaging-sw.js`

**Env:** Add `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

---

## 👷 WORKER APP IMPLEMENTATION

### Current State
- Uses Zustand store with `simulateScan()` mock
- Not connected to Firebase

### TO DO

1. **QR Scanner:** Replace mock with real scanner (html5-qrcode)
2. **Firebase:** Connect to shared Firebase config
3. **Collection:** Call `processCollectionBatch()` on complete
4. **Notifications:** Create notification for users on collection

---

## 📋 IMPLEMENTATION CHECKLIST

### Priority 1
- [ ] Password reset (auth.ts + forgot-password page)
- [ ] Storage fix (wire images in CreateListingWizard)
- [ ] Push notifications (messaging.ts + SW)

### Priority 2
- [ ] Worker app Firebase integration
- [ ] Real QR scanner
- [ ] processCollectionBatch in DBService

### Priority 3
- [ ] Campus map (`/map`)
- [ ] Admin dashboard (`/admin`)
- [ ] PWA support

---

## 🏃 RUNNING LOCALLY

```bash
# Main app
cd reloop-nextjs && npm run dev  # http://localhost:3000

# Worker app
cd reloop-worker-app && npm run dev  # http://localhost:3001
```

---

## 🎨 DESIGN SYSTEM

- **Primary:** `#22c358` (green)
- **Style:** Neo-brutalism (thick borders, bold shadows)
- **Classes:** `neo-border`, `shadow-brutal`, `shadow-brutal-sm`
- **Dark mode:** `dark:bg-dark-surface`, `dark:text-white`
- **NO PURPLE/VIOLET**

---

## ⚠️ IMPORTANT RULES

1. **Demo Mode:** Wrap features with `isDemo` check from AuthContext
2. **Mobile-first:** Design for 375px first
3. **authLoading:** Always check `authLoading` before fetching data
4. **Fallback:** Use DemoManager when Firebase returns empty

---

## 🔐 ENVIRONMENT

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=  # For FCM
GOOGLE_AI_API_KEY=                # For scanner
```

---

*Last Updated: 2026-02-07*
