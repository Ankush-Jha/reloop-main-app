// API Client - wraps DBService for marketplace operations
import { DBService } from './firebase/db';
import { Listing } from '@/types';

export const ApiClient = {
    listings: {
        create: async (data: Omit<Listing, 'id' | 'createdAt'>) => {
            // Ensure seller info is provided
            if (!data.seller || !data.seller.id) {
                throw new Error('Seller information is required');
            }
            return DBService.createListing(data);
        },
        getAll: DBService.getListings.bind(DBService),
        getById: DBService.getListingById.bind(DBService),
        getUserListings: DBService.getUserListings.bind(DBService),
        delete: async (listingId: string, userId: string) => {
            return DBService.deleteListing(listingId, userId);
        },
        updateStatus: DBService.updateListingStatus.bind(DBService),
    }
};

export default ApiClient;
