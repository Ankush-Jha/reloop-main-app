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
    Unsubscribe,
    runTransaction
} from "firebase/firestore";
import { db } from "./client";
import { Listing, User, Trade } from "@/types";

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

    async addCoinsToUser(uid: string, amount: number, reason: string): Promise<void> {
        await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "users", uid);
            const userDoc = await transaction.get(userRef);
            const currentCoins = userDoc.data()?.coins || 0;

            transaction.update(userRef, {
                coins: currentCoins + amount
            });

            // Log coin transaction
            const logRef = doc(collection(db, "coinTransactions"));
            transaction.set(logRef, {
                userId: uid,
                amount,
                reason,
                balanceAfter: currentCoins + amount,
                createdAt: serverTimestamp()
            });
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
    async createSmartBag(data: { qrCode: string; userId: string; ownerName?: string }): Promise<string> {
        // Check if QR already registered
        const existing = await getDocs(
            query(collection(db, 'smartBags'), where('qrCode', '==', data.qrCode))
        );
        if (!existing.empty) {
            throw new Error('This bag is already registered');
        }

        const newRef = doc(collection(db, 'smartBags'));
        await setDoc(newRef, {
            id: newRef.id,
            qrCode: data.qrCode,
            ownerId: data.userId,
            ownerName: data.ownerName || 'Unknown',
            status: 'registered',
            registeredAt: serverTimestamp()
        });
        return newRef.id;
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

    async updateSmartBagStatus(bagId: string, status: string, extraData?: Record<string, any>): Promise<void> {
        await updateDoc(doc(db, 'smartBags', bagId), {
            status,
            [`${status}At`]: serverTimestamp(),
            ...extraData
        });
    },

    async getSmartBagById(bagId: string): Promise<any | null> {
        const docSnap = await getDoc(doc(db, 'smartBags', bagId));
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    },

    async getSmartBagByQR(qrCode: string): Promise<any | null> {
        const q = query(collection(db, 'smartBags'), where('qrCode', '==', qrCode));
        const snapshot = await getDocs(q);
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
            await setDoc(newRef, {
                ...listingData,
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
            // Filter out sold items client-side
            return allListings.filter(listing => listing.status !== 'sold');
        } catch (error) {
            console.error("Error fetching listings:", error);
            return [];
        }
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

    async updateListingStatus(listingId: string, status: 'available' | 'sold' | 'pending'): Promise<boolean> {
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
        offerAmount?: number
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
            if (messageType === 'offer' && offerAmount) {
                messageData.offerAmount = offerAmount;
                messageData.offerStatus = 'pending';
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

            return docRef.id;
        } catch (error) {
            console.error("Error sending message:", error);
            throw error;
        }
    },

    // Send an offer message in chat
    async sendOffer(conversationId: string, senderId: string, amount: number, listingTitle?: string) {
        const text = `I'd like to offer ${amount} coins${listingTitle ? ` for "${listingTitle}"` : ''}. Let me know if that works!`;
        return await this.sendMessage(conversationId, senderId, text, 'offer', amount);
    },

    // Update offer status (accept/decline/counter)
    async updateOfferStatus(
        conversationId: string,
        messageId: string,
        status: 'accepted' | 'declined' | 'countered',
        counterAmount?: number,
        offerAmount?: number,
        listingId?: string,
        listingTitle?: string,
        sellerId?: string,
        buyerId?: string
    ) {
        try {
            const messageRef = doc(db, "conversations", conversationId, "messages", messageId);
            const updateData: any = { offerStatus: status };
            if (status === 'countered' && counterAmount) {
                updateData.counterAmount = counterAmount;
            }
            await updateDoc(messageRef, updateData);

            // Add system message about the status change
            const statusMessages = {
                accepted: '✅ Offer accepted! Deal confirmed.',
                declined: '❌ Offer declined.',
                countered: `🔄 Counter offer: ${counterAmount} coins`,
            };
            await this.sendMessage(conversationId, 'system', statusMessages[status], 'system');

            // If accepted, update conversation deal status and send QR to buyer
            if (status === 'accepted') {
                const convRef = doc(db, "conversations", conversationId);
                const amount = offerAmount || counterAmount || 0;

                // Generate trade ID for this transaction
                const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                await updateDoc(convRef, {
                    dealStatus: 'agreed',
                    agreedAmount: amount,
                    tradeId: tradeId,
                });

                // Send QR code message to the buyer
                if (listingId && buyerId) {
                    await this.sendQRMessage(conversationId, {
                        type: 'pickup',
                        tradeId,
                        listingId,
                        listingTitle: listingTitle || 'Item',
                        sellerId: sellerId || '',
                        buyerId,
                        amount,
                    });
                }
            }
        } catch (error) {
            console.error("Error updating offer status:", error);
            throw error;
        }
    },

    // Send a QR code message in chat
    async sendQRMessage(
        conversationId: string,
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
                senderId: 'system',
                type: 'qr',
                qrType: qrData.type,
                qrData: {
                    ...qrData,
                    createdAt: new Date().toISOString(),
                },
                text: qrData.type === 'pickup'
                    ? `🎉 Show this QR at the ReLoop Zone to pick up "${qrData.listingTitle}"`
                    : `📦 Show this QR to drop off "${qrData.listingTitle}"`,
                timestamp: serverTimestamp(),
                read: false,
            });

            // Update last message
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
    async createTrade(tradeData: Omit<Trade, 'id' | 'createdAt'>): Promise<string> {
        try {
            // Updated to single-write pattern
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
            // Get trades where user is seller
            const sellerQuery = query(
                collection(db, "trades"),
                where("sellerId", "==", userId),
                orderBy("createdAt", "desc")
            );
            const sellerSnapshot = await getDocs(sellerQuery);

            // Get trades where user is trader (buyer)
            const traderQuery = query(
                collection(db, "trades"),
                where("traderId", "==", userId),
                orderBy("createdAt", "desc")
            );
            const traderSnapshot = await getDocs(traderQuery);

            const allTrades = [
                ...sellerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trade)),
                ...traderSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trade))
            ];

            // Sort by createdAt descending
            return allTrades.sort((a, b) => {
                const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
                const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
                return bTime - aTime;
            });
        } catch (error) {
            console.error("Error fetching trades:", error);
            return [];
        }
    },

    async updateTradeStatus(
        tradeId: string,
        status: 'accepted' | 'declined' | 'completed',
        additionalData?: Record<string, any>
    ) {
        try {
            const tradeRef = doc(db, "trades", tradeId);
            await updateDoc(tradeRef, {
                status,
                ...(status === 'completed' ? { completedAt: serverTimestamp() } : {}),
                ...additionalData
            });
        } catch (error) {
            console.error("Error updating trade status:", error);
            throw error;
        }
    },

    // COIN TRANSFER (Atomic Transaction)
    async transferCoins(fromUserId: string, toUserId: string, amount: number) {
        try {
            await runTransaction(db, async (transaction) => {
                const fromUserRef = doc(db, "users", fromUserId);
                const toUserRef = doc(db, "users", toUserId);

                const fromUserDoc = await transaction.get(fromUserRef);
                const toUserDoc = await transaction.get(toUserRef);

                if (!fromUserDoc.exists() || !toUserDoc.exists()) {
                    throw new Error("One or both users not found");
                }

                const fromUserData = fromUserDoc.data() as User;
                const toUserData = toUserDoc.data() as User;

                const currentFromBalance = fromUserData.coins || 0;

                if (currentFromBalance < amount) {
                    throw new Error("Insufficient coins");
                }

                const newFromBalance = currentFromBalance - amount;
                const newToBalance = (toUserData.coins || 0) + amount;

                transaction.update(fromUserRef, { coins: newFromBalance });
                transaction.update(toUserRef, { coins: newToBalance });
            });

            return { success: true };
        } catch (error) {
            console.error("Error transferring coins:", error);
            throw error;
        }
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
            const q = query(collection(db, "rewards"), where("available", "==", true));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching rewards:", error);
            return [];
        }
    },

    async redeemReward(userId: string, rewardId: string, cost: number): Promise<{ success: boolean; redemptionId?: string; error?: string }> {
        try {
            let redemptionId = '';

            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, "users", userId);
                const userDoc = await transaction.get(userRef);
                const currentCoins = userDoc.data()?.coins || 0;

                if (currentCoins < cost) {
                    throw new Error('Not enough coins');
                }

                // Deduct coins
                transaction.update(userRef, { coins: currentCoins - cost });

                // Create redemption record
                const redemptionRef = doc(collection(db, "redemptions"));
                redemptionId = redemptionRef.id;
                transaction.set(redemptionRef, {
                    userId,
                    rewardId,
                    cost,
                    status: 'pending',
                    code: `RL-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                    redeemedAt: serverTimestamp()
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

            return { success: true, redemptionId };
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
    async createScan(userId: string, scanResult: any): Promise<string> {
        try {
            const docRef = await addDoc(collection(db, "scans"), {
                userId,
                item: scanResult.item,
                classification: scanResult.classification,
                xpEarned: scanResult.xpEarned || 0,
                claimed: false,
                scannedAt: serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error creating scan:", error);
            throw error;
        }
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

    async claimScanCoins(userId: string, scanId: string, coins: number): Promise<boolean> {
        try {
            await runTransaction(db, async (transaction) => {
                const scanRef = doc(db, "scans", scanId);
                const scanDoc = await transaction.get(scanRef);

                if (!scanDoc.exists() || scanDoc.data()?.claimed) {
                    throw new Error('Scan already claimed or not found');
                }

                const userRef = doc(db, "users", userId);
                const userDoc = await transaction.get(userRef);
                const currentCoins = userDoc.data()?.coins || 0;

                transaction.update(scanRef, { claimed: true, claimedAt: serverTimestamp() });
                transaction.update(userRef, { coins: currentCoins + coins });
            });
            return true;
        } catch (error) {
            console.error("Error claiming scan coins:", error);
            return false;
        }
    },

    // EXPIRED LISTINGS
    async getExpiredListings(userId: string): Promise<any[]> {
        try {
            // Get listings older than 14 days that are still 'available'
            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

            const q = query(
                collection(db, "listings"),
                where("seller.id", "==", userId),
                where("status", "==", "available")
            );
            const snapshot = await getDocs(q);

            // Filter by date client-side (Firestore doesn't support compound queries well)
            return snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(listing => {
                    const data = listing as any;
                    const createdAt = data.createdAt?.toDate?.() || new Date();
                    return createdAt < fourteenDaysAgo;
                });
        } catch (error) {
            console.error("Error fetching expired listings:", error);
            return [];
        }
    },

    async handleEquityChoice(userId: string, listingId: string, choice: 'recycle' | 'donate'): Promise<{ success: boolean; coinsAwarded: number }> {
        try {
            const listing = await this.getListingById(listingId);
            if (!listing) {
                throw new Error('Listing not found');
            }

            const baseCoins = Math.floor(listing.price * 0.1);
            const bonusCoins = choice === 'donate' ? 10 : 0;
            const totalCoins = baseCoins + bonusCoins;

            await runTransaction(db, async (transaction) => {
                // Update listing status
                const listingRef = doc(db, "listings", listingId);
                transaction.update(listingRef, {
                    status: choice === 'donate' ? 'donated' : 'recycled',
                    equityProcessedAt: serverTimestamp()
                });

                // Add coins to user
                const userRef = doc(db, "users", userId);
                const userDoc = await transaction.get(userRef);
                const currentCoins = userDoc.data()?.coins || 0;
                transaction.update(userRef, { coins: currentCoins + totalCoins });

                // Create notification
                const notifRef = doc(collection(db, "notifications"));
                transaction.set(notifRef, {
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
            const q = query(collection(db, "reloopPoints"), where("active", "==", true));
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
            const q = query(collection(db, "recycleZones"), where("active", "==", true));
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

            await runTransaction(db, async (transaction) => {
                // Add coins to user
                const userRef = doc(db, "users", userId);
                const userDoc = await transaction.get(userRef);
                const currentCoins = userDoc.data()?.coins || 0;
                const currentXp = userDoc.data()?.xp || 0;
                transaction.update(userRef, {
                    coins: currentCoins + coinsAwarded,
                    xp: currentXp + xpEarned
                });

                // Create recycling record
                const recycleRef = doc(collection(db, "recyclingRecords"));
                transaction.set(recycleRef, {
                    userId,
                    itemTitle,
                    zoneId,
                    coinsAwarded,
                    xpEarned,
                    createdAt: serverTimestamp()
                });

                // Create notification
                const notifRef = doc(collection(db, "notifications"));
                transaction.set(notifRef, {
                    userId,
                    type: 'coin',
                    title: 'Recycling Complete! ♻️',
                    message: `You earned ${coinsAwarded} coins and ${xpEarned} XP for recycling.`,
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
    async updateDailyMissionProgress(userId: string, trackingKey: string, increment: number = 1): Promise<boolean> {
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
            const newProgress = Math.min(currentProgress + increment, matchingMission.target);
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
                const newLevel = Math.floor(newXp / 100) + 1;

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
