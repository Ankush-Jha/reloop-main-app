import {
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail as firebaseSendPasswordResetEmail,
    updateProfile,
    User as FirebaseUser
} from "firebase/auth";
import { auth } from "./client";
import { DBService } from "./db";
import { isAllowedEduEmail, getAllowedDomainsMessage } from "@/lib/utils/auth-helpers";

export class EduEmailError extends Error {
    constructor(email: string) {
        super(`Only institutional emails allowed (${getAllowedDomainsMessage()}). You tried to sign in with: ${email}`);
        this.name = 'EduEmailError';
    }
}

export const AuthService = {
    /**
     * Sign in with Google - only allows edu emails
     * Validates that the Google account email is from allowed domain
     */
    async signInWithGoogle() {
        const provider = new GoogleAuthProvider();
        // Hint to use institutional account
        provider.setCustomParameters({
            hd: 'nst.rishihood.edu.in', // Hosted domain hint
            prompt: 'select_account'
        });

        const result = await signInWithPopup(auth, provider);
        const email = result.user.email || '';

        // Validate edu email
        if (!isAllowedEduEmail(email)) {
            // Sign out immediately if not edu email
            await firebaseSignOut(auth);
            throw new EduEmailError(email);
        }

        // Check if user profile exists
        const existingProfile = await DBService.getUserProfile(result.user.uid);

        if (!existingProfile) {
            // Create new user profile with 100 coins welcome bonus
            await DBService.createUserProfile({
                uid: result.user.uid,
                name: result.user.displayName || 'User',
                email: email,
                avatar: result.user.photoURL || '',
                level: 1,
                coins: 100, // Welcome bonus
                xp: 0,
                levelTitle: 'Seedling',
                itemsTraded: 0,
                co2Saved: 0,
                badges: ['newcomer']
            });
        }

        return result.user;
    },

    /**
     * Sign in with email/password
     */
    async signInWithEmail(email: string, password: string) {
        // Validate edu email before attempting sign in
        if (!isAllowedEduEmail(email)) {
            throw new EduEmailError(email);
        }
        return signInWithEmailAndPassword(auth, email, password);
    },

    /**
     * Register with email/password
     */
    async registerWithEmail(email: string, password: string, name: string, hostel?: string, room?: string) {
        // Validate edu email before registration
        if (!isAllowedEduEmail(email)) {
            throw new EduEmailError(email);
        }

        const result = await createUserWithEmailAndPassword(auth, email, password);

        // Update Auth Profile
        await updateProfile(result.user, {
            displayName: name,
            photoURL: `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(name)}`
        });

        // Create Firestore Profile
        await DBService.createUserProfile({
            uid: result.user.uid,
            name: name,
            email: email,
            avatar: result.user.photoURL || '',
            hostel: hostel,
            room: room,
            level: 1,
            coins: 100, // Welcome bonus
            xp: 0,
            levelTitle: 'Seedling',
            itemsTraded: 0,
            co2Saved: 0,
            badges: ['newcomer']
        });

        return result.user;
    },

    async logout() {
        await firebaseSignOut(auth);
    },

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email: string) {
        if (!isAllowedEduEmail(email)) {
            throw new EduEmailError(email);
        }
        await firebaseSendPasswordResetEmail(auth, email);
    }
};
