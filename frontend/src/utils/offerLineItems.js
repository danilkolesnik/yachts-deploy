export function normalizeOfferService(service) {
    const base = service?.value ?? service ?? {};
    const quantity = Number(base.quantity);
    const unitPrice = Number(base.priceInEuroWithoutVAT ?? 0);
    return {
        id: base.id,
        serviceName: base.serviceName ?? '',
        priceInEuroWithoutVAT: Number.isFinite(unitPrice) ? unitPrice : 0,
        unitsOfMeasurement: base.unitsOfMeasurement ?? '',
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    };
}

export function normalizeOfferPart(part) {
    const label = part?.label ?? part?.partName ?? part?.name ?? '';
    const quantity = Number(part?.quantity);
    const unitPrice = Number(part?.pricePerUnit ?? part?.value?.pricePerUnit ?? 0);
    return {
        value: part?.value ?? part?.id,
        label,
        partName: label,
        articleNumber: part?.articleNumber ?? '',
        pricePerUnit: Number.isFinite(unitPrice) ? unitPrice : 0,
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        unofficially: Boolean(part?.unofficially),
    };
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

export function formatEuroAmount(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return '0.00';
    return num.toFixed(2);
}

export function mergeSelectedServices(previous = [], selected = []) {
    return selected.map((item) => {
        const base = item?.value ?? item;
        const existing = (previous || []).find((prev) => {
            const prevBase = prev?.value ?? prev;
            if (prevBase?.id && base?.id) return String(prevBase.id) === String(base.id);
            return prevBase?.serviceName === base?.serviceName;
        });
        const prevBase = existing?.value ?? existing;
        return {
            ...base,
            quantity: Number(prevBase?.quantity) > 0 ? Number(prevBase.quantity) : 1,
        };
    });
}

export function mergeSelectedParts(previous = [], selected = []) {
    return (selected || []).map((option) => {
        const existing = (previous || []).find((prev) => {
            if (prev?.value && option?.value) {
                return String(prev.value) === String(option.value);
            }
            const prevLabel = prev?.label ?? prev?.partName ?? prev?.name;
            return prevLabel && prevLabel === option?.label;
        });
        return {
            ...option,
            quantity: Number(existing?.quantity) > 0 ? Number(existing.quantity) : 1,
        };
    });
}
