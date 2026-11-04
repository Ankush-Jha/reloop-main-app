import { redirect } from 'next/navigation';

// The old standalone trade-request page only worked on demo data. Offers are made from the
// listing page (TradeOfferModal -> DBService.makeOffer), so send everyone there.
export default async function TradeRedirect({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    redirect(`/marketplace/${id}`);
}
