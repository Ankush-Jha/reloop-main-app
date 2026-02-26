---
description: Worker app QR system and Firebase communication workflow
---

# ReLoop Worker App Workflow

## Overview
The **Worker App** is used by campus staff/workers to collect filled smart bags from ReLoop Points (collection hubs). Workers scan QR codes on smart bags to update their status and trigger coin rewards for students.

## Architecture

### 1. Apps Overview
- **Student App** (`reloop-nextjs`): Students register bags, fill them, track status
- **Worker App** (`reloop-worker-app`): Workers collect bags, update status, process waste

### 2. Shared Backend
Both apps connect to the **same Firebase project**:
```
Firebase Project: reloop-production (or reloop-dev)
├── Authentication (shared user pool)
├── Firestore Database (shared collections)
│   ├── users/
│   ├── smartBags/
│   ├── reloopPoints/
│   └── notifications/
└── Storage (bag photos, receipts)
```

## Smart Bag QR Flow

### Student Journey (reloop-nextjs)
1. **Registration**
   - Student scans bag QR → Creates record in `smartBags` collection
   - Status: `unregistered` → `registered`
   - Firebase update:
     ```json
     {
       "id": "bag_abc123",
       "qrCode": "RELOOP-001",
       "ownerId": "student_uid",
       "ownerName": "John Doe",
       "status": "registered",
       "registeredAt": "2024-02-07T12:00:00Z"
     }
     ```

2. **Filling**
   - Student marks bag as full in app
   - Status: `registered` → `filled`
   - Firebase update:
     ```json
     {
       "status": "filled",
       "filledAt": "2024-02-08T10:30:00Z",
       "estimatedWeight": 5.2
     }
     ```

3. **Drop-off**
   - Student drops bag at nearest ReLoop Point
   - App shows "Awaiting Collection" status

### Worker Journey (reloop-worker-app)

#### 4. Login & Assignment
- Worker logs in with worker credentials (`isWorker: true` in Firebase)
- Dashboard shows assigned ReLoop Points

#### 5. Collection Route
**Worker App UI:**
```
┌─────────────────────────────┐
│ 🗺️ Collection Route         │
├─────────────────────────────┤
│ 📍 Central Canteen Point    │
│    • 12 bags awaiting       │
│    [View Details]           │
│                             │
│ 📍 Library ReLoop Point     │
│    • 8 bags awaiting        │
│    [View Details]           │
└─────────────────────────────┘
```

#### 6. Bag Collection (QR Scan)
**Step-by-step:**

a. **Navigate to Point**
   - Worker selects ReLoop Point
   - App fetches `smartBags` where:
     ```js
     status === 'filled' && reloopPointId === point.id
     ```

b. **Scan QR Code**
   - Worker taps "Scan Bag" button
   - Camera opens → Scans `RELOOP-001`
   
c. **Verify & Collect**
   - App queries Firestore:
     ```js
     const bagRef = doc(db, 'smartBags', bagId);
     const bagSnap = await getDoc(bagRef);
     if (bagSnap.data().status === 'filled') {
       // Valid for collection
     }
     ```

d. **Update Status**
   - Worker confirms collection
   - Firebase batch update:
     ```js
     await updateDoc(bagRef, {
       status: 'collected',
       collectedAt: serverTimestamp(),
       collectedBy: workerData.uid,
       collectorName: workerData.name
     });
     ```

e. **Student Notification**
   - Trigger Cloud Function (or client-side):
     ```js
     // Create notification for student
     await addDoc(collection(db, 'notifications'), {
       userId: bag.ownerId,
       type: 'collection',
       title: 'Bag Collected! 🎉',
       message: `Your smart bag has been collected. Processing rewards...`,
       timestamp: serverTimestamp()
     });
     ```

#### 7. Processing at Facility

**Worker App - Processing Screen:**
```
┌─────────────────────────────┐
│ Collected Bags (15)         │
├─────────────────────────────┤
│ [x] RELOOP-001 - 5.2 kg     │
│ [x] RELOOP-003 - 4.8 kg     │
│ [ ] RELOOP-007 - 3.5 kg     │
│                             │
│ Total Weight: 10.0 kg       │
│ [Process Selected]          │
└─────────────────────────────┘
```

a. **Weight Verification**
   - Worker weighs collected bags
   - Updates actual weight:
     ```js
     await updateDoc(bagRef, {
       actualWeight: 5.4 // kg
     });
     ```

