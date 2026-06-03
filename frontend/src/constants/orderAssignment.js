/** Optional reasons when removing or replacing assigned workers (not when only adding). */
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

/** True if any currently assigned worker is no longer in the new selection. */
export function workersWereRemoved(savedWorkers, selectedOptions) {
  const nextIds = new Set((selectedOptions || []).map((w) => String(w.value)));
  return (savedWorkers || []).some((w) => !nextIds.has(String(w.id)));
}

/** Show reason modal when a worker is removed or replaced (not when only adding). */
export function shouldPromptAssignmentReason(order, selectedOptions) {
  return workersWereRemoved(order?.assignedWorkers, selectedOptions);
}

/** @deprecated use shouldPromptAssignmentReason */
export const assignmentChangeRequiresReason = shouldPromptAssignmentReason;
