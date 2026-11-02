export function parseEuroNumber(value) {
    if (value == null || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const normalized = String(value).trim().replace(/\s/g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

export function createLineKey() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `line-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeOfferService(service) {
    const base = service?.value ?? service ?? {};
    const quantity = parseEuroNumber(base.quantity);
    const unitPrice = parseEuroNumber(base.priceInEuroWithoutVAT);
    return {
        lineKey: base.lineKey || createLineKey(),
        id: base.id,
        serviceName: base.serviceName ?? '',
        serviceNameHr: base.serviceNameHr ?? '',
        priceInEuroWithoutVAT: Number.isFinite(unitPrice) ? unitPrice : 0,
        unitsOfMeasurement: base.unitsOfMeasurement ?? '',
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        descriptionEn: base.descriptionEn ?? '',
        descriptionHr: base.descriptionHr ?? '',
    };
}

export function normalizeOfferPart(part) {
    const label = part?.label ?? part?.partName ?? part?.name ?? '';
    const quantity = parseEuroNumber(part?.quantity ?? part?.value?.quantity);
    const unitPrice = parseEuroNumber(part?.pricePerUnit ?? part?.value?.pricePerUnit);
    return {
        lineKey: part?.lineKey || createLineKey(),
        value: part?.value ?? part?.id,
        label,
        partName: label,
        articleNumber: part?.articleNumber ?? part?.value?.articleNumber ?? '',
        pricePerUnit: Number.isFinite(unitPrice) ? unitPrice : 0,
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        unofficially: Boolean(part?.unofficially),
        descriptionEn: part?.descriptionEn ?? '',
        descriptionHr: part?.descriptionHr ?? '',
    };
}

/** Official warehouse → green; grey warehouse → gray. Internal staff UI only. */
export function getSparePartHighlightColor(part) {
    return part?.unofficially ? 'gray' : 'green';
}

export function getSparePartHighlightStyle(part) {
    return { color: getSparePartHighlightColor(part) };
}

export function getServiceUnitPrice(service) {
    return normalizeOfferService(service).priceInEuroWithoutVAT;
}

export function getServiceQuantity(service) {
    return normalizeOfferService(service).quantity;
}

export function getServiceLineTotal(service) {
    const normalized = normalizeOfferService(service);
    return normalized.quantity * normalized.priceInEuroWithoutVAT;
}

export function getPartUnitPrice(part) {
    return normalizeOfferPart(part).pricePerUnit;
}

export function getPartQuantity(part) {
    return normalizeOfferPart(part).quantity;
}

export function getPartLineTotal(part) {
    const normalized = normalizeOfferPart(part);
    return normalized.quantity * normalized.pricePerUnit;
}

export const DEFAULT_OFFER_VAT_RATE = 0.25;

export function computeOfferTotals(offerOrParts, servicesArg, discountAmountArg, discountPercentArg) {
    let parts = [];
    let services = [];
    let discountAmount = 0;
    let discountPercent = 0;

    if (Array.isArray(offerOrParts) || servicesArg !== undefined) {
        parts = Array.isArray(offerOrParts) ? offerOrParts : [];
        services = servicesArg;
        discountAmount = parseEuroNumber(discountAmountArg);
        discountPercent = parseEuroNumber(discountPercentArg);
    } else {
        const offer = offerOrParts || {};
        parts = Array.isArray(offer.parts) ? offer.parts : [];
        services = offer.services;
        discountAmount = parseEuroNumber(offer.discountAmount);
        discountPercent = parseEuroNumber(offer.discountPercent);
    }

    const partsTotal = parts.reduce(
        (acc, part) => acc + parseEuroNumber(getPartLineTotal(part)),
        0,
    );
    const serviceList = Array.isArray(services) ? services : services ? [services] : [];
    const servicesTotal = serviceList.reduce(
        (acc, service) => acc + parseEuroNumber(getServiceLineTotal(service)),
        0,
    );
    const grossAmount = partsTotal + servicesTotal;

    const percent = Math.max(0, Math.min(100, discountPercent));
    const amountInput = Math.max(0, parseEuroNumber(discountAmount));

    let discount = 0;
    let effectivePercent = 0;
    if (percent > 0) {
        discount = Math.min(grossAmount, (grossAmount * percent) / 100);
        effectivePercent = percent;
    } else if (amountInput > 0) {
        discount = Math.min(grossAmount, amountInput);
        effectivePercent = grossAmount > 0 ? (discount / grossAmount) * 100 : 0;
    }

    const subtotalAfterDiscount = grossAmount - discount;
    const vatAmount = subtotalAfterDiscount * DEFAULT_OFFER_VAT_RATE;
    const grandTotal = subtotalAfterDiscount + vatAmount;

    return {
        partsTotal,
        servicesTotal,
        grossAmount,
        discountPercent: effectivePercent,
        discountAmount: discount,
        subtotalAfterDiscount,
        vatAmount,
        grandTotal,
    };
}

export function formatEuroAmount(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return '0.00';
    return num.toFixed(2);
}

function sameServiceIdentity(a, b) {
    const aId = a?.id ?? a?.value?.id;
    const bId = b?.id ?? b?.value?.id;
    if (aId && bId) return String(aId) === String(bId);
    const aName = a?.serviceName ?? a?.value?.serviceName;
    const bName = b?.serviceName ?? b?.value?.serviceName;
    return Boolean(aName) && aName === bName;
}

function samePartIdentity(a, b) {
    if (a?.value && b?.value) return String(a.value) === String(b.value);
    const aLabel = a?.label ?? a?.partName ?? a?.name;
    const bLabel = b?.label ?? b?.partName ?? b?.name;
    return Boolean(aLabel) && aLabel === bLabel;
}

/**
 * Keep existing line instances (incl. duplicates + descriptions).
 * Append newly selected catalog items; drop lines whose catalog id was deselected.
 */
export function mergeSelectedServices(previous = [], selected = []) {
    const selectedBases = (selected || []).map((item) => item?.value ?? item);
    const kept = (previous || []).filter((prev) =>
        selectedBases.some((sel) => sameServiceIdentity(prev, sel)),
    );

    const keptCounts = new Map();
    for (const line of kept) {
        const key = String(line?.id ?? line?.serviceName ?? '');
        keptCounts.set(key, (keptCounts.get(key) || 0) + 1);
    }

    const selectedCounts = new Map();
    for (const sel of selectedBases) {
        const key = String(sel?.id ?? sel?.serviceName ?? '');
        selectedCounts.set(key, (selectedCounts.get(key) || 0) + 1);
    }

    const next = [...kept];
    for (const sel of selectedBases) {
        const key = String(sel?.id ?? sel?.serviceName ?? '');
        const have = keptCounts.get(key) || 0;
        const want = selectedCounts.get(key) || 0;
        if (have < want) {
            next.push({
                ...sel,
                lineKey: createLineKey(),
                quantity: 1,
                descriptionEn: '',
                descriptionHr: '',
            });
            keptCounts.set(key, have + 1);
        }
    }
    return next;
}

export function mergeSelectedParts(previous = [], selected = []) {
    const selectedOptions = selected || [];
    const kept = (previous || []).filter((prev) =>
        selectedOptions.some((sel) => samePartIdentity(prev, sel)),
    );

    const keptCounts = new Map();
    for (const line of kept) {
        const key = String(line?.value ?? line?.label ?? line?.partName ?? '');
        keptCounts.set(key, (keptCounts.get(key) || 0) + 1);
    }

    const selectedCounts = new Map();
    for (const sel of selectedOptions) {
        const key = String(sel?.value ?? sel?.label ?? '');
        selectedCounts.set(key, (selectedCounts.get(key) || 0) + 1);
    }

    const next = [...kept];
    for (const sel of selectedOptions) {
        const key = String(sel?.value ?? sel?.label ?? '');
        const have = keptCounts.get(key) || 0;
        const want = selectedCounts.get(key) || 0;
        if (have < want) {
            next.push({
                ...sel,
                lineKey: createLineKey(),
                articleNumber: sel.articleNumber ?? '',
                quantity: 1,
                descriptionEn: '',
                descriptionHr: '',
            });
            keptCounts.set(key, have + 1);
        }
    }
    return next;
}

export function duplicateOfferServiceLine(service) {
    const normalized = normalizeOfferService(service);
    return {
        ...normalized,
        lineKey: createLineKey(),
        descriptionEn: '',
        descriptionHr: '',
    };
}

export function duplicateOfferPartLine(part) {
    const normalized = normalizeOfferPart(part);
    return {
        ...normalized,
        lineKey: createLineKey(),
        descriptionEn: '',
        descriptionHr: '',
    };
}
