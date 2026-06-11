export const WORKER_NOTE_CATEGORIES = [
    { value: 'not_fit', label: 'Does not fit' },
    { value: 'replace', label: 'Needs replacement' },
    { value: 'missing', label: 'Missing' },
    { value: 'other', label: 'Other' },
];

export function getWorkerNoteCategoryLabel(category) {
    const match = WORKER_NOTE_CATEGORIES.find((item) => item.value === category);
    return match?.label || category || 'Other';
}
