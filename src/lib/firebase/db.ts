import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    query,
    orderBy,
    where,
    serverTimestamp,
    setDoc,
    onSnapshot,
    limit,
    increment,
    Unsubscribe,
    runTransaction,
    writeBatch,
    Timestamp
} from "firebase/firestore";
import { db } from "./client";
import { Listing, User, Trade } from "@/types";
import {
    normalizeBagCode,
    generatePickupCode,
    bagPayout,
    levelFromXp,
    BAG_MAX_WEIGHT_KG
} from "@/lib/qr";

/* eslint-disable @typescript-eslint/no-explicit-any */

function isPermissionDenied(e: unknown): boolean {
    return (e as { code?: string })?.code === 'permission-denied';
}

/** Firestore Timestamp | Date | undefined -> epoch millis (0 if unknown). */
function toMillis(v: any): number {
    if (!v) return 0;
    if (typeof v.toMillis === 'function') return v.toMillis();
    if (v instanceof Date) return v.getTime();
    return 0;
}

const MAX_OFFER_COINS = 1_000_000;
const HIDDEN_LISTING_STATUSES = ['sold', 'donated', 'recycled'];

export const DBService = {
    // USERS
    async createUserProfile(user: User) {
        // Ensure user document exists or update it
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
            ...user,
            lastLogin: serverTimestamp()
        }, { merge: true });
    },

    async getUserProfile(uid: string): Promise<User | null> {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as User;
        }
        return null;
    },

    async updateUserProfile(uid: string, updates: Partial<User>): Promise<void> {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    },

    subscribeToUserProfile(uid: string, callback: (user: User | null) => void): Unsubscribe {
        return onSnapshot(doc(db, "users", uid), (docSnap) => {
            if (docSnap.exists()) {
                callback(docSnap.data() as User);
            } else {
                callback(null);
            }
        });
    },

    // SMART BAGS
    // The document id IS the (normalised) QR code, so a QR can only be registered once.
    async createSmartBag(data: { qrCode: string; userId: string; ownerName?: string }): Promise<string> {
        const code = normalizeBagCode(data.qrCode);
        if (!code) {
            throw new Error("That doesn't look like a ReLoop bag QR code.");
        }

        try {
            await setDoc(doc(db, 'smartBags', code), {
                id: code,
                qrCode: code,
                ownerId: data.userId,
                ownerName: data.ownerName || 'Unknown',
                status: 'registered',
                registeredAt: serverTimestamp()
            });
        } catch (error) {
            // Creating over an existing doc is evaluated as an update, which the rules deny.
            if (isPermissionDenied(error)) {
                throw new Error('This bag is already registered');
            }
            throw error;
        }
        return code;
    },

    async getUserSmartBags(userId: string): Promise<any[]> {
        try {
            const q = query(
                collection(db, 'smartBags'),
                where('ownerId', '==', userId),
                orderBy('registeredAt', 'desc')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error fetching smart bags:', error);
            return [];
        }
    },

    /** Owner marks a registered bag as filled (ready for collection). */
    async markBagFilled(bagId: string, ownerId: string): Promise<void> {
        const bagRef = doc(db, 'smartBags', bagId);
        await runTransaction(db, async (tx) => {
            const snap = await tx.get(bagRef);
            if (!snap.exists()) throw new Error('Bag not found');
            const bag = snap.data();
            if (bag.ownerId !== ownerId) throw new Error('This is not your bag');
            if (bag.status !== 'registered') throw new Error(`This bag is already ${bag.status}`);
            tx.update(bagRef, {
                status: 'filled',
                filledAt: serverTimestamp(),
                wasteType: 'recyclable'
            });
        });
        // Mission progress is best-effort and must never fail the fill itself.
        await this.updateDailyMissionProgress(ownerId, 'bagsFilledToday');
    },

    /**
     * Staff (worker/admin) collects a FILLED bag: records the weight, marks it processed
     * and pays the owner, atomically. Payout = 10 coins/kg (enforced again in firestore.rules).
     */
    async collectSmartBag(
        bagId: string,
        workerId: string,
        weightKg: number,
        opts?: { coins?: number; materials?: string[] }
    ): Promise<{ coinsAwarded: number; ownerId: string; ownerName: string }> {
        if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > BAG_MAX_WEIGHT_KG) {
            throw new Error(`Weight must be between 0 and ${BAG_MAX_WEIGHT_KG} kg`);
        }
        // One decimal place, like a kitchen scale.
        const weight = Math.round(weightKg * 10) / 10;
        if (weight <= 0) throw new Error('Weight is too small');
        // Default 10 coins/kg; staff apps with material pricing pass their own total (rules cap it at 25/kg).
        const coinsAwarded = opts?.coins ?? bagPayout(weight);
        if (!Number.isInteger(coinsAwarded) || coinsAwarded < 0) throw new Error('Invalid payout');
        const xpAwarded = Math.round(weight * 25);
        const co2 = Math.min(50, Math.round(weight * 2.5 * 10) / 10);

        const bagRef = doc(db, 'smartBags', bagId);
        let ownerId = '';
        let ownerName = '';

        await runTransaction(db, async (tx) => {
            const bagSnap = await tx.get(bagRef);
            if (!bagSnap.exists()) throw new Error('Bag not found');
            const bag = bagSnap.data();
            if (bag.status !== 'filled') {
                throw new Error(
                    bag.status === 'processed' || bag.status === 'collected'
                        ? 'This bag was already collected'
                        : 'This bag has not been marked as filled yet'
                );
            }
            if (bag.ownerId === workerId) {
                throw new Error("You can't collect your own bag");
            }

            const ownerRef = doc(db, 'users', bag.ownerId);
            const ownerSnap = await tx.get(ownerRef);
            if (!ownerSnap.exists()) throw new Error('Bag owner account not found');
            const owner = ownerSnap.data();
            ownerId = bag.ownerId;
            ownerName = bag.ownerName || owner.name || 'User';

            tx.update(bagRef, {
                status: 'processed',
                collectedAt: serverTimestamp(),
                processedAt: serverTimestamp(),
                collectedBy: workerId,
                processedBy: workerId,
                estimatedWeight: weight,
                actualWeight: weight,
                ...(opts?.materials ? { materials: opts.materials } : {}),
                coinsAwarded,
                xpAwarded
            });
            const newXp = (owner.xp || 0) + xpAwarded;
            tx.update(ownerRef, {
                coins: (owner.coins || 0) + coinsAwarded,
                xp: newXp,
                level: Math.max(owner.level || 1, levelFromXp(newXp)),
                bagsRecycled: (owner.bagsRecycled || 0) + 1,
                co2Saved: (owner.co2Saved || 0) + co2,
                lastBagId: bagId,
                updatedAt: serverTimestamp()
            });
            tx.set(doc(collection(db, 'coinTransactions')), {
                userId: bag.ownerId,
                byUid: workerId,
                amount: coinsAwarded,
                reason: 'Smart bag collection',
                refId: bagId,
                createdAt: serverTimestamp()
            });
            tx.set(doc(collection(db, 'notifications')), {
                userId: bag.ownerId,
                fromUserId: workerId,
                type: 'coin',
                title: 'Bag Collected! ♻️',
                message: `Your smart bag (${weight} kg) was collected. You earned ${coinsAwarded} coins!`,
                icon: 'shopping_bag',
                actionUrl: `/smart-bags/${bagId}`,
                read: false,
                createdAt: serverTimestamp()
            });
        });

        return { coinsAwarded, ownerId, ownerName };
    },

    async getSmartBagById(bagId: string): Promise<any | null> {
        const docSnap = await getDoc(doc(db, 'smartBags', bagId));
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    },

    /** Look a bag up by the text of its QR code (staff only: owners can only read their own bags). */
    async getSmartBagByQR(rawCode: string): Promise<any | null> {
        const code = normalizeBagCode(rawCode);
        if (!code) return null;
        const direct = await getDoc(doc(db, 'smartBags', code));
        if (direct.exists()) return { id: direct.id, ...direct.data() };
        // Legacy bags were created with random ids.
        const snapshot = await getDocs(query(collection(db, 'smartBags'), where('qrCode', '==', code)));
        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    },

    subscribeToSmartBag(bagId: string, callback: (bag: any | null) => void): Unsubscribe {
        return onSnapshot(doc(db, 'smartBags', bagId), (docSnap) => {
            if (docSnap.exists()) {
                callback({ id: docSnap.id, ...docSnap.data() });
            } else {
                callback(null);
            }
        }, (error) => {
            // Without this a permission error left the UI on a spinner forever.
            console.error('Error subscribing to smart bag:', error);
            callback(null);
        });
    },

    subscribeToUserSmartBags(userId: string, callback: (bags: any[]) => void): Unsubscribe {
        const q = query(
            collection(db, 'smartBags'),
            where('ownerId', '==', userId),
            orderBy('registeredAt', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            const bags = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(bags);
        }, (error) => {
            console.error('Error subscribing to smart bags:', error);
            callback([]);
        });
    },

    // LISTINGS

    async createListing(listingData: Omit<Listing, 'id' | 'createdAt'>) {
        try {
            // Generate ID client-side to save a write operation
            const newRef = doc(collection(db, "listings"));
            // Callers can override `status`; default is 'available'
            const { status = 'available', ...rest } = listingData as any;
            await setDoc(newRef, {
                ...rest,
                status,
                id: newRef.id,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return newRef.id;
        } catch (error) {
            console.error("Error creating listing:", error);
            throw error;
        }
    },


    async getListings(): Promise<Listing[]> {
        try {
            const q = query(collection(db, "listings"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const allListings = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Listing[];
            // Hide items that have left the marketplace (sold / donated / recycled)
            return allListings.filter(listing => !HIDDEN_LISTING_STATUSES.includes(listing.status as string));
        } catch (error) {
            console.error("Error fetching listings:", error);
            return [];
        }
    },

    /** Realtime marketplace feed (replaces re-downloading every listing every 5s). */
    subscribeToListings(callback: (listings: Listing[]) => void): Unsubscribe {
        const q = query(collection(db, "listings"), orderBy("createdAt", "desc"));
        return onSnapshot(q, (snapshot) => {
            const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Listing[];
            callback(all.filter(l => !HIDDEN_LISTING_STATUSES.includes(l.status as string)));
        }, (error) => {
            console.error("Error subscribing to listings:", error);
        });
    },

    async getListingById(id: string): Promise<Listing | null> {
        try {
            const docRef = doc(db, "listings", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as Listing;
            }
            return null;
        } catch (error) {
            console.error("Error fetching listing:", error);
            return null;
        }
    },

    async getUserListings(userId: string): Promise<Listing[]> {
        try {
            const q = query(
                collection(db, "listings"),
                where("seller.id", "==", userId),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Listing[];
        } catch (error) {
            console.error("Error fetching user listings:", error);
            return [];
        }
    },

    async deleteListing(listingId: string, userId: string): Promise<boolean> {
        try {
            // Verify ownership before deleting
            const listing = await this.getListingById(listingId);
            if (!listing || listing.seller.id !== userId) {
                console.error("Unauthorized: Cannot delete listing");
                return false;
            }

            const docRef = doc(db, "listings", listingId);
            await deleteDoc(docRef);
            return true;
        } catch (error) {
            console.error("Error deleting listing:", error);
            return false;
        }
    },

    async updateListingStatus(listingId: string, status: 'available' | 'sold' | 'pending' | 'reserved'): Promise<boolean> {
        try {
            const docRef = doc(db, "listings", listingId);
            await updateDoc(docRef, { status, updatedAt: serverTimestamp() });
            return true;
        } catch (error) {
            console.error("Error updating listing status:", error);
            return false;
        }
    },

    async updateListing(listingId: string, userId: string, updates: Partial<Listing>): Promise<boolean> {
        try {
            // Verify ownership first
            const listingDoc = await getDoc(doc(db, "listings", listingId));
            if (!listingDoc.exists()) {
                console.error("Listing not found");
                return false;
            }
            if (listingDoc.data().seller?.id !== userId) {
                console.error("Not authorized to edit this listing");
                return false;
            }

            const docRef = doc(db, "listings", listingId);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error("Error updating listing:", error);
            return false;
        }
    },

    // MESSAGES & CONVERSATIONS
    async getConversations(userId: string) {
        try {
            // Simple query without orderBy to avoid composite index requirement
            const q = query(
                collection(db, "conversations"),
                where("participants", "array-contains", userId)
            );
            const snapshot = await getDocs(q);
            const conversations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Sort in-memory by lastMessageAt (descending)
            conversations.sort((a: any, b: any) => {
                const aTime = a.lastMessageAt?.toDate?.()?.getTime() || 0;
                const bTime = b.lastMessageAt?.toDate?.()?.getTime() || 0;
                return bTime - aTime;
            });

            return conversations;
        } catch (error) {
            console.error("Error fetching conversations:", error);
            return [];
        }
    },

    async getMessages(conversationId: string) {
        try {
            const q = query(
                collection(db, "conversations", conversationId, "messages"),
                orderBy("timestamp", "asc")
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching messages:", error);
            return [];
        }
    },

    async sendMessage(
        conversationId: string,
        senderId: string,
        text: string,
        messageType: 'text' | 'offer' | 'system' = 'text',
        offerAmount?: number,
        extra?: { tradeId?: string }
    ) {
        try {
            const messagesRef = collection(db, "conversations", conversationId, "messages");
            const messageData: any = {
                senderId,
                text,
                type: messageType,
                timestamp: serverTimestamp(),
                read: false,
            };

            // Add offer-specific fields
            if (messageType === 'offer') {
                messageData.offerAmount = offerAmount ?? 0;
                messageData.offerStatus = 'pending';
                if (extra?.tradeId) messageData.tradeId = extra.tradeId;
            }

            const docRef = await addDoc(messagesRef, messageData);

            // Update conversation's lastMessage
            const convRef = doc(db, "conversations", conversationId);
            const lastMessageText = messageType === 'offer'
                ? `💰 Offer: ${offerAmount} coins`
                : text;
            await updateDoc(convRef, {
                lastMessage: lastMessageText,
                lastMessageAt: serverTimestamp()
            });

            // Notify the OTHER participant(s) for real messages (not system messages)
            if (messageType !== 'system') {
                try {
                    const convSnap = await getDoc(convRef);
                    const convData = convSnap.data();
                    const participants: string[] = convData?.participants || [];
                    const recipients = participants.filter(p => p !== senderId);
                    for (const recipientId of recipients) {
                        const notifRef = doc(collection(db, "notifications"));
                        await setDoc(notifRef, {
                            userId: recipientId,
                            fromUserId: senderId,
                            type: 'message',
                            title: messageType === 'offer' ? 'New Offer! 💰' : 'New Message 💬',
                            message: messageType === 'offer'
                                ? `Someone offered ${offerAmount} coins for your item.`
                                : text.length > 80 ? text.substring(0, 80) + '…' : text,
                            icon: messageType === 'offer' ? 'local_offer' : 'chat',
                            conversationId,
                            actionUrl: `/messages/${conversationId}`,
                            read: false,
                            createdAt: serverTimestamp()
                        });
                    }
                } catch (notifErr) {
                    // Non-fatal — message already sent successfully
                    console.error('Failed to create message notification:', notifErr);
                }
            }

            return docRef.id;
        } catch (error) {
            console.error("Error sending message:", error);
            throw error;
        }
    },

    // Send an offer message in chat (prefer makeOffer(), which also creates the trade).
    async sendOffer(conversationId: string, senderId: string, amount: number, listingTitle?: string, tradeId?: string) {
        const text = `I'd like to offer ${amount} coins${listingTitle ? ` for "${listingTitle}"` : ''}. Let me know if that works!`;
        return await this.sendMessage(conversationId, senderId, text, 'offer', amount, { tradeId });
    },

    // Send a QR code message in chat. `senderId` must be the signed-in user who triggered it.
    async sendQRMessage(
        conversationId: string,
        senderId: string,
        qrData: {
            type: 'dropoff' | 'pickup';
            tradeId?: string;
            listingId: string;
            listingTitle: string;
            sellerId: string;
            buyerId?: string;
            amount?: number;
        }
    ) {
        try {
            const messagesRef = collection(db, "conversations", conversationId, "messages");
            await addDoc(messagesRef, {
                senderId,
                type: 'qr',
                qrType: qrData.type,
                // NOTE: never put the pickup code in here - the seller can read this message.
                qrData: {
                    ...qrData,
                    createdAt: new Date().toISOString(),
                },
                text: qrData.type === 'pickup'
                    ? `🎉 Show this QR to the seller to pick up "${qrData.listingTitle}"`
                    : `📦 Show this QR to drop off "${qrData.listingTitle}"`,
                timestamp: serverTimestamp(),
                read: false,
            });

            const convRef = doc(db, "conversations", conversationId);
            await updateDoc(convRef, {
                lastMessage: `📱 QR Code sent for ${qrData.type}`,
                lastMessageAt: serverTimestamp(),
            });
        } catch (error) {
            console.error("Error sending QR message:", error);
            throw error;
        }
    },

    async createConversation(
        participant1: string,
        participant2: string,
        listingId?: string,
        listingTitle?: string,
        listingImage?: string,
        listingPrice?: number,
        sellerName?: string,
        sellerAvatar?: string
    ) {
        try {
            // Updated to single-write pattern
            const newRef = doc(collection(db, "conversations"));
            await setDoc(newRef, {
                id: newRef.id,
                participants: [participant1, participant2],
                listingId: listingId || null,
                listingTitle: listingTitle || null,
                listingImage: listingImage || null,
                listingPrice: listingPrice || null,
                // Store seller info for display in messages list
                sellerName: sellerName || null,
                sellerAvatar: sellerAvatar || null,
                lastMessage: '',
                lastMessageAt: serverTimestamp(),
                createdAt: serverTimestamp()
            });
            return newRef.id;
        } catch (error) {
            console.error("Error creating conversation:", error);
            throw error;
        }
    },

    // TRANSACTIONS (Trade History)
    async getUserTransactions(userId: string) {
        try {
            const q = query(
                collection(db, "transactions"),
                where("participants", "array-contains", userId),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching transactions:", error);
            return [];
        }
    },

    // REAL-TIME MESSAGE SUBSCRIPTION
    subscribeToMessages(
        conversationId: string,
        callback: (messages: any[]) => void
    ): Unsubscribe {
        const q = query(
            collection(db, "conversations", conversationId, "messages"),
            orderBy("timestamp", "asc")
        );
        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(messages);
        });
    },

    // FIND OR CREATE CONVERSATION
    async findOrCreateConversation(
        userId: string,
        sellerId: string,
        listingId?: string,
        listingTitle?: string,
        listingImage?: string,
        listingPrice?: number,
        sellerName?: string,
        sellerAvatar?: string
    ): Promise<string> {
        try {
            // Check if conversation exists for this specific listing
            const q = query(
                collection(db, "conversations"),
                where("participants", "array-contains", userId)
            );
            const snapshot = await getDocs(q);

            // Find existing conversation with both participants AND same listing
            const existing = snapshot.docs.find(doc => {
                const data = doc.data();
                const hasBothParticipants = data.participants.includes(sellerId);
                // If listingId is provided, also match by listingId
                if (listingId) {
                    return hasBothParticipants && data.listingId === listingId;
                }
                // For non-listing conversations, just match participants
                return hasBothParticipants && !data.listingId;
            });

            if (existing) {
                return existing.id;
            }

            // Create new conversation for this listing
            return await this.createConversation(userId, sellerId, listingId, listingTitle, listingImage, listingPrice, sellerName, sellerAvatar);
        } catch (error) {
            console.error("Error finding/creating conversation:", error);
            throw error;
        }
    },

    // TRADES
    // Lifecycle: pending --accept--> accepted --(seller scans buyer's pickup QR)--> completed
    //            pending --decline/cancel--> declined/cancelled ; accepted --cancel--> cancelled
    // Coins only move at `completed`, atomically (see completeTrade + firestore.rules).

    /** Buyer makes an offer: creates the trade, opens/finds the chat and posts the offer card. */
    async makeOffer(params: {
        listing: Listing;
        buyer: { uid: string; name?: string; avatar?: string };
        coins: number;
        offeredItem?: string;
    }): Promise<{ tradeId: string; conversationId: string }> {
        const { listing, buyer } = params;
        const coins = Math.floor(Number(params.coins) || 0);
        const offeredItem = params.offeredItem?.trim() || undefined;

        if (!listing?.seller?.id) throw new Error('Seller information is missing');
        if (listing.seller.id === buyer.uid) throw new Error("You can't make an offer on your own listing");
        if (coins < 0 || coins > MAX_OFFER_COINS) throw new Error('Offer amount is out of range');
        if (coins === 0 && !offeredItem) throw new Error('Enter a coin amount or an item to swap');

        const fresh = await this.getListingById(listing.id);
        if (!fresh) throw new Error('This listing no longer exists');
        if (fresh.status !== 'available') throw new Error('This item is no longer available');

        if (coins > 0) {
            const profile = await this.getUserProfile(buyer.uid);
            if ((profile?.coins || 0) < coins) throw new Error("You don't have enough coins for this offer");
        }

        const existing = await getDocs(query(
            collection(db, 'trades'),
            where('traderId', '==', buyer.uid),
            where('listingId', '==', listing.id),
            where('status', '==', 'pending')
        ));
        if (!existing.empty) throw new Error('You already have a pending offer on this item');

        const tradeId = await this.createTrade({
            listingId: listing.id,
            listingTitle: listing.title || 'Untitled',
            listingImage: listing.images?.[0] || '',
            sellerId: listing.seller.id,
            sellerName: listing.seller.name || 'Seller',
            sellerAvatar: listing.seller.avatar || '',
            traderId: buyer.uid,
            traderName: buyer.name || 'User',
            traderAvatar: buyer.avatar || '',
            status: 'pending',
            ...(offeredItem ? { offeredItem } : {}),
            ...(coins > 0 ? { offeredCoins: coins } : {}),
        });

        const conversationId = await this.findOrCreateConversation(
            buyer.uid,
            listing.seller.id,
            listing.id,
            listing.title,
            listing.images?.[0],
            listing.price,
            listing.seller.name,
            listing.seller.avatar
        );
        await this.sendOffer(conversationId, buyer.uid, coins, listing.title, tradeId);
        return { tradeId, conversationId };
    },

    async createTrade(tradeData: Omit<Trade, 'id' | 'createdAt'>): Promise<string> {
        try {
            const newRef = doc(collection(db, "trades"));
            await setDoc(newRef, {
                ...tradeData,
                id: newRef.id,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                status: 'pending'
            });
            return newRef.id;
        } catch (error) {
            console.error("Error creating trade:", error);
            throw error;
        }
    },

    async getUserTrades(userId: string): Promise<Trade[]> {
        try {
            const [sellerSnapshot, traderSnapshot] = await Promise.all([
                getDocs(query(collection(db, "trades"), where("sellerId", "==", userId), orderBy("createdAt", "desc"))),
                getDocs(query(collection(db, "trades"), where("traderId", "==", userId), orderBy("createdAt", "desc")))
            ]);

            const byId = new Map<string, Trade>();
            [...sellerSnapshot.docs, ...traderSnapshot.docs].forEach(d => {
                byId.set(d.id, { ...d.data(), id: d.id } as Trade);
            });

            // createdAt is a Firestore Timestamp (not a Date) - compare by millis.
            return Array.from(byId.values()).sort(
                (a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)
            );
        } catch (error) {
            console.error("Error fetching trades:", error);
            return [];
        }
    },

    /** Seller accepts an offer: reserves the listing; other pending offers are declined. */
    async acceptTrade(params: {
        tradeId: string;
        sellerId: string;
        conversationId?: string;
        messageId?: string;
    }): Promise<{ conversationId: string }> {
        const { tradeId, sellerId } = params;
        const tradeRef = doc(db, 'trades', tradeId);
        let trade: any = null;

        await runTransaction(db, async (tx) => {
            const snap = await tx.get(tradeRef);
            if (!snap.exists()) throw new Error('Offer not found');
            const t = snap.data();
            if (t.sellerId !== sellerId) throw new Error('Only the seller can accept this offer');
            if (t.status !== 'pending') throw new Error(`This offer is already ${t.status}`);

            const listingRef = doc(db, 'listings', t.listingId);
            const listingSnap = await tx.get(listingRef);
            if (!listingSnap.exists()) throw new Error('This listing no longer exists');
            if (listingSnap.data().status !== 'available') {
                throw new Error('This item is already reserved or sold');
            }

            tx.update(tradeRef, {
                status: 'accepted',
                agreedCoins: t.offeredCoins || 0,
                acceptedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            tx.update(listingRef, { status: 'pending', updatedAt: serverTimestamp() });
            if (params.conversationId && params.messageId) {
                tx.update(
                    doc(db, 'conversations', params.conversationId, 'messages', params.messageId),
                    { offerStatus: 'accepted' }
                );
            }
            trade = { id: tradeId, ...t, agreedCoins: t.offeredCoins || 0 };
        });

        // ---- best-effort follow-ups (the deal itself is already safely recorded) ----
        try {
            const others = await getDocs(query(
                collection(db, 'trades'),
                where('listingId', '==', trade.listingId),
                where('sellerId', '==', sellerId),
                where('status', '==', 'pending')
            ));
            if (!others.empty) {
                const batch = writeBatch(db);
                others.docs.forEach(d => batch.update(d.ref, { status: 'declined', updatedAt: serverTimestamp() }));
                await batch.commit();
            }
        } catch (e) {
            console.error('Failed to decline competing offers:', e);
        }

        let conversationId = params.conversationId || '';
        try {
            if (!conversationId) {
                conversationId = await this.findOrCreateConversation(
                    sellerId, trade.traderId, trade.listingId, trade.listingTitle,
                    trade.listingImage, undefined, trade.traderName, trade.traderAvatar
                );
            }
            await this.sendMessage(conversationId, sellerId, '✅ Offer accepted! Deal confirmed.', 'system');
            await this.sendQRMessage(conversationId, sellerId, {
                type: 'pickup',
                tradeId,
                listingId: trade.listingId,
                listingTitle: trade.listingTitle || 'Item',
                sellerId,
                buyerId: trade.traderId,
                amount: trade.agreedCoins,
            });
            await this.createNotification({
                userId: trade.traderId,
                fromUserId: sellerId,
                type: 'trade',
                title: 'Offer Accepted! 🎉',
                message: `Your offer for "${trade.listingTitle || 'an item'}" was accepted. Show your pickup QR to the seller.`,
                icon: 'check_circle',
                actionUrl: `/messages/${conversationId}`
            });
        } catch (e) {
            console.error('Failed to post acceptance messages:', e);
        }

        return { conversationId };
    },

    async declineTrade(params: {
        tradeId: string;
        sellerId: string;
        conversationId?: string;
        messageId?: string;
    }): Promise<void> {
        const tradeRef = doc(db, 'trades', params.tradeId);
        let trade: any = null;
        await runTransaction(db, async (tx) => {
            const snap = await tx.get(tradeRef);
            if (!snap.exists()) throw new Error('Offer not found');
            const t = snap.data();
            if (t.sellerId !== params.sellerId) throw new Error('Only the seller can decline this offer');
            if (t.status !== 'pending') throw new Error(`This offer is already ${t.status}`);
            tx.update(tradeRef, { status: 'declined', updatedAt: serverTimestamp() });
            if (params.conversationId && params.messageId) {
                tx.update(
                    doc(db, 'conversations', params.conversationId, 'messages', params.messageId),
                    { offerStatus: 'declined' }
                );
            }
            trade = t;
        });
        try {
            if (params.conversationId) {
                await this.sendMessage(params.conversationId, params.sellerId, '❌ Offer declined.', 'system');
            }
            await this.createNotification({
                userId: trade.traderId,
                fromUserId: params.sellerId,
                type: 'trade',
                title: 'Offer Declined',
                message: `Your offer for "${trade.listingTitle || 'an item'}" was declined.`,
                icon: 'cancel'
            });
        } catch (e) {
            console.error('Failed to post decline follow-ups:', e);
        }
    },

    /** Buyer withdraws a pending offer. */
    async cancelOffer(tradeId: string, buyerId: string): Promise<void> {
        const tradeRef = doc(db, 'trades', tradeId);
        await runTransaction(db, async (tx) => {
            const snap = await tx.get(tradeRef);
            if (!snap.exists()) throw new Error('Offer not found');
            const t = snap.data();
            if (t.traderId !== buyerId) throw new Error('Only the buyer can withdraw this offer');
            if (t.status !== 'pending') throw new Error(`This offer is already ${t.status}`);
            tx.update(tradeRef, { status: 'cancelled', updatedAt: serverTimestamp() });
        });
    },

    /** Seller backs out of an accepted deal: the item goes back on the marketplace. */
    async cancelAcceptedTrade(tradeId: string, sellerId: string): Promise<void> {
        const tradeRef = doc(db, 'trades', tradeId);
        await runTransaction(db, async (tx) => {
            const snap = await tx.get(tradeRef);
            if (!snap.exists()) throw new Error('Deal not found');
            const t = snap.data();
            if (t.sellerId !== sellerId) throw new Error('Only the seller can cancel this deal');
            if (t.status !== 'accepted') throw new Error(`This deal is already ${t.status}`);
            tx.update(tradeRef, { status: 'cancelled', updatedAt: serverTimestamp() });
            tx.update(doc(db, 'listings', t.listingId), { status: 'available', updatedAt: serverTimestamp() });
        });
    },

    /**
     * Buyer-side: get (or create once) the secret behind the pickup QR.
     * Stored in trades/{id}/secrets/pickup, which only the buyer can read.
     */
    async getOrCreatePickupSecret(tradeId: string, buyerId: string): Promise<string> {
        const tradeSnap = await getDoc(doc(db, 'trades', tradeId));
        if (!tradeSnap.exists()) throw new Error('Deal not found');
        const trade = tradeSnap.data();
        if (trade.traderId !== buyerId) throw new Error('Only the buyer has a pickup QR');
        if (trade.status !== 'accepted') throw new Error(`This deal is ${trade.status}`);

        const secretRef = doc(db, 'trades', tradeId, 'secrets', 'pickup');
        const existing = await getDoc(secretRef);
        if (existing.exists()) return existing.data().code as string;

        const code = generatePickupCode();
        try {
            await setDoc(secretRef, { code, createdAt: serverTimestamp() });
            return code;
        } catch (error) {
            // Another tab created it first (secrets are write-once): read theirs.
            const again = await getDoc(secretRef);
            if (again.exists()) return again.data().code as string;
            throw error;
        }
    },

    /**
     * Seller-side: the buyer showed their pickup QR / code. Verifies it and settles:
     * coins move buyer -> seller, listing is marked sold, stats + ledger + notifications
     * are written, all in ONE transaction. The code check is enforced by firestore.rules.
     */
    async completeTrade(params: {
        tradeId: string;
        code: string;
        /** The signed-in user completing the deal: the seller, or ReLoop zone staff. */
        sellerId: string;
    }): Promise<{ coins: number; listingTitle: string }> {
        const code = params.code.trim().toUpperCase();
        const tradeRef = doc(db, 'trades', params.tradeId);
        let result = { coins: 0, listingTitle: '' };

        try {
            await runTransaction(db, async (tx) => {
                const tradeSnap = await tx.get(tradeRef);
                if (!tradeSnap.exists()) throw new Error('Deal not found');
                const t = tradeSnap.data();
                if (t.sellerId !== params.sellerId) {
                    const actorSnap = await tx.get(doc(db, 'users', params.sellerId));
                    const role = actorSnap.data()?.role;
                    if (role !== 'worker' && role !== 'admin') {
                        throw new Error('Only the seller or ReLoop staff can complete this deal');
                    }
                }
                if (t.status === 'completed') throw new Error('This deal is already completed');
                if (t.status !== 'accepted') throw new Error(`This deal is ${t.status}, not ready for pickup`);

                const amount: number = t.agreedCoins || 0;
                const buyerRef = doc(db, 'users', t.traderId);
                const sellerRef = doc(db, 'users', t.sellerId);
                const listingRef = doc(db, 'listings', t.listingId);
                const [buyerSnap, sellerSnap, listingSnap] = await Promise.all([
                    tx.get(buyerRef), tx.get(sellerRef), tx.get(listingRef)
                ]);
                if (!buyerSnap.exists() || !sellerSnap.exists()) throw new Error('One of the accounts no longer exists');
                if (!listingSnap.exists()) throw new Error('The listing no longer exists');

                const buyer = buyerSnap.data();
                const seller = sellerSnap.data();
                if ((buyer.coins || 0) < amount) {
                    throw new Error('The buyer no longer has enough coins for this deal');
                }

                const co2PerTrade = 2.5;
                tx.update(tradeRef, {
                    status: 'completed',
                    verifiedCode: code,
                    completedAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                tx.update(buyerRef, {
                    coins: (buyer.coins || 0) - amount,
                    itemsTraded: (buyer.itemsTraded || 0) + 1,
                    co2Saved: (buyer.co2Saved || 0) + co2PerTrade,
                    lastTradeId: params.tradeId,
                    updatedAt: serverTimestamp()
                });
                tx.update(sellerRef, {
                    coins: (seller.coins || 0) + amount,
                    itemsTraded: (seller.itemsTraded || 0) + 1,
                    co2Saved: (seller.co2Saved || 0) + co2PerTrade,
                    lastTradeId: params.tradeId,
                    updatedAt: serverTimestamp()
                });
                tx.update(listingRef, { status: 'sold', soldAt: serverTimestamp(), updatedAt: serverTimestamp() });

                if (amount > 0) {
                    tx.set(doc(collection(db, 'coinTransactions')), {
                        userId: t.traderId, byUid: params.sellerId, amount: -amount,
                        reason: `Bought "${t.listingTitle || 'item'}"`, refId: params.tradeId,
                        createdAt: serverTimestamp()
                    });
                    tx.set(doc(collection(db, 'coinTransactions')), {
                        userId: t.sellerId, byUid: params.sellerId, amount,
                        reason: `Sold "${t.listingTitle || 'item'}"`, refId: params.tradeId,
                        createdAt: serverTimestamp()
                    });
                }
                tx.set(doc(collection(db, 'notifications')), {
                    userId: t.traderId, fromUserId: params.sellerId, type: 'trade',
                    title: 'Trade Complete! 🎉',
                    message: `You picked up "${t.listingTitle || 'an item'}"${amount ? ` for ${amount} coins` : ''}. +${co2PerTrade}kg CO₂ saved!`,
                    icon: 'check_circle', tradeId: params.tradeId, read: false, createdAt: serverTimestamp()
                });
                tx.set(doc(collection(db, 'notifications')), {
                    userId: t.sellerId, fromUserId: params.sellerId, type: 'trade',
                    title: 'Trade Complete! 🎉',
                    message: `"${t.listingTitle || 'Your item'}" was picked up${amount ? ` — you received ${amount} coins` : ''}. +${co2PerTrade}kg CO₂ saved!`,
                    icon: 'check_circle', tradeId: params.tradeId, read: false, createdAt: serverTimestamp()
                });

                result = { coins: amount, listingTitle: t.listingTitle || 'Item' };
            });
        } catch (error) {
            if (isPermissionDenied(error)) {
                // The rules reject a wrong pickup code (the only part they check that the app can't).
                throw new Error("That pickup code doesn't match. Ask the buyer to show their QR again.");
            }
            throw error;
        }

        await this.updateDailyMissionProgress(params.sellerId, 'tradesToday');
        return result;
    },

    // NOTIFICATIONS
    async getNotifications(userId: string, limitCount: number = 50): Promise<any[]> {
        try {
            const q = query(
                collection(db, "notifications"),
                where("userId", "==", userId),
                orderBy("createdAt", "desc"),
                limit(limitCount)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date()
            }));
        } catch (error) {
            console.error("Error fetching notifications:", error);
            return [];
        }
    },

    subscribeToNotifications(userId: string, callback: (notifications: any[]) => void): Unsubscribe {
        const q = query(
            collection(db, "notifications"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc"),
            limit(50)
        );
        return onSnapshot(q, (snapshot) => {
            const notifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate?.() || new Date()
            }));
            callback(notifications);
        }, (error) => {
            console.error("Error subscribing to notifications:", error);
            callback([]);
        });
    },

    async markNotificationRead(notificationId: string): Promise<void> {
        try {
            await updateDoc(doc(db, "notifications", notificationId), {
                read: true,
                readAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    },

    async markAllNotificationsRead(userId: string): Promise<void> {
        try {
            const q = query(
                collection(db, "notifications"),
                where("userId", "==", userId),
                where("read", "==", false)
            );
            const snapshot = await getDocs(q);

            const updates = snapshot.docs.map(docSnapshot =>
                updateDoc(doc(db, "notifications", docSnapshot.id), {
                    read: true,
                    readAt: serverTimestamp()
                })
            );
            await Promise.all(updates);
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
        }
    },

    async createNotification(data: {
        userId: string;
        type: string;
        title: string;
        message: string;
        icon?: string;
        actionUrl?: string;
        /** Required when notifying someone else: must be the signed-in user's uid. */
        fromUserId?: string;
    }): Promise<string> {
        try {
            const docRef = await addDoc(collection(db, "notifications"), {
                ...data,
                read: false,
                createdAt: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error creating notification:", error);
            throw error;
        }
    },

    async getUnreadNotificationCount(userId: string): Promise<number> {
        try {
            const q = query(
                collection(db, "notifications"),
                where("userId", "==", userId),
                where("read", "==", false)
            );
            const snapshot = await getDocs(q);
            return snapshot.size;
        } catch (error) {
            console.error("Error getting unread count:", error);
            return 0;
        }
    },

    // REWARDS
    async getRewards(): Promise<any[]> {
        try {
            // Field name aligned with firestore.indexes.json: `isActive`
            const q = query(collection(db, "rewards"), where("isActive", "==", true));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching rewards:", error);
            return [];
        }
    },

    async redeemReward(userId: string, rewardId: string): Promise<{ success: boolean; redemptionId?: string; code?: string; error?: string }> {
        try {
            let redemptionId = '';
            let code = '';

            await runTransaction(db, async (transaction) => {
                // The price comes from the reward document, never from the caller.
                const rewardRef = doc(db, "rewards", rewardId);
                const rewardSnap = await transaction.get(rewardRef);
                if (!rewardSnap.exists() || rewardSnap.data().isActive === false) {
                    throw new Error('This reward is no longer available');
                }
                const cost: number = rewardSnap.data().cost;
                if (!Number.isFinite(cost) || cost <= 0) throw new Error('This reward has an invalid price');

                const userRef = doc(db, "users", userId);
                const userDoc = await transaction.get(userRef);
                const currentCoins = userDoc.data()?.coins || 0;

                if (currentCoins < cost) {
                    throw new Error('Not enough coins');
                }

                transaction.update(userRef, { coins: currentCoins - cost, updatedAt: serverTimestamp() });

                // Create redemption record
                const redemptionRef = doc(collection(db, "redemptions"));
                redemptionId = redemptionRef.id;
                code = `RL-${generatePickupCode()}`;
                transaction.set(redemptionRef, {
                    userId,
                    rewardId,
                    cost,
                    status: 'pending',
                    code,
                    redeemedAt: serverTimestamp()
                });

                transaction.set(doc(collection(db, "coinTransactions")), {
                    userId, byUid: userId, amount: -cost,
                    reason: `Redeemed reward ${rewardSnap.data().title || rewardId}`,
                    refId: redemptionRef.id, createdAt: serverTimestamp()
                });

                // Create notification
                const notifRef = doc(collection(db, "notifications"));
                transaction.set(notifRef, {
                    userId,
                    type: 'reward',
                    title: 'Reward Redeemed! 🎉',
                    message: `You redeemed a reward for ${cost} coins.`,
                    icon: 'redeem',
                    read: false,
                    createdAt: serverTimestamp()
                });
            });

            return { success: true, redemptionId, code };
        } catch (error: any) {
            console.error("Error redeeming reward:", error);
            return { success: false, error: error.message };
        }
    },

    async getUserRedemptions(userId: string): Promise<any[]> {
        try {
            const q = query(
                collection(db, "redemptions"),
                where("userId", "==", userId),
                orderBy("redeemedAt", "desc")
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching redemptions:", error);
            return [];
        }
    },

    async getRedemptionsByRewardIds(userId: string, rewardIds: string[]): Promise<Set<string>> {
        try {
            if (rewardIds.length === 0) return new Set();

            const q = query(
                collection(db, "redemptions"),
                where("userId", "==", userId),
                where("rewardId", "in", rewardIds)
            );
            const snapshot = await getDocs(q);
            return new Set(snapshot.docs.map(doc => doc.data().rewardId));
        } catch (error) {
            console.error("Error fetching redemptions:", error);
            return new Set();
        }
    },

    // SCAN HISTORY
    /**
     * Persist a scan and grant its XP once, atomically.
     * (XP is bounded per scan; the AI result itself can't be trusted for anything bigger.)
     */
    async recordScan(userId: string, scanResult: any): Promise<{ scanId: string; xpEarned: number }> {
        const xpEarned = Math.max(0, Math.min(15, Math.floor(Number(scanResult?.xpEarned) || 15)));
        const scanRef = doc(collection(db, "scans"));
        const userRef = doc(db, "users", userId);
        await runTransaction(db, async (tx) => {
            const userSnap = await tx.get(userRef);
            const u = userSnap.data() || {};
            const newXp = (u.xp || 0) + xpEarned;
            tx.set(scanRef, {
                userId,
                item: scanResult.item,
                classification: scanResult.classification,
                xpEarned,
                claimed: false,
                scannedAt: serverTimestamp()
            });
            tx.update(userRef, {
                xp: newXp,
                level: Math.max(u.level || 1, levelFromXp(newXp)),
                totalScans: (u.totalScans || 0) + 1,
                updatedAt: serverTimestamp()
            });
        });
        await this.updateDailyMissionProgress(userId, 'scansToday');
        return { scanId: scanRef.id, xpEarned };
    },

    async getUserScans(userId: string): Promise<any[]> {
        try {
            const q = query(
                collection(db, "scans"),
                where("userId", "==", userId),
                orderBy("scannedAt", "desc"),
                limit(50)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                scannedAt: doc.data().scannedAt?.toDate?.() || new Date()
            }));
        } catch (error) {
            console.error("Error fetching scans:", error);
            return [];
        }
    },

    // EXPIRED LISTINGS
    async getExpiredListings(userId: string): Promise<any[]> {
        try {
            // Listings unsold after the 14-day window (dropped at a point, or just old)
            const now = Date.now();
            const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;

            const q = query(
                collection(db, "listings"),
                where("seller.id", "==", userId)
            );
            const snapshot = await getDocs(q);

            return snapshot.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter((listing: any) => {
                    // Only unsold items can expire
                    if (listing.status !== 'available' && listing.status !== 'at_point') return false;
                    const expiresAt = toMillis(listing.expiresAt);
                    if (expiresAt) return expiresAt < now;
                    return (toMillis(listing.createdAt) || now) < fourteenDaysAgo;
                });
        } catch (error) {
            console.error("Error fetching expired listings:", error);
            return [];
        }
    },

    async handleEquityChoice(userId: string, listingId: string, choice: 'recycle' | 'donate'): Promise<{ success: boolean; coinsAwarded: number }> {
        try {
            let totalCoins = 0;

            await runTransaction(db, async (transaction) => {
                const listingRef = doc(db, "listings", listingId);
                const listingSnap = await transaction.get(listingRef);
                if (!listingSnap.exists()) throw new Error('Listing not found');
                const listing = listingSnap.data();

                // Ownership + one-shot guard: previously anyone could re-run this for
                // unlimited coins because neither was checked.
                if (listing.seller?.id !== userId) throw new Error('Not your listing');
                if (listing.status !== 'available' && listing.status !== 'at_point') {
                    throw new Error('This listing was already processed');
                }

                const baseCoins = Math.min(50, Math.floor((listing.price || 0) * 0.1));
                totalCoins = baseCoins + (choice === 'donate' ? 10 : 0);

                transaction.update(listingRef, {
                    status: choice === 'donate' ? 'donated' : 'recycled',
                    equityChoice: choice,
                    equityProcessedAt: serverTimestamp()
                });

                const userRef = doc(db, "users", userId);
                const userDoc = await transaction.get(userRef);
                const currentCoins = userDoc.data()?.coins || 0;
                transaction.update(userRef, {
                    coins: currentCoins + totalCoins,
                    ...(choice === 'donate' ? { donationsMade: (userDoc.data()?.donationsMade || 0) + 1 } : {}),
                    updatedAt: serverTimestamp()
                });

                transaction.set(doc(collection(db, "notifications")), {
                    userId,
                    type: 'coin',
                    title: choice === 'donate' ? 'Donation Complete! 💚' : 'Recycling Complete! ♻️',
                    message: `You earned ${totalCoins} coins for ${choice === 'donate' ? 'donating' : 'recycling'} your item.`,
                    icon: choice === 'donate' ? 'favorite' : 'recycling',
                    read: false,
                    createdAt: serverTimestamp()
                });
            });

            return { success: true, coinsAwarded: totalCoins };
        } catch (error) {
            console.error("Error handling equity choice:", error);
            return { success: false, coinsAwarded: 0 };
        }
    },

    // RELOOP POINTS & RECYCLE ZONES
    async getReloopPoints(): Promise<any[]> {
        try {
            // Field name aligned with firestore.indexes.json: `isActive`
            const q = query(collection(db, "reloopPoints"), where("isActive", "==", true));
            const snapshot = await getDocs(q);
            if (snapshot.empty) return [];
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching reloop points:", error);
            return [];
        }
    },

    async getRecycleZones(): Promise<any[]> {
        try {
            // Field name aligned with firestore.indexes.json: `isActive`
            const q = query(collection(db, "recycleZones"), where("isActive", "==", true));
            const snapshot = await getDocs(q);
            if (snapshot.empty) return [];
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching recycle zones:", error);
            return [];
        }
    },

    async dropItemAtPoint(userId: string, listingId: string, pointId: string): Promise<{ success: boolean; expiresAt?: Date }> {
        try {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 14);

            await runTransaction(db, async (transaction) => {
                // Update listing status and location
                const listingRef = doc(db, "listings", listingId);
                const listingSnap = await transaction.get(listingRef);
                if (!listingSnap.exists()) throw new Error('Listing not found');
                if (listingSnap.data().seller?.id !== userId) throw new Error('Not your listing');
                if (listingSnap.data().status !== 'available') throw new Error('This item can no longer be dropped off');
                transaction.update(listingRef, {
                    status: 'at_point',
                    pointId,
                    droppedAt: serverTimestamp(),
                    expiresAt
                });

                // Create notification
                const notifRef = doc(collection(db, "notifications"));
                transaction.set(notifRef, {
                    userId,
                    type: 'listing',
                    title: 'Item Dropped Off! 📦',
                    message: 'Your item is now listed at a Reloop Point. You have 14 days to sell it.',
                    icon: 'place',
                    read: false,
                    createdAt: serverTimestamp()
                });
            });

            return { success: true, expiresAt };
        } catch (error) {
            console.error("Error dropping item at point:", error);
            return { success: false };
        }
    },

    async sendToRecycling(userId: string, itemTitle: string, zoneId: string): Promise<{ success: boolean; coinsAwarded: number; xpEarned: number }> {
        try {
            const coinsAwarded = 5;
            const xpEarned = 10;
            const co2PerRecycle = 0.5; // kg CO2 saved per recycled item

            await runTransaction(db, async (transaction) => {
                // Add coins, XP, and co2Saved to user
                const userRef = doc(db, "users", userId);
                const userDoc = await transaction.get(userRef);
                const currentCoins = userDoc.data()?.coins || 0;
                const currentXp = userDoc.data()?.xp || 0;
                const currentCo2 = userDoc.data()?.co2Saved || 0;
                transaction.update(userRef, {
                    coins: currentCoins + coinsAwarded,
                    xp: currentXp + xpEarned,
                    level: Math.max(userDoc.data()?.level || 1, levelFromXp(currentXp + xpEarned)),
                    co2Saved: currentCo2 + co2PerRecycle,
                    itemsRecycled: (userDoc.data()?.itemsRecycled || 0) + 1,
                    updatedAt: serverTimestamp()
                });

                // Create recycling record
                const recycleRef = doc(collection(db, "recyclingRecords"));
                transaction.set(recycleRef, {
                    userId,
                    itemTitle,
                    zoneId,
                    coinsAwarded,
                    xpEarned,
                    co2Saved: co2PerRecycle,
                    createdAt: serverTimestamp()
                });

                // Create notification
                const notifRef = doc(collection(db, "notifications"));
                transaction.set(notifRef, {
                    userId,
                    type: 'coin',
                    title: 'Recycling Complete! ♻️',
                    message: `You earned ${coinsAwarded} coins and saved ${co2PerRecycle}kg CO₂ for recycling.`,
                    icon: 'recycling',
                    read: false,
                    createdAt: serverTimestamp()
                });
            });

            return { success: true, coinsAwarded, xpEarned };
        } catch (error) {
            console.error("Error sending to recycling:", error);
            return { success: false, coinsAwarded: 0, xpEarned: 0 };
        }
    },


    // ===== DONATIONS =====
    /** Donate coins to a charity: balance drops and the donation is recorded, atomically. */
    async donateCoins(userId: string, charityId: string, charityName: string, amount: number): Promise<{ success: boolean; error?: string }> {
        try {
            const coins = Math.floor(amount);
            if (!Number.isFinite(coins) || coins <= 0) throw new Error('Enter a valid amount');
            await runTransaction(db, async (tx) => {
                const userRef = doc(db, "users", userId);
                const snap = await tx.get(userRef);
                const bal = snap.data()?.coins || 0;
                if (bal < coins) throw new Error('Not enough coins');
                tx.update(userRef, {
                    coins: bal - coins,
                    donationsMade: (snap.data()?.donationsMade || 0) + 1,
                    updatedAt: serverTimestamp()
                });
                tx.set(doc(collection(db, "donations")), {
                    userId, charityId, charityName, amount: coins, createdAt: serverTimestamp()
                });
                tx.set(doc(collection(db, "coinTransactions")), {
                    userId, byUid: userId, amount: -coins, reason: `Donation to ${charityName}`,
                    refId: charityId, createdAt: serverTimestamp()
                });
            });
            return { success: true };
        } catch (error: any) {
            console.error("Error donating coins:", error);
            return { success: false, error: error.message };
        }
    },

    // ===== LEADERBOARD =====
    async getLeaderboard(limitCount: number = 50): Promise<any[]> {
        try {
            const q = query(
                collection(db, "users"),
                orderBy("co2Saved", "desc"),
                limit(limitCount)
            );
            const snapshot = await getDocs(q);
            if (snapshot.empty) return [];

            return snapshot.docs.map((doc, index) => ({
                rank: index + 1,
                uid: doc.id,
                name: doc.data().name || 'Anonymous',
                avatar: doc.data().avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.data().name || 'User')}`,
                xp: doc.data().xp || 0,
                co2Saved: doc.data().co2Saved || 0,
                level: doc.data().level || 1
            }));
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
            return [];
        }
    },

    async getUserRank(userId: string): Promise<{ rank: number; total: number; percentile: number } | null> {
        try {
            // Get all users ordered by CO2 Saved
            const q = query(collection(db, "users"), orderBy("co2Saved", "desc"));
            const snapshot = await getDocs(q);

            const users = snapshot.docs.map(doc => doc.id);
            const rank = users.indexOf(userId) + 1;
            const total = users.length;
            const percentile = total > 0 ? Math.round(((total - rank) / total) * 100) : 0;

            return { rank: rank > 0 ? rank : total, total, percentile };
        } catch (error) {
            console.error("Error getting user rank:", error);
            return null;
        }
    },

    // ===== MISSIONS (Daily reset, XP only) =====

    // Get today's date string for identifying daily missions
    getTodayString(): string {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    },

    // Daily mission templates (XP rewards only - no coins)
    getDailyMissionTemplates(): Array<{
        id: string;
        title: string;
        description: string;
        icon: string;
        xpReward: number;
        target: number;
        type: 'daily';
        trackingKey: string;
    }> {
        return [
            { id: 'daily-scan', title: 'Scan 3 Items', description: 'Use the scanner to identify 3 items', icon: 'qr_code_scanner', xpReward: 30, target: 3, type: 'daily', trackingKey: 'scansToday' },
            { id: 'daily-trade', title: 'Complete a Trade', description: 'Buy or sell an item on marketplace', icon: 'swap_horiz', xpReward: 50, target: 1, type: 'daily', trackingKey: 'tradesToday' },
            { id: 'daily-bag', title: 'Fill a Smart Bag', description: 'Fill and mark a smart bag as ready', icon: 'shopping_bag', xpReward: 40, target: 1, type: 'daily', trackingKey: 'bagsFilledToday' },
            { id: 'daily-login', title: 'Daily Check-in', description: 'Log in to the app today', icon: 'login', xpReward: 10, target: 1, type: 'daily', trackingKey: 'loginToday' },
        ];
    },

    // Get or create user's daily missions (auto-resets each day)
    async getDailyMissions(userId: string): Promise<Array<{
        id: string;
        title: string;
        description: string;
        icon: string;
        xpReward: number;
        progress: number;
        target: number;
        completed: boolean;
        claimed: boolean;
        type: 'daily';
    }>> {
        try {
            const today = this.getTodayString();
            const userMissionsRef = doc(db, "userDailyMissions", `${userId}_${today}`);
            const userMissionsSnap = await getDoc(userMissionsRef);

            const templates = this.getDailyMissionTemplates();

            if (userMissionsSnap.exists()) {
                const data = userMissionsSnap.data();
                return templates.map(t => ({
                    ...t,
                    progress: data.missions?.[t.id]?.progress || 0,
                    completed: data.missions?.[t.id]?.completed || false,
                    claimed: data.missions?.[t.id]?.claimed || false,
                }));
            }

            // Create new daily missions for today
            const missionsData: Record<string, { progress: number; completed: boolean; claimed: boolean }> = {};
            templates.forEach(t => {
                missionsData[t.id] = { progress: 0, completed: false, claimed: false };
            });

            // Auto-complete login mission
            missionsData['daily-login'] = { progress: 1, completed: true, claimed: false };

            await setDoc(userMissionsRef, {
                userId,
                date: today,
                missions: missionsData,
                createdAt: serverTimestamp(),
            });

            return templates.map(t => ({
                ...t,
                progress: missionsData[t.id].progress,
                completed: missionsData[t.id].completed,
                claimed: missionsData[t.id].claimed,
            }));
        } catch (error) {
            console.error("Error fetching daily missions:", error);
            return [];
        }
    },

    // Update mission progress (call when user scans, trades, fills bag, etc.)
    async updateDailyMissionProgress(userId: string, trackingKey: string, amount: number = 1): Promise<boolean> {
        try {
            const today = this.getTodayString();
            const userMissionsRef = doc(db, "userDailyMissions", `${userId}_${today}`);
            const userMissionsSnap = await getDoc(userMissionsRef);

            if (!userMissionsSnap.exists()) {
                // Initialize missions first
                await this.getDailyMissions(userId);
            }

            const templates = this.getDailyMissionTemplates();
            const matchingMission = templates.find(t => t.trackingKey === trackingKey);

            if (!matchingMission) return false;

            const currentData = (await getDoc(userMissionsRef)).data();
            const currentProgress = currentData?.missions?.[matchingMission.id]?.progress || 0;
            const newProgress = Math.min(currentProgress + amount, matchingMission.target);
            const completed = newProgress >= matchingMission.target;

            await updateDoc(userMissionsRef, {
                [`missions.${matchingMission.id}.progress`]: newProgress,
                [`missions.${matchingMission.id}.completed`]: completed,
                updatedAt: serverTimestamp(),
            });

            return completed;
        } catch (error) {
            console.error("Error updating mission progress:", error);
            return false;
        }
    },

    // Claim XP reward for completed mission (no coins)
    async claimDailyMissionReward(userId: string, missionId: string): Promise<{ success: boolean; xp: number }> {
        try {
            const today = this.getTodayString();
            const userMissionsRef = doc(db, "userDailyMissions", `${userId}_${today}`);
            const userMissionsSnap = await getDoc(userMissionsRef);

            if (!userMissionsSnap.exists()) {
                return { success: false, xp: 0 };
            }

            const data = userMissionsSnap.data();
            const missionData = data.missions?.[missionId];

            if (!missionData?.completed || missionData?.claimed) {
                return { success: false, xp: 0 };
            }

            const templates = this.getDailyMissionTemplates();
            const template = templates.find(t => t.id === missionId);

            if (!template) {
                return { success: false, xp: 0 };
            }

            const xpReward = template.xpReward;

            await runTransaction(db, async (transaction) => {
                // Mark mission as claimed
                transaction.update(userMissionsRef, {
                    [`missions.${missionId}.claimed`]: true,
                    [`missions.${missionId}.claimedAt`]: serverTimestamp(),
                });

                // Add XP to user (no coins)
                const userRef = doc(db, "users", userId);
                const userDoc = await transaction.get(userRef);
                const userData = userDoc.data() || {};
                const currentXp = userData.xp || 0;
                const newXp = currentXp + xpReward;
                const newLevel = Math.max(userData.level || 1, levelFromXp(newXp));

                transaction.update(userRef, {
                    xp: newXp,
                    level: newLevel,
                });
            });

            return { success: true, xp: xpReward };
        } catch (error) {
            console.error("Error claiming mission reward:", error);
            return { success: false, xp: 0 };
        }
    },

    // Legacy functions for backward compatibility
    async getUserMissions(userId: string): Promise<any[]> {
        return this.getDailyMissions(userId);
    },

    async getActiveMissions(): Promise<any[]> {
        return this.getDailyMissionTemplates();
    },

    async updateMissionProgress(userId: string, missionId: string, progress: number): Promise<boolean> {
        // Map old missionId format to new trackingKey
        const trackingKeyMap: Record<string, string> = {
            'scan': 'scansToday',
            'trade': 'tradesToday',
            'bag': 'bagsFilledToday',
            'login': 'loginToday',
        };
        const trackingKey = trackingKeyMap[missionId] || missionId;
        return this.updateDailyMissionProgress(userId, trackingKey, progress);
    },

    async claimMissionReward(userId: string, missionId: string): Promise<{ success: boolean; xp: number; coins: number }> {
        const result = await this.claimDailyMissionReward(userId, missionId);
        return { ...result, coins: 0 }; // No coins from missions
    }
};
