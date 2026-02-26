# ReLoop - Complete AI Context for Cursor

## 🎯 Project Overview

**ReLoop** is a **gamified sustainable trading platform** for college campuses with **two applications**:
1. **Main App** (`reloop-nextjs`) - Student-facing mobile web app (port 3000)
2. **Worker App** (`reloop-worker-app`) - Staff/worker collection app (port 3001)

### Problem We're Solving
1. Campus waste from students discarding usable items
2. No incentive/gamification for recycling
3. No way to track personal environmental impact
4. Disconnected sustainability community

### Solution
- Gamified recycling with XP, coins, levels, leaderboards
- Peer-to-peer trading marketplace
- AI-powered item scanner for upcycling ideas
- Smart bag collection system with QR tracking

---

## 🏗️ Architecture

### Two Applications

```
┌─────────────────────────────────────────────────────────────────┐
│                        FIREBASE (Shared Backend)                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐  │
│  │  Firestore  │ │    Auth     │ │   Storage   │ │    FCM    │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘  │
└─────────────────────────────────────────────────────────────────┘
              │                              │
              ▼                              ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│     MAIN APP (3000)      │    │    WORKER APP (3001)     │
│     reloop-nextjs/       │    │   reloop-worker-app/     │
│                          │    │                          │
│  • User auth + profiles  │    │  • Worker auth           │
│  • Marketplace           │    │  • QR bag scanning       │
│  • AI Scanner            │    │  • Bag estimation        │
│  • Smart Bags            │    │  • Cart collection       │
│  • Leaderboard           │    │  • Batch processing      │
│  • Missions              │    │  • Stats dashboard       │
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

## 🔌 MCP SETUP (Cursor)

### Current Status
- **Stitch MCP:** No ReLoop project exists yet
- **Firebase MCP:** Project directory not set (no firebase.json)
- **firestore.rules:** ✅ Exists (218 lines with comprehensive security rules)

### STEP 1: Initialize Firebase CLI
```bash
cd /Users/rudraksh/unscraped/reloop-nextjs
firebase init
# Select: Firestore, Storage, Hosting
# Use existing project or create new
```

This creates:
- `firebase.json` - Project config
- `.firebaserc` - Project alias

### STEP 2: Configure Firebase MCP
```typescript
// In Cursor, call:
firebase_update_environment({
  project_dir: "/Users/rudraksh/unscraped/reloop-nextjs"
})

// Then read setup guides:
firebase_read_resources(["init-backend", "firestore", "firestore-rules", "auth"])
```

### STEP 3: Create Stitch Project
```typescript
// In Cursor, call:
stitch_create_project({
  name: "ReLoop",
  description: "Gamified sustainable trading platform for campuses"
})

// Generate key screens:
generate_screen_from_text({
  prompt: "Mobile-first neo-brutalism login page with thick black borders, bold shadows, green #22c358 primary, email/password inputs, Google sign-in button, demo mode option"
})
```

### Key Screens to Design in Stitch
1. **Login/Register** - Auth flow
2. **Marketplace card** - Listing preview component
3. **Scanner results** - AI analysis display
4. **Smart bag card** - Bag status component
5. **Profile** - User stats display
6. **Bottom nav** - Navigation component

### Using MCP in Development

**For new screens:**
```typescript
// Generate layout reference
generate_screen_from_text({ prompt: "..." })
// Use as structure guide, apply project styles
```

**For security rules updates:**
```typescript
// Review current rules
firebase_get_security_rules()
// When adding new DBService functions, update rules accordingly
```

**For new collections (e.g., workerSessions):**
```
// Add to firestore.rules:
match /workerSessions/{sessionId} {
  allow read: if isAuth();
  allow create: if isAuth();
  allow update: if isAuth() && resource.data.workerId == request.auth.uid;
}
```

---

## � Project Structure

### Main App (`reloop-nextjs/`)
```
src/
├── app/                    # Pages
│   ├── (auth)/login, register
│   ├── marketplace/, marketplace/[id]/
│   ├── scanner/
│   ├── smart-bags/
│   ├── leaderboard/, missions/, rewards/
│   ├── profile/, settings/
│   ├── messages/, notifications/
│   ├── sell/, my-listings/
│   ├── reloop-points/, recycle/
│   └── forgot-password/    # TO IMPLEMENT
├── components/
│   ├── ui/                 # Reusable (PageHeader, BottomNav, etc.)
│   ├── modals/
│   └── marketplace/
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
│   ├── page.tsx            # QR Scanner home
│   ├── login/page.tsx      # Worker login
│   ├── estimate/page.tsx   # Bag weight/items estimate
│   └── cart/page.tsx       # Batch collection cart
├── lib/
│   └── store.ts            # Zustand store for worker state
└── types/
    └── index.ts            # Worker types
