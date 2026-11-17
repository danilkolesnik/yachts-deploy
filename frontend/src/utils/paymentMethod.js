export const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash' },
    { value: 'invoice', label: 'Invoice' },
    { value: 'tba', label: 'TBA (To Be Advised)' },
];

export function paymentMethodLabel(value) {
    const key = String(value || '').trim().toLowerCase();
    return PAYMENT_METHODS.find((item) => item.value === key)?.label || 'TBA (To Be Advised)';
}
