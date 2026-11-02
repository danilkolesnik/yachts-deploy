import { useState } from 'react';
import {
    createLineKey,
    duplicateOfferPartLine,
    duplicateOfferServiceLine,
    formatEuroAmount,
    getPartLineTotal,
    getPartUnitPrice,
    getServiceLineTotal,
    getServiceUnitPrice,
    getSparePartHighlightStyle,
    normalizeOfferPart,
    normalizeOfferService,
} from '@/utils/offerLineItems';
import {
    getLineDescription,
    syncLineDescriptions,
} from '@/utils/translateText';

export default function OfferLineItemsFields({
    services = [],
    parts = [],
    onServicesChange,
    onPartsChange,
    language = 'en',
}) {
    const normalizedServices = (services || []).map(normalizeOfferService);
    const normalizedParts = (parts || []).map(normalizeOfferPart);
    const [translatingKey, setTranslatingKey] = useState(null);

    const updateServiceField = (index, patch) => {
        const next = [...(services || [])];
        const current = next[index]?.value ?? next[index] ?? {};
        next[index] = { ...current, ...patch, lineKey: current.lineKey || createLineKey() };
        onServicesChange(next);
    };

    const updatePartField = (index, patch) => {
        const next = [...(parts || [])];
        next[index] = {
            ...next[index],
            ...patch,
            lineKey: next[index]?.lineKey || createLineKey(),
        };
        onPartsChange(next);
    };

    const handleServiceDescriptionBlur = async (index, rawText) => {
        const current = services[index]?.value ?? services[index] ?? {};
        const lineKey = current.lineKey || normalizedServices[index]?.lineKey || createLineKey();
        setTranslatingKey(`service-${lineKey}`);
        try {
            const synced = await syncLineDescriptions(current, language, rawText);
            updateServiceField(index, synced);
        } finally {
            setTranslatingKey(null);
        }
    };

    const handlePartDescriptionBlur = async (index, rawText) => {
        const current = parts[index] || {};
        const lineKey = current.lineKey || normalizedParts[index]?.lineKey || createLineKey();
        setTranslatingKey(`part-${lineKey}`);
        try {
            const synced = await syncLineDescriptions(current, language, rawText);
            updatePartField(index, synced);
        } finally {
            setTranslatingKey(null);
        }
    };

    if (normalizedServices.length === 0 && normalizedParts.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            {normalizedServices.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Service quantities</h4>
                    <p className="text-xs text-gray-500 mb-2">
                        Add a work description per line. It is entered once and auto-translated for the offer language (EN/HR).
                    </p>
                    <div className="overflow-x-auto border rounded">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-3 py-2 text-left text-gray-800">Service</th>
                                    <th className="px-3 py-2 text-left text-gray-800 min-w-[220px]">Description</th>
                                    <th className="px-3 py-2 text-left text-gray-800 w-24">Qty</th>
                                    <th className="px-3 py-2 text-left text-gray-800">Unit price (€)</th>
                                    <th className="px-3 py-2 text-left text-gray-800">Total (€)</th>
                                    <th className="px-3 py-2 text-left text-gray-800 w-28">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {normalizedServices.map((service, index) => {
                                    const lineKey = service.lineKey || `service-${index}`;
                                    const description = getLineDescription(service, language);
                                    const busy = translatingKey === `service-${lineKey}`;
                                    return (
                                        <tr key={lineKey} className="border-t align-top">
                                            <td className="px-3 py-2 text-black">
                                                {service.serviceCode ? (
                                                    <div className="text-xs text-gray-500 font-mono">
                                                        [{service.serviceCode}]
                                                    </div>
                                                ) : null}
                                                {language === 'hr' && service.serviceNameHr
                                                    ? service.serviceNameHr
                                                    : service.serviceName}
                                            </td>
                                            <td className="px-3 py-2">
                                                <textarea
                                                    rows={2}
                                                    defaultValue={description}
                                                    key={`${lineKey}-${language}-${description}`}
                                                    onBlur={(e) =>
                                                        handleServiceDescriptionBlur(index, e.target.value)
                                                    }
                                                    placeholder="Work description (auto-translated)…"
                                                    className="w-full border rounded px-2 py-1 text-black"
                                                    disabled={busy}
                                                />
                                                {busy ? (
                                                    <span className="text-xs text-gray-500">Translating…</span>
                                                ) : null}
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={service.quantity}
                                                    onChange={(e) =>
                                                        updateServiceField(index, {
                                                            quantity: Math.max(1, Number(e.target.value) || 1),
                                                        })
                                                    }
                                                    className="w-full border rounded px-2 py-1 text-black"
                                                />
                                            </td>
                                            <td className="px-3 py-2 text-black">
                                                {formatEuroAmount(getServiceUnitPrice(services[index]))}
                                            </td>
                                            <td className="px-3 py-2 text-black font-medium">
                                                {formatEuroAmount(getServiceLineTotal(services[index]))}
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex flex-col gap-1">
                                                    <button
                                                        type="button"
                                                        className="text-xs text-blue-600 hover:underline text-left"
                                                        onClick={() =>
                                                            onServicesChange([
                                                                ...(services || []),
                                                                duplicateOfferServiceLine(services[index]),
                                                            ])
                                                        }
                                                    >
                                                        Duplicate
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="text-xs text-red-600 hover:underline text-left"
                                                        onClick={() =>
                                                            onServicesChange(
                                                                (services || []).filter((_, i) => i !== index),
                                                            )
                                                        }
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {normalizedParts.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Part quantities</h4>
                    <p className="text-xs text-gray-500 mb-2">
                        Optional note per part/material. Entered once, auto-translated for EN/HR.
                    </p>
                    <div className="overflow-x-auto border rounded">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-3 py-2 text-left text-gray-800">Part</th>
                                    <th className="px-3 py-2 text-left text-gray-800 min-w-[220px]">Description</th>
                                    <th className="px-3 py-2 text-left text-gray-800 w-24">Qty</th>
                                    <th className="px-3 py-2 text-left text-gray-800">Unit price (€)</th>
                                    <th className="px-3 py-2 text-left text-gray-800">Total (€)</th>
                                    <th className="px-3 py-2 text-left text-gray-800 w-28">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {normalizedParts.map((part, index) => {
                                    const highlightStyle = getSparePartHighlightStyle(part);
                                    const lineKey = part.lineKey || `part-${index}`;
                                    const description = getLineDescription(part, language);
                                    const busy = translatingKey === `part-${lineKey}`;
                                    return (
                                        <tr key={lineKey} className="border-t align-top">
                                            <td className="px-3 py-2" style={highlightStyle}>
                                                {part.label}
                                            </td>
                                            <td className="px-3 py-2">
                                                <textarea
                                                    rows={2}
                                                    defaultValue={description}
                                                    key={`${lineKey}-${language}-${description}`}
                                                    onBlur={(e) =>
                                                        handlePartDescriptionBlur(index, e.target.value)
                                                    }
                                                    placeholder="Material note (auto-translated)…"
                                                    className="w-full border rounded px-2 py-1 text-black"
                                                    disabled={busy}
                                                />
                                                {busy ? (
                                                    <span className="text-xs text-gray-500">Translating…</span>
                                                ) : null}
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={part.quantity}
                                                    onChange={(e) =>
                                                        updatePartField(index, {
                                                            quantity: Math.max(1, Number(e.target.value) || 1),
                                                        })
                                                    }
                                                    className="w-full border rounded px-2 py-1 text-black"
                                                />
                                            </td>
                                            <td className="px-3 py-2" style={highlightStyle}>
                                                {formatEuroAmount(getPartUnitPrice(parts[index]))}
                                            </td>
                                            <td className="px-3 py-2 font-medium" style={highlightStyle}>
                                                {formatEuroAmount(getPartLineTotal(parts[index]))}
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex flex-col gap-1">
                                                    <button
                                                        type="button"
                                                        className="text-xs text-blue-600 hover:underline text-left"
                                                        onClick={() =>
                                                            onPartsChange([
                                                                ...(parts || []),
                                                                duplicateOfferPartLine(parts[index]),
                                                            ])
                                                        }
                                                    >
                                                        Duplicate
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="text-xs text-red-600 hover:underline text-left"
                                                        onClick={() =>
                                                            onPartsChange(
                                                                (parts || []).filter((_, i) => i !== index),
                                                            )
                                                        }
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
