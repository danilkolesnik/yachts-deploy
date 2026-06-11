import {
    formatEuroAmount,
    getPartLineTotal,
    getPartUnitPrice,
    getServiceLineTotal,
    getServiceUnitPrice,
    normalizeOfferPart,
    normalizeOfferService,
} from '@/utils/offerLineItems';

export default function OfferLineItemsFields({ services = [], parts = [], onServicesChange, onPartsChange }) {
    const normalizedServices = (services || []).map(normalizeOfferService);
    const normalizedParts = (parts || []).map(normalizeOfferPart);

    const updateServiceQuantity = (index, rawValue) => {
        const quantity = Math.max(1, Number(rawValue) || 1);
        const next = [...(services || [])];
        const current = next[index]?.value ?? next[index] ?? {};
        next[index] = { ...current, quantity };
        onServicesChange(next);
    };

    const updatePartQuantity = (index, rawValue) => {
        const quantity = Math.max(1, Number(rawValue) || 1);
        const next = [...(parts || [])];
        next[index] = { ...next[index], quantity };
        onPartsChange(next);
    };

    if (normalizedServices.length === 0 && normalizedParts.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            {normalizedServices.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Service quantities</h4>
                    <div className="overflow-x-auto border rounded">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-3 py-2 text-left text-gray-800">Service</th>
                                    <th className="px-3 py-2 text-left text-gray-800 w-24">Qty</th>
                                    <th className="px-3 py-2 text-left text-gray-800">Unit price (€)</th>
                                    <th className="px-3 py-2 text-left text-gray-800">Total (€)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {normalizedServices.map((service, index) => (
                                    <tr key={`${service.serviceName}-${index}`} className="border-t">
                                        <td className="px-3 py-2 text-black">{service.serviceName}</td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={service.quantity}
                                                onChange={(e) => updateServiceQuantity(index, e.target.value)}
                                                className="w-full border rounded px-2 py-1 text-black"
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-black">
                                            {formatEuroAmount(getServiceUnitPrice(services[index]))}
                                        </td>
                                        <td className="px-3 py-2 text-black font-medium">
                                            {formatEuroAmount(getServiceLineTotal(services[index]))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {normalizedParts.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Part quantities</h4>
                    <div className="overflow-x-auto border rounded">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-3 py-2 text-left text-gray-800">Part</th>
                                    <th className="px-3 py-2 text-left text-gray-800 w-24">Qty</th>
                                    <th className="px-3 py-2 text-left text-gray-800">Unit price (€)</th>
                                    <th className="px-3 py-2 text-left text-gray-800">Total (€)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {normalizedParts.map((part, index) => (
                                    <tr key={`${part.label}-${index}`} className="border-t">
                                        <td className="px-3 py-2 text-black">{part.label}</td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={part.quantity}
                                                onChange={(e) => updatePartQuantity(index, e.target.value)}
                                                className="w-full border rounded px-2 py-1 text-black"
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-black">
                                            {formatEuroAmount(getPartUnitPrice(parts[index]))}
                                        </td>
                                        <td className="px-3 py-2 text-black font-medium">
                                            {formatEuroAmount(getPartLineTotal(parts[index]))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
