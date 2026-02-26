# ReLoop - AI Project Context

> **For Future AI Assistants:** Read this file first to understand the project state, goals, and recent history.

---

## 1. Project Overview
**Name:** ReLoop
**Purpose:** A circular economy marketplace for university students to buy, sell, trade, and recycle items.
**Core Value:** Gamified sustainability—students earn "Eco Coins" for sustainable actions (selling, recycling, donating), which can be redeemed for rewards.

### Key Features
- **Marketplace:** Buy/sell/trade items (books, electronics, clothes).
- **Equity Protocol:** Unsold items after 14 days offer "Recycle" or "Donate" options to ensure inventory movement.
- **Smart Bags:** QR-coded bags for recycling waste; users scan bag, fill it, drop it off, and earn coins.
- **Gamification:** Leaderboards, badges (streaks, CO2 saved), and tiers (Silver/Gold).
- **Rewards:** Redeem Eco Coins for vouchers or discounts.

---

## 2. Technology Stack
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS (custom "Neo-Brutalism" design system)
- **Language:** TypeScript
- **State/Data:** 
  - Currently using `DemoManager.ts` (local mock data) for MVP demo.
  - Firebase (partially integrated/planned for backend).
- **Auth:** `AuthContext` (mock auth for demo).

### Design System ("Neo-Brutalism")
- **Colors:** High contrast—Black (`#1a1a1a`), White, vibrant accents (Yellow `#FFE500`, Blue `#4455FF`, Green `#00CC66`).
- **UI Elements:** Thick borders (`border-2/border-4`), heavy shadows (`shadow-brutal`), rounded corners (`rounded-xl/2xl`).
- **Typography:** Bold headers, uppercase labels, clean sans-serif body.

---

## 3. Current State (As of Feb 7, 2026)
**Status:** ✅ **MVP Production Ready**

We just completed a major **"UX Polish & Accessibility Sprint"** to transform the hackathon prototype into a polished product.

### Recently Completed (High Confidence)
1. **Currency Unification:** All references standardized to "**Eco Coins**" (🪙).
2. **14-Day Expiry System:** Implemented educational modal and warning banner for listings.
3. **Smart Bag Statuses:** Renamed for clarity (e.g., "Ready for Drop-off" instead of "Waiting").
4. **Accessibility:** Added `aria-label` to all icon buttons (14+ fixes).
5. **Data Credibility:** Fixed leaderboard CO2 values (50kg instead of unrealistic 50k kg).
6. **Product Images:** Switched from circular crops to aspect-ratio rectangles for better visibility.
7. **Scanner Flow:** Added auto-camera permission request (with session memory).
8. **Loading States:** Created `ProductCardSkeleton` and `ListItemSkeleton`.
9. **Dead Button Hunt:** Fixed 4 non-functional buttons (Flashlight toast, Notification alert, Filter preview, Share functionality).

### Ad-Hoc Fixes
- **Rewards Page:** Implemented native `navigator.share` for community story sharing.
- **Flashlight:** Added informative toast since web flashlight API is limited.

---

## 4. File Structure & Key Components

### Core Directories
- `src/app`: App Router pages.
  - `/marketplace`: Main feed, create listing, trade flow.
  - `/scanner`: Camera interface for items/bags.
  - `/smart-bags`: Bag management.
  - `/rewards`: Coin redemption.
  - `/profile`: User stats and badges.
- `src/components`:
  - `/ui`: Reusable atoms (Buttons, Modals, BottomNav).
  - `/marketplace`: Listing cards, grids.
  - `/skeletons`: Loading state placeholders (New).
- `src/lib`:
  - `demo-manager.ts`: **CRITICAL**. Central source of truth for all mock data. Handles CRUD operations in memory.

### Key Components
- **`manifest.ts`**: PWA configuration (partially set up).
- **`BottomNav`**: Main navigation bar.
- **`EquityProtocolModal`**: Explains the 14-day rule.

---

## 5. Roadmap & Deferred Tasks

These tasks were deferred from the MVP sprint and are next in the queue.

### P2 - Medium Priority (Post-Launch)
- [ ] **Artist Portfolios:** Expand the "Makeover" artist profile view with galleries.
- [ ] **Empty States:** Add dedicated components for empty lists (listings, bags) when `DemoManager` returns 0 items.
- [ ] **Loading Integration:** Connect the new Skeleton components to actual `isLoading` states in pages.

### P3 - Backlog (Nice to Have)
- [ ] **Campus Map:** Interactive map for "Reloop Points" (drop-off locations).
- [ ] **Flash Sales:** Discount mechanic for items nearing expiry.
- [ ] **Global Search:** Search bar in navbar (currently just UI).
- [ ] **Color Contrast:** Full WCAG AA audit.

---

## 6. How to Work on ReLoop
1. **Data:** If adding features, update `DemoManager.ts` first. Avoid hardcoding data directly in components.
2. **Styling:** Use existing Tailwind utility classes (e.g., `bm-border`, `shadow-brutal`). Do not introduce new CSS files.
3. **Icons:** Use Google Material Symbols (via `<span>` classes).
4. **Images:** Always use `object-cover` or `object-contain` classes.

---

*Verified by Antigravity Agent - Feb 7, 2026*
