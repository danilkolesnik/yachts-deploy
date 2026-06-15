import { computeOfferTotals, formatEuroAmount } from '@/utils/offerLineItems';

export default function OfferTotalsSummary({ offer }) {
    if (!offer) return null;

    const totals = computeOfferTotals(offer);
    const hasServices = Array.isArray(offer.services)
        ? offer.services.length > 0
        : Boolean(offer.services);
    const hasParts = Array.isArray(offer.parts) && offer.parts.length > 0;

    if (!hasServices && !hasParts) return null;

    const rows = [
        { label: 'Amount / IZNOS', value: totals.grossAmount },
        { label: 'Discount / rabat', value: totals.discountAmount },
        { label: 'Subtotal / UKUPNO', value: totals.subtotalAfterDiscount },
        { label: 'VAT (25%) / PDV (25%)', value: totals.vatAmount },
    ];

    return (
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h2 className="text-2xl font-bold mb-4 text-black">Summary</h2>
            <div className="max-w-md ml-auto border border-gray-300 text-sm">
                {rows.map((row) => (
                    <div
                        key={row.label}
                        className="flex justify-between border-b border-gray-300 last:border-b-0"
                    >
                        <span className="px-4 py-2 text-gray-800 border-r border-gray-300 flex-1">
                            {row.label}
                        </span>
                        <span className="px-4 py-2 text-black text-right flex-1 font-medium">
                            {formatEuroAmount(row.value)} €
                        </span>
                    </div>
                ))}
                <div className="flex justify-between border-t-2 border-gray-800 bg-white font-semibold">
                    <span className="px-4 py-3 text-gray-900 border-r border-gray-300 flex-1">
                        Total amount / SVEUKUPNI IZNOS
                    </span>
                    <span className="px-4 py-3 text-black text-right flex-1">
                        {formatEuroAmount(totals.grandTotal)} €
                    </span>
                </div>
            </div>
        </div>
    );
}
