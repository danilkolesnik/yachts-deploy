/** Reasons required when changing assigned workers after initial assignment. */
export const ASSIGNMENT_CHANGE_REASONS = [
  { value: 'sick', label: 'Sick leave' },
  { value: 'absent', label: 'Did not show up for work' },
  { value: 'transferred', label: 'Urgently transferred to another boat' },
  { value: 'other', label: 'Other work-related reason' },
];

export function buildAssignmentChangeReason(preset, otherText) {
  if (!preset) return '';
  if (preset === 'other') return String(otherText || '').trim();
  const row = ASSIGNMENT_CHANGE_REASONS.find((r) => r.value === preset);
  return row?.label || preset;
}

export function workersIdsChanged(savedWorkers, selectedOptions) {
  const saved = (savedWorkers || []).map((w) => String(w.id)).sort().join(',');
  const next = (selectedOptions || []).map((w) => String(w.value)).sort().join(',');
  return saved !== next;
}

export function assignmentChangeRequiresReason(order, selectedOptions) {
  const hadWorkers = (order?.assignedWorkers || []).length > 0;
  return hadWorkers && workersIdsChanged(order?.assignedWorkers, selectedOptions);
}