```

---

## 📊 Database Schema (Firestore)

### Core Collections
```javascript
// USERS
users/{uid}
  - name, email, avatar
  - xp, level, coins, co2Saved, itemsTraded
  - badges[], levelTitle
  - fcmToken                 // TO ADD for push notifications
  - createdAt, lastLogin

// MARKETPLACE
listings/{id}
  - title, description, images[]
  - price, category, condition
  - sellerId, sellerName
  - status: 'available' | 'pending' | 'sold' | 'at_point'
  - pointId, droppedAt, expiresAt
  - createdAt

// SMART BAGS
smartBags/{id}
  - qrCode, userId, ownerName
  - status: 'active' | 'filled' | 'pickup_requested' | 'collected' | 'processed'
  - items[], fillLevel, weight
  - estimatedCoins            // Set by worker
  - collectedBy, collectedAt  // Worker info
  - createdAt, filledAt

// MESSAGING
conversations/{id}
  - participants[], lastMessage
  - listingId, listingTitle
  - createdAt, updatedAt

messages/{id}
  - conversationId, senderId, text
  - createdAt

// TRADES
trades/{id}
  - listingId, buyerId, sellerId
  - status: 'pending' | 'accepted' | 'declined' | 'completed'
  - offerCoins, createdAt

// NOTIFICATIONS
notifications/{id}
  - userId, type, title, message
  - icon, actionUrl, read
  - createdAt

// GAMIFICATION
rewards/{id}
  - title, description, icon
  - coinCost, category, partner
  - stock, active

missionTemplates/{id}
  - title, description, icon
  - xpReward, coinReward
  - target, type: 'daily' | 'weekly' | 'special'
  - active

userMissions/{id}  // id = `${userId}_${missionId}`
  - progress, completed, claimed
  - createdAt, completedAt

// LOCATIONS
reloopPoints/{id}
  - name, address, lat, lng
  - type, active

recycleZones/{id}
  - name, address, types[]
  - active

// WORKER COLLECTIONS (TO IMPLEMENT)
workerSessions/{id}
  - workerId, workerName
  - zone, startedAt, endedAt
  - bagsCollected, totalWeight, coinsAwarded

collectionBatches/{id}
  - workerId, bagIds[]
  - totalWeight, totalCoins
  - processedAt
```

---

## � Backend Implementation Guide

### EXISTING DBService Functions (`lib/firebase/db.ts`)

```typescript
// User Management
createUserProfile(data)
getUserProfile(uid)
updateUserProfile(uid, data)
addCoinsToUser(uid, amount, reason)
subscribeToUserProfile(uid, callback)

// Listings
createListing(data)
getListings(filters)
getListingById(id)
getUserListings(uid)
updateListingStatus(id, status)
deleteListing(id)

// Smart Bags
createSmartBag(data)
getUserSmartBags(uid)
updateSmartBagStatus(id, status)
getSmartBagByQR(qrCode)
subscribeToUserSmartBags(uid, callback)

// Messages
getConversations(uid)
getMessages(conversationId)
sendMessage(conversationId, senderId, text)
findOrCreateConversation(uid1, uid2, listingId)

// Trades
createTrade(data)
getUserTrades(uid)
updateTradeStatus(id, status)
transferCoins(fromUid, toUid, amount)

// Notifications
getNotifications(uid)
createNotification(data)
markNotificationRead(id)
markAllNotificationsRead(uid)

// Rewards & Missions
getRewards()
redeemReward(uid, rewardId)
getLeaderboard(limit)
getUserMissions(uid)
updateMissionProgress(uid, missionId, progress)
claimMissionReward(uid, missionId)

// Locations
getReloopPoints()
getRecycleZones()
dropItemAtPoint(uid, listingId, pointId)
sendToRecycling(uid, itemTitle, zoneId)

