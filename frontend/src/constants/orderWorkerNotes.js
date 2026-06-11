export const WORKER_NOTE_CATEGORIES = [
    { value: 'not_fit', label: 'Does not fit / не подходит' },
    { value: 'replace', label: 'Needs replacement / нужно заменить' },
    { value: 'missing', label: 'Missing / не хватает' },
    { value: 'other', label: 'Other / другое' },
];

export function getWorkerNoteCategoryLabel(category) {
    const match = WORKER_NOTE_CATEGORIES.find((item) => item.value === category);
    return match?.label || category || 'Other';
}
