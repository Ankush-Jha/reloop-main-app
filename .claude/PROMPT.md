# ReLoop - Next Steps Prompt

> Copy-paste this prompt to Claude to continue development.

---

## 🎯 CONTEXT

ReLoop is a campus sustainability trading app. Recent work completed:
- ✅ Personalized AI recommendations with user context
- ✅ Marketplace item details with "Impact Facts"
- ✅ Firestore security rules for coin economy
- ✅ Scanning flow mockups (camera → scanning → results)
- ✅ Navigation links verified and fixed
- ✅ Demo/Real mode toggle architecture

---

## 📋 NEXT PRIORITIES

### Priority 1: Gamification Polish
Enhance the gamification features to make them more engaging:

1. **Level Up Celebration** (`pages/gamification/level-up.html`)
   - Create animated celebration screen when user levels up
   - Show confetti animation, new level badge, unlocked perks
   - Add "Share to Social" button

2. **Badge Reveal Animation** (`pages/gamification/badge-reveal.html`)  
   - Create unlock animation for new badges
   - Show badge with glow effect and description
   - Link to badge collection

3. **Daily Streak Tracker**
   - Add streak counter to home page
   - Show flame 🔥 icon with streak count
   - Bonus coins for 7-day and 30-day streaks

---

### Priority 2: Enhanced Marketplace

1. **Trade Chat** (Conceptual/Mock)
   - Add "Message Seller" button on item pages
   - Create mock chat UI (`pages/marketplace/chat.html`)
   - Show sample conversation

2. **Item Condition Tags**
   - Add visual badges: "Like New", "Good", "Fair"
   - Color-coded indicators

3. **Saved Items / Wishlist**
   - Add heart icon to save items
   - Create wishlist page (`pages/user/wishlist.html`)

---

### Priority 3: Social Features

1. **Share Your Impact**
   - Create shareable impact cards (CO2 saved, items traded)
   - Format for Instagram Stories (9:16 ratio)
   - Generate as downloadable image

2. **Campus Leaderboard Enhancements**
   - Add tabs: Weekly / Monthly / All-Time
   - Show user's rank prominently
   - Add "Challenge Friend" button

---

### Priority 4: Onboarding Improvements

1. **Tutorial Walkthrough**
   - Create step-by-step onboarding flow
   - Highlight key features (Scan, Trade, Earn)
   - "Skip" option for returning users

2. **Preference Quiz**
   - Ask user interests (fashion, electronics, furniture)
   - Use for personalized recommendations

---

## 🚀 SUGGESTED PROMPT TO USE

```
Read the CLAUDE.md file first to understand the project.

Then implement Priority 1: Gamification Polish

Start with the Level Up Celebration page:
1. Create pages/gamification/level-up.html
2. Add confetti animation using CSS/JS
3. Show the new level badge with glow effect
4. Display unlocked perks for the new level
5. Add "Share" and "Continue" buttons
6. Follow the neo-brutalist design system (bold borders, #22c358 green)
7. Make it mobile-first (375px width)
8. Add Demo Mode mock data for testing

Wire the page so it can be triggered after earning enough XP.
```

---

## 🔧 ALTERNATIVE PROMPTS

### For Quick Fixes:
```
Fix the bottom navigation on [page-name] - it should highlight the active tab and link to all main sections.
```

### For New Features:
```
Add a streak counter to the home page that shows how many consecutive days the user has been active. Show a flame emoji and the count. Store in localStorage for demo mode.
```

### For UI Polish:
```
Enhance the marketplace item cards with hover animations, condition badges, and seller ratings. Make them feel premium and interactive.
```

### For Bug Fixes:
```
The scan success page is not showing the AI results. Debug the flow from camera.html → scanning.html → scan-success.html and fix any broken data passing.
```

---

## 📊 STATUS TRACKING

| Feature | Status | Priority |
|---------|--------|----------|
| Level Up Celebration | Not Started | P1 |
| Badge Reveal | Not Started | P1 |
| Daily Streaks | Not Started | P1 |
| Trade Chat Mock | Not Started | P2 |
| Wishlist | Not Started | P2 |
| Share Impact Cards | Not Started | P3 |
| Tutorial Walkthrough | Not Started | P4 |

---

**Use this file as your roadmap. Update the status as you complete features!**