// Expired Listings
getExpiredListings(uid)
handleEquityChoice(uid, listingId, choice)
```

### TO IMPLEMENT - Backend Functions

#### 1. FCM Token Management
```typescript
// Add to db.ts
async updateUserFCMToken(uid: string, token: string): Promise<void> {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { 
        fcmToken: token,
        fcmUpdatedAt: serverTimestamp()
    });
}

async removeUserFCMToken(uid: string): Promise<void> {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { fcmToken: deleteField() });
}
```

#### 2. Worker Session Management
```typescript
// Add to db.ts OR create worker-db.ts
async createWorkerSession(workerId: string, workerName: string, zone: string) {
    return addDoc(collection(db, "workerSessions"), {
        workerId,
        workerName,
        zone,
        startedAt: serverTimestamp(),
        bagsCollected: 0,
        totalWeight: 0,
        coinsAwarded: 0
    });
}

async endWorkerSession(sessionId: string, stats: object) {
    await updateDoc(doc(db, "workerSessions", sessionId), {
        ...stats,
        endedAt: serverTimestamp()
    });
}

async processCollectionBatch(workerId: string, bags: BagData[]) {
    const batch = writeBatch(db);
    let totalCoins = 0;
    
    for (const bag of bags) {
        // Update bag status
        const bagRef = doc(db, "smartBags", bag.id);
        batch.update(bagRef, {
            status: 'collected',
            collectedBy: workerId,
            collectedAt: serverTimestamp(),
            estimatedCoins: bag.coins,
            weight: bag.weight
        });
        
        // Award coins to user
        const userRef = doc(db, "users", bag.userId);
        batch.update(userRef, {
            coins: increment(bag.coins),
            co2Saved: increment(bag.weight * 2.5) // 2.5 kg CO2 per kg recycled
        });
        
        totalCoins += bag.coins;
    }
    
    // Log batch
    const batchRef = doc(collection(db, "collectionBatches"));
    batch.set(batchRef, {
        workerId,
        bagIds: bags.map(b => b.id),
        totalWeight: bags.reduce((sum, b) => sum + b.weight, 0),
        totalCoins,
        processedAt: serverTimestamp()
    });
    
    await batch.commit();
    return { totalCoins };
}
```

#### 3. Analytics/Stats Functions
```typescript
async getWorkerStats(workerId: string, dateRange: 'today' | 'week' | 'month') {
    const startDate = getStartOfRange(dateRange);
    const q = query(
        collection(db, "collectionBatches"),
        where("workerId", "==", workerId),
        where("processedAt", ">=", startDate)
    );
    const snapshot = await getDocs(q);
    // Aggregate stats...
}

async getCampusStats() {
    // Total CO2 saved, items traded, bags collected
    // Used for admin dashboard
}
```

---

## � Priority 1: What to Implement

### 1. PASSWORD RESET FLOW

**Files:**
- `src/lib/firebase/auth.ts` - Add function
- `src/app/login/page.tsx` - Update button (line 156)
- `src/app/forgot-password/page.tsx` - NEW

**auth.ts changes:**
```typescript
import { sendPasswordResetEmail } from "firebase/auth";

// Add to AuthService:
async sendPasswordResetEmail(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
}
```

**login/page.tsx (line 156):**
```typescript
// REPLACE: onClick={() => alert('Password reset coming soon!')}
// WITH: onClick={() => router.push('/forgot-password')}
```

---

### 2. FIREBASE STORAGE FIX

**Problem:** `CreateListingWizard.tsx` sets `imagePreviews` but not `formData.images`, so listings have empty images.

**File:** `src/components/ui/CreateListingWizard.tsx`

**In `capturePhoto` function:**
```typescript
// AFTER: setImagePreviews([imageSrc]);
// ADD:
const blob = await fetch(imageSrc).then(r => r.blob());
const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
setFormData(prev => ({ ...prev, images: [file] }));
```

**In `handleFileUpload` function:**
```typescript
// AFTER: setImagePreviews(previews);
// ADD:
setFormData(prev => ({ ...prev, images: [...files] }));
```

---

### 3. PUSH NOTIFICATIONS (FCM)

**New files:**
- `src/lib/firebase/messaging.ts`
- `public/firebase-messaging-sw.js`

**messaging.ts:**
```typescript
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './client';

export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export async function requestNotificationPermission(): Promise<string | null> {
    if (!messaging) return null;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;
    return await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    });
}