b. **Mark as Processed**
   - Worker taps "Process Selected"
   - Status: `collected` → `processed`
   - **Triggers Reward Calculation**:
     ```js
     const COINS_PER_KG = 10;
     const coinsAwarded = Math.floor(actualWeight * COINS_PER_KG);
     
     await updateDoc(bagRef, {
       status: 'processed',
       processedAt: serverTimestamp(),
       coinsAwarded: coinsAwarded
     });
     
     // Award coins to student
     await DBService.addCoinsToUser(
       bag.ownerId,
       coinsAwarded,
       'Smart bag processing reward'
     );
     ```

c. **Student Notification**
   ```js
   await addDoc(collection(db, 'notifications'), {
     userId: bag.ownerId,
     type: 'coin',
     title: `${coinsAwarded} Coins Earned! 🪙`,
     message: `Your bag was processed. Total weight: ${actualWeight}kg`,
     timestamp: serverTimestamp()
   });
   ```

## QR Code System

### QR Format
```
RELOOP-[5-digit-alpha-numeric]
Example: RELOOP-A1B2C
```

### QR Generation (Student App)
```js
// When registering a new bag
const qrCode = generateQRCode(); // "RELOOP-A1B2C"

await addDoc(collection(db, 'smartBags'), {
  qrCode: qrCode,
  ownerId: currentUser.uid,
  status: 'registered',
  registeredAt: serverTimestamp()
});
```

### QR Scanning (Worker App)
```js
// Worker scans QR
const scannedCode = "RELOOP-A1B2C";

// Query Firestore
const bagsRef = collection(db, 'smartBags');
const q = query(bagsRef, where('qrCode', '==', scannedCode));
const snapshot = await getDocs(q);

if (!snapshot.empty) {
  const bag = snapshot.docs[0];
  // Validate status and proceed with collection
}
```

## Firebase Security Rules

### Smart Bags Collection
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /smartBags/{bagId} {
      // Students can read their own bags
      allow read: if request.auth.uid == resource.data.ownerId;
      
      // Students can create and update their own bags (register/fill)
      allow create, update: if request.auth.uid == request.resource.data.ownerId;
      
      // Workers can read all bags and update for collection/processing
      allow read, update: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isWorker == true;
    }
  }
}
```

## Real-time Updates

### Student App Listeners
```js
// Listen for bag status changes
const bagRef = doc(db, 'smartBags', bagId);
onSnapshot(bagRef, (snapshot) => {
  const bag = snapshot.data();
  if (bag.status === 'collected') {
    showNotification('Your bag has been collected!');
  } else if (bag.status === 'processed') {
    showNotification(`${bag.coinsAwarded} coins earned!`);
    updateUserCoins();
  }
});
```

### Worker App Listeners
```js
// Listen for new filled bags at assigned points
const bagsQuery = query(
  collection(db, 'smartBags'),
  where('status', '==', 'filled'),
  where('reloopPointId', 'in', workerPoints)
);

onSnapshot(bagsQuery, (snapshot) => {
  const filledBags = snapshot.docs.length;
  updateBadgeCount(filledBags);
});
```

## Error Handling

### Common Scenarios

1. **Bag Already Collected**
   ```js
   if (bag.status !== 'filled') {
     showError('Bag has already been collected or is not ready');
     return;
   }
   ```

2. **QR Code Not Found**
   ```js
   if (snapshot.empty) {
     showError('Invalid QR code. Please scan again.');
     return;
   }
   ```

3. **Offline Mode**
   - Firebase offline persistence enabled
   - Queue updates when offline
   - Sync when connection restored

## Worker App Tech Stack
```
reloop-worker-app/
├── Framework: Next.js 14 (App Router)
├── Styling: Tailwind CSS
├── Database: Firebase Firestore (shared with student app)
├── Auth: Firebase Auth (worker-specific users)
├── QR Scanner: react-qr-scanner or html5-qrcode
└── State: Zustand (for worker session state)
```

## Summary
- ✅ Both apps share same Firebase backend
- ✅ QR codes link student bags to Firebase records
- ✅ Worker scans update status: `filled` → `collected` → `processed`
- ✅ Rewards auto-calculated and distributed via Firebase
- ✅ Real-time updates notify students of bag status
- ✅ Security rules ensure workers can only update, not delete bags
