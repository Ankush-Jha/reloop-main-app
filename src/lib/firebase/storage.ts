import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./client";

export const StorageService = {
    async uploadImage(file: File, path: string): Promise<string> {
        try {
            // Create a unique filename if needed, or rely on path
            const storageRef = ref(storage, path);
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);
            return url;
        } catch (error) {
            console.error("Error uploading image:", error);
            throw error;
        }
    },

    async uploadListingImages(files: File[], listingId: string): Promise<string[]> {
        const uploadPromises = files.map((file, index) => {
            // e.g. listings/123xyz/image_0.png
            const extension = file.name.split('.').pop();
            const path = `listings/${listingId}/image_${index}.${extension}`;
            return this.uploadImage(file, path);
        });
        return Promise.all(uploadPromises);
    }
};