export function onForegroundMessage(callback: (payload: any) => void) {
    if (!messaging) return;
    onMessage(messaging, callback);
}
```

**firebase-messaging-sw.js:**
```javascript
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({ /* config */ });
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    self.registration.showNotification(payload.notification.title, {
        body: payload.notification.body
    });
});
```

**Env:** Add `NEXT_PUBLIC_FIREBASE_VAPID_KEY` (generate in Firebase Console)

---

## 👷 Worker App Implementation

### Current State
The worker app at `reloop-worker-app/` has basic structure but needs Firebase integration.

### Pages to Implement

#### `/login` - Worker Authentication
```typescript
// Use separate worker auth or same Firebase with role check
// Store worker session in Zustand + persist to Firestore
```

#### `/` (home) - QR Scanner
```typescript
// Current: simulateScan() generates mock data
// TO DO: 
//   1. Integrate real camera/QR scanner (html5-qrcode library)
//   2. On scan, call DBService.getSmartBagByQR(qrCode)
//   3. Verify bag exists and status is 'filled' or 'pickup_requested'
//   4. Navigate to /estimate with bag data
```

#### `/estimate` - Weight & Coins Estimation
```typescript
// Current: Uses local store only
// TO DO:
//   1. Let worker input weight (kg)
//   2. Auto-calculate coins (e.g., weight * 10)
//   3. Show bag owner info
//   4. "Add to Cart" saves to cart state
```

#### `/cart` - Batch Collection
```typescript
// Current: Shows cart items, has "Complete Collection" button
// TO DO:
//   1. On "Complete Collection":
//      - Call DBService.processCollectionBatch(workerId, bags)
//      - Update all bags to 'collected'
//      - Award coins to each bag owner
//      - Create notification for each user
//   2. Show success summary
//   3. Clear cart
```

### Worker Store (`lib/store.ts`)
```typescript
interface WorkerStore {
    session: WorkerSession | null;
    cart: ScannedBag[];
    lastScanned: ScannedBag | null;
    
    // Actions
    login(name: string, zone: string): void;
    logout(): void;
    simulateScan(): void;  // Replace with real scan
    addToCart(bag: ScannedBag): void;
    removeFromCart(id: string): void;
    completeCollection(): Promise<void>;  // Call Firebase
    getTodayStats(): Stats;
}
```

### Firebase Integration for Worker

Create `reloop-worker-app/src/lib/firebase/`:
```
firebase/
├── client.ts       # Same Firebase config as main app
└── worker-db.ts    # Worker-specific operations
```

Or import from main app via shared package.

---

## 📋 Implementation Checklist

### Priority 1 (Core)
- [ ] Password reset flow (auth.ts + forgot-password page + login update)
- [ ] Firebase Storage fix (wire images in CreateListingWizard)
- [ ] Push notifications (messaging.ts + service worker + token save)

### Priority 2 (Worker App)
- [ ] Connect worker app to Firebase (shared config)
- [ ] Real QR scanner (replace simulateScan)
- [ ] processCollectionBatch in DBService
- [ ] Worker session persistence to Firestore
- [ ] Notifications to users on bag collection

### Priority 3 (Features)
- [ ] Campus map page (`/map`)
- [ ] Admin dashboard (`/admin`)
- [ ] Real-time chat (upgrade from polling)
- [ ] Email verification
- [ ] PWA support

### Priority 4 (Backend/Cloud Functions)
- [ ] Scheduled job: Mark bags as expired after 30 days
- [ ] Scheduled job: Daily leaderboard snapshot
- [ ] Trigger: Send FCM on new message
- [ ] Trigger: Send FCM on trade update
- [ ] Trigger: Auto-award mission completion

---

## 🧪 Testing

```bash
# Main app
cd reloop-nextjs && npm run dev  # http://localhost:3000

# Worker app
cd reloop-worker-app && npm run dev  # http://localhost:3001
```

### Test Flows
1. **Password Reset:** Login → Forgot Password → Enter email → Check inbox
2. **Storage:** Sell → Camera capture → Check listing has image URLs
3. **Push:** Grant permission → Check token in Firestore → Send test from Console
4. **Worker:** Login → Scan bag → Add to cart → Complete collection → Check user coins

---

## � Environment Variables

### Main App (`reloop-nextjs/.env.local`)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=      # For FCM
GOOGLE_AI_API_KEY=                    # For scanner
```

### Worker App (`reloop-worker-app/.env.local`)
```env
# Same Firebase config
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

*Last Updated: 2026-02-07*
